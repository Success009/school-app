# Security Bridges, Native Updates & Offline Architecture

## 1. Security Vulnerability Analysis Across System Bridges

The application operates across four communication boundaries. Below is the threat model, vulnerability audit, and hardened mitigations implemented at each bridge:

```
[ Android Native Shell ] <---(Bridge 1)---> [ WebView / Frontend ]
                                                   |
                                              (Bridge 2)
                                                   |
                                                   v
[ Cellular SMS Gateway ] <---(Bridge 3)---> [ Node.js Server ]
```

---

### Bridge 1: Android Native Shell <--> WebView
* **Threat 1: JavaScript Interface RCE (Remote Code Execution)**
  - *Risk*: Exposing `@JavascriptInterface` allows malicious scripts to invoke native Java methods on the device.
  - *Mitigation*: We do **not** bind any Java objects into the WebView JavaScript namespace (`webView.addJavascriptInterface` is completely omitted). Communication is purely via URL loading and standard DOM events.
* **Threat 2: Mixed Content Hijacking (MitM)**
  - *Risk*: Previously `MIXED_CONTENT_ALWAYS_ALLOW` was enabled, which allowed insecure HTTP assets over HTTPS, enabling man-in-the-middle code injection on public Wi-Fi.
  - *Mitigation*: Hardened in `MainActivity.java` to `MIXED_CONTENT_NEVER_ALLOW`.
* **Threat 3: Sandbox File Exfiltration**
  - *Risk*: Malicious scripts accessing `file:///` URLs to read private app databases or preferences.
  - *Mitigation*: Hardened in `MainActivity.java`:
    ```java
    webSettings.setAllowFileAccess(false);
    webSettings.setAllowContentAccess(false);
    ```

---

### Bridge 2: WebView / Client <--> Node.js Server
* **Threat 1: Session Hijacking & Replay**
  - *Mitigation*: Persistent sessions are signed using `HMAC-SHA256` with a server-side secret (`SESSION_SECRET`). Tokens are transmitted via standard `Authorization: Bearer <token>` headers over TLS 1.3 HTTPS.
* **Threat 2: Anti-Drain SMS Spam**
  - *Mitigation*: Single-use HMAC challenge stamps (`/api/auth/stamp`), database phone whitelisting, and strict per-IP / per-phone cooldown rate limits.
* **Threat 3: Arbitrary File Upload Injection**
  - *Mitigation*: `controllers/uploadController.js` enforces a strict MIME whitelist (JPEG, PNG, WEBP, PDF) and generates random filenames, rejecting executable code (`.apk`, `.sh`, `.exe`, `.js`).

---

### Bridge 3: Node.js Server <--> Cellular SMS Gateway
* **Threat: Gateway Impersonation & Unauthorized Dispatch**
  - *Mitigation*: The SMS Gateway accepts requests only with the static header `X-Gateway-Token: Udaya@momphone` over a private Tailscale tunnel (`100.120.244.95`). External internet actors cannot reach the gateway port directly.

---

## 2. Updating the Android Application Itself (APK Binary)

### The Two Layers of Code
1. **Dynamic Web Layer (99% of Application Changes)**:
   - Portal dashboards, attendance forms, mark inputs, stylesheets, exam schedules.
   - **How it updates**: Hosted dynamically on `https://school.success0.com.np`. When you update the server, **every phone receives updates immediately upon next launch**. No APK download or Play Store review is needed.
2. **Native Android Binary Layer (1% of Application Changes)**:
   - Android native manifest, notification channel definitions, hardware camera/push bindings.
   - **How it updates**: Must be distributed through the Google Play Store.
   - **Google Play In-App Updates API**: To notify users when a new APK binary is required, integrate Google Play's official `com.google.android.play:app-update`:
     - *Flexible Update*: Downloads quietly in background while user uses the app.
     - *Immediate Update*: Fullscreen blocking prompt for critical native security patches.

---

## 3. Offline Capabilities for Parents & Teachers

In regions with poor cellular connectivity, parents and teachers still need access to core academic records:

### Client-Side Engine (`modules/offlineStore.js`)
* **Cached Records**:
  - **Parents**: Student profile, latest terminal report cards, year-to-date attendance statistics, emergency announcements.
  - **Teachers**: Class student rosters, assigned subjects, period timings.
* **Intelligent WebView Cache Fallback (`MainActivity.java`)**:
  - When online: `webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);`
  - When offline: `webSettings.setCacheMode(WebSettings.LOAD_CACHE_ELSE_NETWORK);`
* **Offline Indicator Banner**:
  - When viewing cached data without connectivity, `OfflineStore.renderOfflineBadge` displays a non-intrusive alert:
    `⚡ Offline Mode • Showing cached record from [Date]`

---

## 4. Context-Efficient AI Architecture (Developing Modules in Isolation)

To allow language models and human engineers to modify a single module without loading the entire project context into memory:

1. **Self-Contained Contracts**: Every module (e.g., `modules/offlineStore.js`, `controllers/dbStorage.js`) defines a zero-dependency API with explicit input/output signatures at the top of the file.
2. **Dedicated Standalone Unit Tests**:
   - Each module has an isolated standalone test:
     ```bash
     node tests/offlineStore.test.js
     ```
   - A model only needs to inspect `modules/offlineStore.js` and `tests/offlineStore.test.js`, run the command, verify the change, and finish—saving thousands of prompt tokens and eliminating regression risks.
