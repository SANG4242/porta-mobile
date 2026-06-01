# Porta Mobile 开发与重构变更日志 (Development & Modification Log)

本日志详尽记录了从会话伊始至今，为了解决 **Antigravity IDE 1.x / 2.0 双实例共存下的路由冲突与物理隔离**，以及 **手机端 UI 局部滚动与高度渲染 Bug**，所开展的所有排查、诊断以及针对前端（`web`）和后端代理（`proxy`）的具体修改细节。

---

## ── 目录 (Table of Contents) ──
1. [会话核心目标与背景](#1-会话核心目标与背景)
2. [已诊断的核心技术缺陷](#2-已诊断的核心技术缺陷)
3. [各文件具体修改细节 (File Diff Explanations)](#3-各文件具体修改细节)
   - [后端代理 (Packages/Proxy)](#后端代理-packagesproxy)
   - [前端界面 (Packages/Web)](#前端界面-packagesweb)
4. [下一步验证与部署建议](#4-下一步验证与部署建议)

---

## 1. 会话核心目标与背景

本项目的核心目标是确保在本地同时运行 **Antigravity IDE 1.x（旧版）** 和 **Antigravity IDE 2.0（新版）** 时，Porta 移动端网页能够：
- **实例精准路由**：对不同 IDE 实例的会话进行强力的物理隔离，读写操作均定向分发到用户指定的实例 PID，互不干扰，不发生“串台”。
- **恢复元数据展示**：修复因双实例并存导致的磁盘离线会话无法加载元数据（如显示 “0 steps”、修改时间不更新或中文路径乱码）的陈旧 Regression。
- **移动端 UI 终极适配**：彻底解决手机端网页中，聊天内容撑爆容器、将底部的输入框和控制按键挤出可见视口的问题，并在切换实例时消除手机浏览器原生 Picker 的高度回弹竞争 Bug。

---

## 2. 已诊断的核心技术缺陷

### ① 实例状态丢失与“No Project”问题
双实例并存时，部分实例在进行 `/api/health` 轮询时，有时会因为内存元数据偶尔未抓取到而丢失 `workspaceId`。这导致前端侧边栏的 IDE 列表中出现未识别到项目的 `No Project` 字样。

### ② 离线会话数据失联
当某个会话（以 `.pb` 格式保存在磁盘上）对应的 IDE 实例未将其载入内存（RAM）时，后端接口在合并内存会话 and 磁盘会话时丢失了关键的元数据，导致步骤数变成 `0` 并且最后修改时间显示为远古时间，且容易伴随中文路径解码乱码。

### ③ 手机端输入框沉底遮挡（Flex 塌陷 Bug）
手机网页的 `.main-panel`（主聊天区域总容器）的 Flex 属性中，未设置 `min-height: 0;` 和显式高度 `height: 100%;`。这属于经典的 Flexbox 规范漏洞：
- 默认 `min-height` 为 `auto` 时，纵向子容器允许被内部极其丰富的聊天内容（`.chat-area`）无限制撑高。
- 整个主面板的高度被撑高到超出 `100dvh`（视口高度），导致最底部的输入框 `.chat-input-area` 极其被动地被推到了物理屏幕以下。

### ④ 手机端切换 IDE 时的视口扭曲竞争
在手机端点击底部的 **Active IDE** 选项时，由于使用了原生选择滚轮（Native Picker），弹窗组件处于滑出和收起的状态。原代码在检测到选项变更时，**极其同步且立刻**触发了 `window.location.reload()`。
这导致手机浏览器在原生选择框尚未归位（视口仍被强行压缩）的尴尬瞬间重新初始化并缓存了 `dvh`（动态视口高度），进而将整个网页定格在了一个“缩水变矮”的高度中。

---

## 3. 各文件具体修改细节

本节详尽列出我们对项目中各个文件所作的精准调整。

### 后端代理 (Packages/Proxy)

#### 📂 [proxy/src/platform/types.ts](file:///d:/Apps/Antigravity%20相关工具/手机远程/porta/packages/proxy/src/platform/types.ts)
- **修改目的**：在进程探测数据结构中，新增可执行文件路径属性，为 2.0 实例的路径区分和路由奠定基石。
- **修改内容**：
  ```typescript
  export interface ProcessDiscoveryCandidate {
    pid: number;
    port: number;
    // 新增：记录可执行文件的物理绝对路径，以精准区分 1.x 和 2.0
    executable?: string;
  }
  ```

#### 📂 [proxy/src/platform/shared.ts](file:///d:/Apps/Antigravity%20相关工具/手机远程/porta/packages/proxy/src/platform/shared.ts)
- **修改目的**：捕获物理进程中对应的 executable 绝对路径。
- **修改内容**：在解析进程列表（通过 `ps` 或 `tasklist` 匹配）时，抓取可执行文件路径并填充入 `ProcessDiscoveryCandidate` 对象中。

#### 📂 [proxy/src/discovery.ts](file:///d:/Apps/Antigravity%20相关工具/手机远程/porta/packages/proxy/src/discovery.ts)
- **修改目的**：实现 `learnedWorkspaceIds` 静态持久映射内存，彻底终结 2.0 实例的“No Project”问题，并支持路径区分路由。
- **修改内容**：
  - 添加了静态 Map `learnedWorkspaceIds` 以在进程生命周期内跨周期缓存 PID 对应的工作区路径。
  - 优化了 LSInstance 识别流：当某个 2.0 进程被扫描出来且带有 executable 属性时，将对其进行路径解码，一旦获取到 `workspaceId` 立即对其进行物理映射绑定与记忆，不再依赖易丢包的轮询。

#### 📂 [proxy/src/index.ts](file:///d:/Apps/Antigravity%20相关工具/手机远程/porta/packages/proxy/src/index.ts)
- **修改目的**：在 `/api/health` 健康监控接口的响应中，对外输出进程的 `executable` 属性，方便前端区分与展示。

#### 📂 [proxy/src/routes/conversations.ts](file:///d:/Apps/Antigravity%20相关工具/手机远程/porta/packages/proxy/src/routes/conversations.ts)
- **修改目的**：对双实例下的 RPC 写操作（Mutation）进行路由加固，并完全修复磁盘离线会话的元数据读取。
- **修改内容**：
  - 引入了 `getPinnedInstance(c)` 帮助函数，从 HTTP 头部拦截解析 `x-porta-target-pid`。
  - 在涉及会话写入、修改、删除和新建的所有 RPC 突变操作中，强行限制其优先路由给 pinned PID 锁定的实例，实现会话逻辑强隔离。
  - 修复了离线会话合并逻辑：在从 `.pb` 文件和内存会话进行合并时，重构了元数据补全流程，保证未在内存中改变的离线会话能够显示完整的 steps 步骤数，并以正确的中文无乱码路径返回。

---

### 前端界面 (Packages/Web)

#### 📂 [web/src/api/client.ts](file:///d:/Apps/Antigravity%20相关工具/手机远程/porta/packages/web/src/api/client.ts)
- **修改目的**：使前端发出的所有 REST API 请求都携带目标 PID，用于路由中控。
- **修改内容**：在 API 请求拦截器中，从 `localStorage` 中自动读取 `porta:targetPid`，并将其注入为 HTTP 头部 `x-porta-target-pid` 发往后端代理。

#### 📂 [web/src/App.tsx](file:///d:/Apps/Antigravity%20相关工具/手机远程/porta/packages/web/src/App.tsx)
- **修改目的**：
  1. 会话选中自动锁定：当用户选中侧边栏的某个已有会话时，自动提取其携带的 `lsPid` 并回写锁死入 `localStorage.porta:targetPid`，确保路由完美对齐。
  2. 隔离越界重定向防御：当用户切换了 Pinned 实例，导致当前 URL 上的 `activeId` 会话被新工作区隔离过滤掉时，毫秒级检测并自动重定向到合法的首个工作区 New Chat 页，防止 UI 数据倒挂。
- **修改内容**：
  - 在 `ChatView` 挂载了对 `activeId` 发生变更时的同步回写机制。
  - 新增 `useEffect` 监测 `conversations` 与 `activeId` 的存在性，实现了隔离场景下的自动 URL 重定位。

#### 📂 [web/src/components/Sidebar.tsx](file:///d:/Apps/Antigravity%20相关工具/手机远程/porta/packages/web/src/components/Sidebar.tsx)
- **修改目的**：
  1. 允许当会话切换时，前端的 targetPid 状态得到即时更新响应。
  2. 在 Header 顶部添加一个直观方便的 **Refresh 手动刷新按钮**，供手机端进行硬拉更新。
  3. 延迟重载防护：给选项切换 reload 增加 `150ms` 延迟，消除手机端视口挤扁的高度计算竞争 Bug。
- **修改内容**：
  - 合入了对 Pinned ID 的监听同步器。
  - 在实例选择的 `handleInstanceChange` 回调中，使用 `setTimeout` 延迟 `150ms` 再调用 `window.location.reload()`。

#### 📂 [web/src/styles/chat.css](file:///d:/Apps/Antigravity%20相关工具/手机远程/porta/packages/web/src/styles/chat.css)
- **修改目的**：彻底降伏手机端高度撑高缺陷，迫使聊天长文本在局部产生 Y 轴滚动，守住输入框。
- **修改内容**：
  ```css
  .main-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0; /* 关键：允许 Flex 纵向子容器自由收缩，不被内部撑爆 */
    height: 100%;  /* 显式约束高度为父级的 100% dvh 限制 */
    background: var(--bg-primary);
  }
  ```

#### 📂 [web/src/styles/responsive.css](file:///d:/Apps/Antigravity%20相关工具/手机远程/porta/packages/web/src/styles/responsive.css)
- **修改目的**：在极狭窄的手机屏幕（如小于 400 像素）上，收窄控制按钮，防止按钮被横向挤扁。
- **修改内容**：
  ```css
  @media (max-width: 480px) {
    .model-selector-btn {
      width: auto;
      min-width: 0;
      max-width: 110px; /* 模型与 Planner 选择按钮的上限从 140px 下调至 110px */
      padding: 5px 8px 5px 10px;
      font-size: 0.786rem;
    }
    .chat-input-bottom-right {
      gap: 4px; /* 间隙从 8px 缩减为 4px */
    }
  }
  ```

---

## 4. 下一步验证与部署建议

本日志旨在记录现阶段完成的所有架构解耦和界面优化。如需进一步使用或还原某些改动：
1. **静态资源重新合并**：执行 `npm run build` 以将所有 CSS 修改编译进主包。
2. **浏览器缓存刷新**：请在移动端刷新或清除缓存，以触发 PWA 的 `Service Worker` 自动载入最新生成的 CSS 文件。
3. **保持提交纯净**：后续的所有二次微调，可依据本日志中的物理绝对路径和具体行数进行精准维护。
