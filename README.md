# Porta Mobile

**English** | [中文](README_CN.md)

Enhanced mobile interface for [Antigravity](https://antigravity.google/) — access your local Antigravity sessions from your phone or tablet through a lightweight LSP bridge.

Based on [porta](https://github.com/L1M80/porta) by L1M80 (MIT License), with improvements focused on real-world usability, mobile experience, and CJK language support.

## What's Different from Upstream

This fork includes the following improvements over the [original porta](https://github.com/L1M80/porta):

| Feature | Description |
|---|---|
| **WebSocket Real-time Streaming** | Agent responses now stream in real-time via WebSocket, instead of requiring manual refresh |
| **Command Approval Fix** | Fixed RPC field mapping errors that broke the approve/reject flow for agent-proposed commands |
| **Image Display** | Images uploaded from the IDE are now visible in the mobile interface (via proxy file endpoint) |
| **Model Selector Sorting** | Model list is now sorted by label for consistent ordering |
| **New Conversation Sync** | Conversations created in Porta are synced back to the IDE via `SendActionToChatPanel` RPC |
| **CJK Workspace Names** | Fixed garbled Chinese/Japanese/Korean characters in workspace names (URI percent-encoding decode) |
| **Font Size Control** | Adjustable font size from the sidebar, using `rem`-based scaling for cross-browser compatibility |
| **LAN-Ready by Default** | Vite dev server binds to all interfaces (`host: true`), no extra flags needed for LAN access |
| **Background Startup** | Included scripts for silent background startup and Windows auto-start at boot |

## Quick Start

**Prerequisites**: [Node.js](https://nodejs.org/) ≥ 22, [pnpm](https://pnpm.io/) ≥ 10, and a running [Antigravity](https://antigravity.google/) instance.

> **Note:** Porta is a bridge to Antigravity. If Antigravity is not running, the proxy will start but cannot connect to any session.

```bash
git clone https://github.com/SANG4242/porta-mobile.git
cd porta-mobile
pnpm install
cp .env.example .env   # edit to match your setup
pnpm dev               # proxy (:3170) + web (:5173)
```

Open `http://localhost:5173` in your browser.

### LAN / Remote Access

To access from your phone or another device on your network, edit `.env`:

```bash
# Set to this machine's LAN IP (or ZeroTier/Tailscale IP)
PORTA_HOST=192.168.1.23

# Allow the web UI to connect WebSocket directly to the proxy
VITE_WS_BASE=ws://192.168.1.23:3170

# Allow CORS from the web UI origin
PORTA_CORS_ORIGINS=http://192.168.1.23:5173
```

Then open `http://192.168.1.23:5173` on your phone.

> **Tip:** For access outside your home network, you can use [ZeroTier](https://www.zerotier.com/) or [Tailscale](https://tailscale.com/) to create a virtual LAN between your devices. Set `PORTA_HOST` to the virtual IP assigned by your VPN.

### Background Startup (Windows)

To run Porta silently in the background:

1. Edit `start_porta.bat` — update the paths to match your setup
2. Double-click `start_porta.vbs` to start without a visible window
3. (Optional) Copy a shortcut to `start_porta.vbs` into `shell:startup` for auto-start at boot

To stop: open Task Manager, find `node.exe` processes, and end them.

## How It Works

```
Phone Browser → Porta Web UI (:5173) → Porta Proxy (:3170) → Antigravity Language Server
```

Porta doesn't stream pixels or run your workspace in the cloud. It relays structured conversation data through the Antigravity Language Server Protocol:

- **Near-zero bandwidth**: JSON messages, not video frames
- **Real-time streaming**: WebSocket push, no polling
- **Installable PWA**: add to home screen for a native app feel
- **Full privacy**: your code and conversations never leave your machine

## Configuration Reference

| Variable | Default | Description |
|---|---|---|
| `PORTA_HOST` | `127.0.0.1` | IP to bind the proxy. Use a LAN/VPN IP for remote access |
| `PORTA_PORT` | `3170` | Proxy port |
| `PORTA_CORS_ORIGINS` | *(empty)* | Comma-separated allowed origins for CORS |
| `VITE_WS_BASE` | *(empty)* | WebSocket URL for direct proxy connection (e.g. `ws://192.168.1.23:3170`). Required when accessing from a remote device |
| `VITE_API_BASE` | *(empty)* | API URL for production builds (Cloudflare deployment) |

## Limitations

- **Antigravity must be running** — Porta is a bridge, not a standalone tool
- **Chat only** — no code editing or terminal access; use your local editor for that
- **Single user** — connects to one Antigravity instance
- **Same-side requirement** — the proxy must run on the same machine (or same environment, e.g. not WSL2 vs Windows host) as Antigravity

## Documentation

- [中文文档 (Chinese README)](README_CN.md)
- [AI Deployment Guide](docs/ai-deployment-guide.md) / [AI 部署指南](docs/ai-deployment-guide_cn.md)
- [PWA Installation](docs/pwa.md)

## Credits

This project is based on [porta](https://github.com/L1M80/porta) by [L1M80](https://github.com/L1M80), licensed under the [MIT License](LICENSE).

## License

[MIT](LICENSE)
