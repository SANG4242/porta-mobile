# AI 部署指南 — Porta Mobile

本文档面向 AI 编程助手（Antigravity、Copilot、Cursor 等），提供从零部署 Porta Mobile 的完整步骤。

## 环境检查

开始前，检查用户机器上的环境：

```bash
node --version    # 必须 ≥ 22
pnpm --version    # 必须 ≥ 10
```

Node.js 未安装时，推荐通过 [nvm-windows](https://github.com/coreybutler/nvm-windows) 或 [fnm](https://github.com/Schniz/fnm) 安装。  
pnpm 未安装时：`npm install -g pnpm`

Antigravity 必须正在运行，可以通过检查 Language Server 守护进程文件确认：
- **Windows / Linux / macOS**：`~/.gemini/antigravity/daemon/ls_*.json`

如果没有 `ls_*.json` 文件，说明 Antigravity 没有运行或没有打开的工作区。

---

## 第一步：克隆与安装

```bash
git clone https://github.com/SANG4242/porta-mobile.git
cd porta-mobile
pnpm install
```

> **注：** 首次运行 `pnpm install` 可能需要 1-2 分钟。

---

## 第二步：配置 `.env`

```bash
cp .env.example .env
```

### 仅本机访问（浏览器在同一台电脑上）

不需要修改。默认 `PORTA_HOST=127.0.0.1` 即可使用。

### 局域网 / VPN 远程访问（从手机或其他设备访问）

需要用户提供本机 IP 地址，根据网络配置获取：

| 网络类型 | 获取方式 | 示例 |
|---|---|---|
| 家庭局域网 | `ipconfig`（Windows）/ `ip addr`（Linux） | `192.168.1.23` |
| ZeroTier VPN | ZeroTier 应用 → 网络 → Managed IP | `10.170.x.x` |
| Tailscale VPN | `tailscale ip -4` | `100.x.x.x` |

在 `.env` 中设置以下三个变量：

```bash
PORTA_HOST=<IP>
VITE_WS_BASE=ws://<IP>:3170
PORTA_CORS_ORIGINS=http://<IP>:5173
```

**示例**（ZeroTier IP `10.147.20.50`）：

```bash
PORTA_HOST=10.147.20.50
VITE_WS_BASE=ws://10.147.20.50:3170
PORTA_CORS_ORIGINS=http://10.147.20.50:5173
```

### 为什么需要 `VITE_WS_BASE`？

从远程设备访问时，Vite 开发服务器内置的 WebSocket 代理可能无法完成连接升级（尤其是通过 VPN IP 时）。设置 `VITE_WS_BASE` 让 Web UI 直接连接 Proxy 的 WebSocket 端点，绕过 Vite 的代理层。

如果不设置 `VITE_WS_BASE`，Web UI 会回退到 Vite 代理路径，在 `localhost` 下能正常工作，但在远程 IP 下通常会失败。

---

## 第三步：启动 Porta

```bash
pnpm dev
```

会同时启动两个服务：
- **Proxy**（端口 `3170`）—— 桥接浏览器和 Antigravity Language Server
- **Web UI**（端口 `5173`）—— React SPA（Vite 开发服务器）

`vite.config.ts` 中已设置 `host: true`，Web UI 默认对局域网开放。

### 验证是否正常运行

1. 在浏览器中打开 `http://<IP>:5173`
2. 应该能看到 Porta 界面，侧边栏显示 Antigravity 的对话列表
3. 如果侧边栏有对话显示，说明连接正常

### 常见问题排查

| 现象 | 原因 | 解决方法 |
|---|---|---|
| 空白页面，没有对话 | Antigravity 没有运行 | 先启动 Antigravity |
| 侧边栏加载但消息不推送 | `VITE_WS_BASE` 未设置或 IP 不对 | 在 `.env` 中设置 `VITE_WS_BASE=ws://<IP>:3170` |
| 浏览器控制台报 CORS 错误 | `PORTA_CORS_ORIGINS` 未设置 | 添加 `http://<IP>:5173` 到 `PORTA_CORS_ORIGINS` |
| Proxy 启动但找不到 LS | Porta 和 Antigravity 在不同环境（如 Windows vs WSL2） | 让 Porta 和 Antigravity 在同一个环境中运行 |
| 端口 3170 或 5173 被占用 | 有其他实例在运行 | 终止已有的 `node.exe` 进程或更换端口 |

---

## 安装为应用（PWA，推荐）

为了获得最佳手机体验，建议将 Porta 安装为 PWA —— 它会以独立窗口运行，没有浏览器地址栏和工具栏，体验接近原生应用。

### 浏览器 flag 配置（HTTP 局域网访问必需）

PWA 安装通常要求 HTTPS。由于 Porta 在局域网/VPN 下使用 HTTP，需要一次性配置浏览器 flag：

**Chrome**（Android / 桌面端）：
1. 地址栏输入 `chrome://flags/#unsafely-treat-insecure-origin-as-secure`
2. 在文本框中填入 Porta 的访问地址（如 `http://192.168.1.23:5173`）
3. 将开关设为 **Enabled** → 点击底部 **Relaunch** 重启浏览器

**Edge**（Android / 桌面端）：
1. 地址栏输入 `edge://flags/#unsafely-treat-insecure-origin-as-secure`
2. 在文本框中填入 Porta 的访问地址（如 `http://192.168.1.23:5173`）
3. 将开关设为 **Enabled** → 点击底部 **重启** 按钮

重启后重新访问 Porta，浏览器菜单中即可看到 **安装应用** / **添加到主屏幕** 选项。

> **提示：** iOS Safari 无需此配置，直接使用 分享 → **添加到主屏幕** 即可。

---

## 第四步：后台启动（Windows，可选）

项目附带两个脚本用于无窗口运行：

### `start_porta.bat`

确认路径正确即可（默认使用 `%~dp0` 获取脚本所在目录）。如果 `pnpm` 不在 PATH 中，需要替换为完整路径。

查找 pnpm 路径：`where pnpm` 或 `Get-Command pnpm | Select-Object Source`

### `start_porta.vbs`

VBS 包装脚本，以无窗口方式运行 `.bat` 文件。内部使用相对路径，只要和 `start_porta.bat` 在同一目录即可。

### 开机自启

1. `Win+R` → 输入 `shell:startup` → 回车
2. 在打开的文件夹中创建 `start_porta.vbs` 的快捷方式
3. Windows 启动时 Porta 会自动静默运行

### 停止 Porta

```powershell
# 终止所有 Node.js 进程（注意：会停掉所有 node 进程）
taskkill /f /im node.exe

# 或在任务管理器中手动选择 porta 相关的 node 进程终止
```

---

## 架构参考

```
手机浏览器
    ↓ HTTP（端口 5173）
Porta Web UI（Vite 开发服务器）
    ↓ WebSocket（端口 3170，或通过 VITE_WS_BASE 直连）
Porta Proxy
    ↓ Connect RPC（HTTPS，localhost，动态端口）
Antigravity Language Server
```

### 关键文件

| 文件 | 作用 |
|---|---|
| `packages/proxy/src/index.ts` | Proxy 入口 |
| `packages/proxy/src/rpc.ts` | 与 Language Server 的 Connect RPC 通信 |
| `packages/proxy/src/ws.ts` | WebSocket 实时推送处理 |
| `packages/proxy/src/routes/conversations.ts` | 对话增删改查和命令审批 |
| `packages/web/src/App.tsx` | React 主组件 |
| `packages/web/src/hooks/useStepsStream.ts` | WebSocket 流式推送 hook |
| `packages/web/src/hooks/useFontSize.ts` | 字体大小调节 hook |
| `packages/web/src/components/ChatPanel.tsx` | 对话展示（含图片支持） |
| `packages/web/src/components/Sidebar.tsx` | 侧边栏（工作区列表、字体调节） |
| `packages/web/vite.config.ts` | Vite 配置（`host: true` 局域网开放） |
| `.env` | 运行时配置（不提交到 git） |
| `.env.example` | 配置模板 |

### LS 发现机制

Proxy 通过以下方式找到正在运行的 Antigravity Language Server：
1. 读取 `~/.gemini/antigravity/daemon/ls_*.json`（首选）
2. 回退到扫描进程命令行参数（Linux/macOS）

JSON 文件包含 LS 端口和 CSRF token，用于 RPC 调用。

---

## 同步上游更新

如果想合并原版 [porta](https://github.com/L1M80/porta) 的改进：

```bash
git remote add upstream https://github.com/L1M80/porta.git
git fetch upstream
git merge upstream/develop    # 或：git rebase upstream/develop
```

解决冲突后，用 `pnpm dev` 测试。
