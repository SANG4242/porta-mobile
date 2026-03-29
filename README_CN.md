# Porta Mobile

[English](README.md) | **中文**

为 [Antigravity](https://antigravity.google/) 打造的增强版手机远程界面 —— 通过轻量级 LSP 桥接，从手机或平板访问本地 Antigravity 会话。

基于 [L1M80](https://github.com/L1M80) 的 [porta](https://github.com/L1M80/porta)（MIT 协议），在实际使用体验、移动端适配和中文支持方面做了改进。

## 相比原版的改进

| 功能 | 说明 |
|---|---|
| **WebSocket 实时推送** | Agent 回复通过 WebSocket 实时推送，无需手动刷新 |
| **命令审批修复** | 修复了 RPC 字段映射错误导致命令审批/拒绝失败的问题 |
| **图片显示** | IDE 端上传的图片现在能在手机端正常显示（通过 proxy 文件端点加载） |
| **模型选择器排序** | 模型列表按名称稳定排序 |
| **新建对话同步** | 在 Porta 中新建的对话会通过 `SendActionToChatPanel` RPC 同步回 IDE |
| **中文工作区名称** | 修复了侧边栏中文工作区名显示乱码的问题（URI 百分号编码解码） |
| **字体大小调节** | 侧边栏可调字体大小，基于 `rem` 方案，跨浏览器兼容 |
| **局域网默认开放** | Vite 开发服务器默认绑定所有网卡（`host: true`），无需额外参数即可局域网访问 |
| **后台静默启动** | 附带 Windows 静默启动脚本，支持开机自启 |

## 快速开始

**前提条件**：[Node.js](https://nodejs.org/) ≥ 22、[pnpm](https://pnpm.io/) ≥ 10，以及一个正在运行的 [Antigravity](https://antigravity.google/) 实例。

> **注意：** Porta 是 Antigravity 的桥接工具。如果 Antigravity 没有运行，proxy 可以启动但无法连接到任何会话。

```bash
git clone https://github.com/SANG4242/porta-mobile.git
cd porta-mobile
pnpm install
cp .env.example .env   # 按需编辑，见下方说明
pnpm dev               # proxy (:3170) + web (:5173)
```

在浏览器中打开 `http://localhost:5173`。

### 局域网 / VPN 远程访问

要从手机或其他设备访问，编辑 `.env`：

```bash
# 设为本机的局域网 IP（或 ZeroTier / Tailscale 的 IP）
PORTA_HOST=192.168.1.23

# 让 Web UI 直连 proxy 的 WebSocket（绕过 Vite 代理）
VITE_WS_BASE=ws://192.168.1.23:3170

# 允许 Web UI 来源的跨域请求
PORTA_CORS_ORIGINS=http://192.168.1.23:5173
```

然后在手机浏览器打开 `http://192.168.1.23:5173`。

> **提示：** 如果需要在外网访问，可以使用 [ZeroTier](https://www.zerotier.com/) 或 [Tailscale](https://tailscale.com/) 在设备间建立虚拟局域网，把 `PORTA_HOST` 设为 VPN 分配的虚拟 IP。

### 后台启动（Windows）

静默运行 Porta，不显示终端窗口：

1. 编辑 `start_porta.bat` —— 确认路径正确（默认使用脚本所在目录）
2. 双击 `start_porta.vbs` 启动（无窗口）
3. （可选）将 `start_porta.vbs` 的快捷方式放到 `shell:startup` 文件夹，实现开机自启

停止方式：打开任务管理器，找到 `node.exe` 进程并结束。

## 工作原理

```
手机浏览器 → Porta Web UI (:5173) → Porta Proxy (:3170) → Antigravity Language Server
```

Porta 不传输屏幕画面，也不把工作区放到云端。它通过 Antigravity Language Server Protocol 传递结构化的对话数据：

- **带宽极低**：传输的是 JSON 消息，不是视频流
- **实时推送**：WebSocket 推送，无需轮询
- **可安装为 PWA**：添加到手机主屏幕，体验接近原生应用（参见 [PWA 安装指南](docs/pwa.md)，局域网 HTTP 访问需一次性配置浏览器 flag）
- **完全本地**：代码和对话数据不离开你的电脑

## 配置参考

| 变量 | 默认值 | 说明 |
|---|---|---|
| `PORTA_HOST` | `127.0.0.1` | Proxy 绑定的 IP。局域网/VPN 访问时改为对应 IP |
| `PORTA_PORT` | `3170` | Proxy 端口 |
| `PORTA_CORS_ORIGINS` | *(空)* | 允许跨域的来源地址，逗号分隔 |
| `VITE_WS_BASE` | *(空)* | WebSocket 直连 URL（如 `ws://192.168.1.23:3170`）。远程访问时必须设置 |
| `VITE_API_BASE` | *(空)* | 生产构建的 API URL（Cloudflare 部署时使用） |

## 局限性

- **Antigravity 必须运行** —— Porta 是桥接工具，不能独立使用
- **仅支持对话** —— 不能编辑代码或使用终端，这些请在本地编辑器中操作
- **单用户** —— 连接一个 Antigravity 实例
- **同侧运行** —— Proxy 必须和 Antigravity 在同一环境中运行（不能一个在 WSL2、一个在 Windows 宿主）

## 文档

- [PWA 安装指南](docs/pwa.md)（推荐 Chrome / Edge 安装为应用）
- [AI 部署指南](docs/ai-deployment-guide.md) / [AI 部署指南（中文）](docs/ai-deployment-guide_cn.md)

## 致谢

本项目基于 [L1M80](https://github.com/L1M80) 的 [porta](https://github.com/L1M80/porta)，使用 [MIT 协议](LICENSE) 授权。

## 许可证

[MIT](LICENSE)
