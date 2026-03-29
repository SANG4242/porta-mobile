# AI Deployment Guide — Porta Mobile

This document is written for AI coding assistants (Antigravity, Copilot, Cursor, etc.) to follow when helping a user set up Porta Mobile from scratch. It provides step-by-step instructions with exact commands and common pitfalls.

## Prerequisites Check

Before starting, verify the following on the user's machine:

```bash
node --version    # Must be ≥ 22
pnpm --version    # Must be ≥ 10
```

If Node.js is not installed, install via [nvm-windows](https://github.com/coreybutler/nvm-windows) or [fnm](https://github.com/Schniz/fnm).  
If pnpm is not installed: `npm install -g pnpm`

Antigravity must be running. You can verify by checking for the Language Server daemon file:
- **Windows**: `~/.gemini/antigravity/daemon/ls_*.json`
- **Linux/macOS**: `~/.gemini/antigravity/daemon/ls_*.json`

If no `ls_*.json` file exists, Antigravity is not running or has no active workspace.

---

## Step 1: Clone and Install

```bash
git clone https://github.com/SANG4242/porta-mobile.git
cd porta-mobile
pnpm install
```

> **Note:** `pnpm install` may take 1–2 minutes on first run due to dependency resolution.

---

## Step 2: Configure `.env`

Copy the example and edit:

```bash
cp .env.example .env
```

### Local-only access (browser on the same machine)

No changes needed. The defaults (`PORTA_HOST=127.0.0.1`) work out of the box.

### LAN / VPN access (access from phone or another device)

The user needs to provide their machine's IP address. Determine it based on their network setup:

| Network Type | How to Get IP | Example |
|---|---|---|
| Home LAN | `ipconfig` (Windows) / `ip addr` (Linux) | `192.168.1.23` |
| ZeroTier VPN | ZeroTier app → network → managed IP | `10.170.x.x` |
| Tailscale VPN | `tailscale ip -4` | `100.x.x.x` |

Then set these three variables in `.env`:

```bash
PORTA_HOST=<IP>
VITE_WS_BASE=ws://<IP>:3170
PORTA_CORS_ORIGINS=http://<IP>:5173
```

**Example** (ZeroTier IP `10.147.20.50`):

```bash
PORTA_HOST=10.147.20.50
VITE_WS_BASE=ws://10.147.20.50:3170
PORTA_CORS_ORIGINS=http://10.147.20.50:5173
```

### Why is `VITE_WS_BASE` needed?

When accessing from a remote device, the Vite dev server's built-in WebSocket proxy may fail to upgrade the connection (especially over VPN IPs). Setting `VITE_WS_BASE` tells the web UI to connect directly to the proxy's WebSocket endpoint, bypassing Vite's proxy layer entirely.

If `VITE_WS_BASE` is unset, the web UI falls back to the Vite proxy path, which works fine for `localhost` but often breaks for remote IPs.

---

## Step 3: Start Porta

```bash
pnpm dev
```

This starts two services concurrently:
- **Proxy** on port `3170` — bridges the browser to the Antigravity Language Server
- **Web UI** on port `5173` — the React SPA (Vite dev server)

The web UI is configured with `host: true` in `vite.config.ts`, so it's accessible from LAN by default.

### Verify it's working

1. Open `http://<IP>:5173` in a browser
2. You should see the Porta interface with a list of conversations from Antigravity
3. If the sidebar shows conversations, the connection is working

### Common issues

| Symptom | Cause | Fix |
|---|---|---|
| Blank page, no conversations | Antigravity not running | Start Antigravity first |
| Sidebar loads but messages don't stream | `VITE_WS_BASE` not set or wrong IP | Set `VITE_WS_BASE=ws://<IP>:3170` in `.env` |
| CORS error in browser console | `PORTA_CORS_ORIGINS` missing | Add `http://<IP>:5173` to `PORTA_CORS_ORIGINS` |
| Proxy starts but can't find LS | Porta and Antigravity on different sides (e.g. Windows vs WSL2) | Run Porta from the same environment as Antigravity |
| Port 3170 or 5173 already in use | Another instance running | Kill existing `node.exe` processes or change ports |

---

## Step 4: Background Startup (Windows, Optional)

For headless operation (no terminal window), the project includes two scripts:

### `start_porta.bat`

Edit this file to match the user's local paths:

```bat
@echo off
cd /d "<PATH_TO_PORTA_DIRECTORY>"
"<PATH_TO_PNPM_CMD>" dev
```

To find the pnpm path: `where pnpm` or `Get-Command pnpm | Select-Object Source`

### `start_porta.vbs`

This VBS wrapper runs the `.bat` file without showing a window. It uses relative paths internally, so it works as long as it's in the same directory as `start_porta.bat`.

### Auto-start at boot

1. Press `Win+R`, type `shell:startup`, press Enter
2. Create a shortcut to `start_porta.vbs` in the opened folder
3. Porta will now start silently when Windows boots

### Stopping Porta

```powershell
# Find and kill Node.js processes (caution: kills ALL node processes)
taskkill /f /im node.exe

# Or use Task Manager to selectively kill porta-related node processes
```

---

## Architecture Reference

```
Phone Browser
    ↓ HTTP (port 5173)
Porta Web UI (Vite dev server)
    ↓ WebSocket (port 3170, or via VITE_WS_BASE)
Porta Proxy
    ↓ Connect RPC (HTTPS, localhost, dynamic port)
Antigravity Language Server
```

### Key files

| File | Purpose |
|---|---|
| `packages/proxy/src/index.ts` | Proxy entry point |
| `packages/proxy/src/rpc.ts` | Connect RPC communication with Language Server |
| `packages/proxy/src/ws.ts` | WebSocket handling for real-time streaming |
| `packages/proxy/src/routes/conversations.ts` | Conversation CRUD and command approval |
| `packages/web/src/App.tsx` | Main React app component |
| `packages/web/src/hooks/useStepsStream.ts` | WebSocket streaming hook |
| `packages/web/src/hooks/useFontSize.ts` | Font size control hook |
| `packages/web/src/components/ChatPanel.tsx` | Chat display (includes image support) |
| `packages/web/src/components/Sidebar.tsx` | Sidebar with workspace list and font control |
| `packages/web/vite.config.ts` | Vite config (`host: true` for LAN access) |
| `.env` | Runtime configuration (not committed) |
| `.env.example` | Configuration template |

### How LS discovery works

The proxy finds the running Antigravity Language Server by:
1. Reading `~/.gemini/antigravity/daemon/ls_*.json` (preferred)
2. Falling back to scanning process command-line arguments (Linux/macOS)

The JSON file contains the LS port and CSRF token needed for RPC calls.

---

## Updating from Upstream

If you want to merge improvements from the original [porta](https://github.com/L1M80/porta):

```bash
git remote add upstream https://github.com/L1M80/porta.git
git fetch upstream
git merge upstream/develop    # or: git rebase upstream/develop
```

Resolve any conflicts, then test with `pnpm dev`.
