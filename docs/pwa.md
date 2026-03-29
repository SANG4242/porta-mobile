# Installing Porta as a PWA

Porta is a [Progressive Web App (PWA)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps):
a website that can be installed on your device and used like a native app.
Once installed, it launches from your home screen or app launcher with
its own window and receives updates automatically.

## How to install

| Platform             | Steps                                                                                                                                                                                                    |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Android (Chrome)** | Tap the browser menu (⋮) → **Install app** or **Add to Home screen**. See [Chrome: Install PWAs](https://support.google.com/chrome/answer/9658361).                                                      |
| **iOS (Safari)**     | Tap the Share button (↑) → **Add to Home Screen**. See [Apple: Add to Home Screen](https://support.apple.com/en-us/108379).                                                                              |
| **Desktop (Chrome)** | Click the install icon (⊕) in the address bar, or go to the browser menu (⋮) → **Install Porta**. See [Chrome: Install PWAs](https://support.google.com/chrome/answer/9658361).                          |
| **Desktop (Edge)**   | Click the install icon (⊕) in the address bar, or go to Settings (···) → **Apps** → **Install Porta**. See [Edge: Install PWAs](https://learn.microsoft.com/en-us/microsoft-edge/progressive-web-apps/). |

## Installing over HTTP (LAN / VPN)

PWA installation normally requires **HTTPS** or `localhost`. If you access
Porta over a LAN or VPN IP (e.g. `http://192.168.1.23:5173`), the browser
hides the install prompt by default. You can override this with a browser flag:

### Chrome (Android / Desktop)

1. Open `chrome://flags/#unsafely-treat-insecure-origin-as-secure`
2. In the text box, enter your Porta URL — e.g. `http://192.168.1.23:5173`
3. Set the flag to **Enabled**
4. Tap **Relaunch** at the bottom to restart the browser
5. Visit Porta again → the install option now appears in the menu (⋮)

### Edge (Android / Desktop)

1. Open `edge://flags/#unsafely-treat-insecure-origin-as-secure`
2. In the text box, enter your Porta URL — e.g. `http://192.168.1.23:5173`
3. Set the flag to **Enabled**
4. Tap **Restart** at the bottom to restart the browser
5. Visit Porta again → the install option now appears in the menu (···)

### iOS (Safari)

Safari does not support this flag. Use **Add to Home Screen** (Share → Add to Home Screen) instead — it works on both HTTP and HTTPS with a similar experience.

> **Tip:** We recommend **Chrome** or **Edge** for the best PWA experience. After installing, Porta opens in its own window without browser UI, just like a native app.
