# Project Status & Milestone Tracker

## Current Status: ACTIVE / HIGH STABILITY / PRODUCTION-TESTED

### Completed Architectural Milestones

1. **Cellular SMS Gateway & Asynchronous Device Listener**:
   - Integrated with private cellular gateway API at `https://sms.success0.com.np` (routed to gateway daemon on `100.89.137.102:8090`).
   - Server architecture verified on host `100.89.137.102` (`/opt/school-sms-gateway`):
     - Uses `sms_queue.py` and persistent SSE long-poll streams (`/api/v1/gateway/stream`).
     - Asynchronously dispatches outbound OTP jobs to connected hardware devices (`vivo V2333`).
     - In-memory dispatch queue with 300-second TTL prevents duplicate job starvation.

2. **Multi-Layered Security & Anti-Drain System (`smsSecurity.js`)**:
   - Cryptographic anti-tamper stamps (`GET /api/auth/stamp`) using HMAC-SHA256 with 300-second validity and anti-replay nonces.
   - Timing-safe signature comparisons protected against byte-length errors.
   - School database phone whitelist verification before gateway dispatch.
   - Enforced 60-second per-phone cooldown and 10-minute per-IP rate limits.

3. **Platform-Aware Authentication & Origin Identification**:
   - Authentication system (`controllers/authController.js` and `smsSecurity.js`) distinguishes whether client originates from:
     - The web browser (`platform: 'web'`, session TTL: 30 days)
     - The native Android app (`platform: 'android_app'`, session TTL: 90 days)
   - Identified via `X-Client-Platform` header, `window.AndroidAppBridge`, and custom User-Agent tokens (`UdayashreeSchoolApp/1.0`).
   - Session tokens are signed cryptographically with platform tags embedded in payload.

4. **Zero-Cost Developer Bypass Mode (`..` Prefix)**:
   - Prefixing registered numbers with `..` (e.g., `..9765954850`) bypasses SMS transmission without incurring cellular charges.
   - Accepts 4, 5, or 6 zeros (`0000`, `00000`, or `000000`). Typing `0000` auto-completes and verifies instantly.
   - **Zero Consumer Leakage**: Client UI displays clean numbers (`+977 9765954850`), with no test keywords, flags, or backdoor terminology exposed.
   - **Protection against Brute Force**: Any standard consumer number entering `000000` without the `..` prefix is strictly rejected and routed to the gateway.

5. **Real-Time Push Notifications & Background Service (`controllers/notificationController.js`)**:
   - Fully modular notification router mounted at `/api/notifications`.
   - Android background polling service (`NotificationPollService.java`) queries `/api/notifications/poll` every 15 minutes or receives immediate notices.
   - Real system notification tray alerts raised using Android `NotificationChannel` with high priority.
   - In-app notices and broadcasts sent via admin or SMS broadcasts automatically mirror into the notification queue.
   - **Zero App Rebuilds Required**: All functional screens, dashboards, and logic are delivered directly via the web app (`https://school.success0.com.np`).

6. **Production Obfuscation & Comment Stripping (`build-prod.js`)**:
   - Automated Terser-based production pipeline removes all code comments, minifies identifiers, and obfuscates scripts in `dist/`.
   - Leaves development code unminified and readable for rapid debugging during development.

7. **Server Modularization (`server.js` & `controllers/`)**:
   - Decoupled `server.js` into modular controllers (`controllers/authController.js`, `controllers/dbController.js`, `controllers/uploadController.js`, `controllers/notificationController.js`, `controllers/dbStorage.js`).
   - Implemented atomic database writes (`write-to-temp-then-rename`) in `DbStorageService`.
   - Restricted file uploads to safe MIME types (`image/*`, `application/pdf`) to comply with Google Play security policies.

8. **WebView & System Bridge Security Hardening (`MainActivity.java`)**:
   - Replaced mixed content allowances with `MIXED_CONTENT_NEVER_ALLOW`.
   - Disabled local file access (`setAllowFileAccess(false)`, `setAllowContentAccess(false)`).
   - Zero `@JavascriptInterface` attack surface, eliminating RCE vulnerability.

9. **Offline Capability Layer (`modules/offlineStore.js`)**:
   - LocalStorage cache for student records and teacher rosters.
   - Intelligent fallback via `WebSettings.LOAD_CACHE_ELSE_NETWORK` when offline.

10. **Automated Test Suite**:
   - 34/34 unit tests passing across client, server, and offline modules (`npm test`).
   - 4/4 standalone offline store tests passing (`node tests/offlineStore.test.js`).

---

## Active Configuration

- **Production Web Application**: `https://school.success0.com.np`
- **Production Server**: `root@100.89.137.102` (`/home/bb/school-app-server`)
- **SMS Gateway Server**: `https://sms.success0.com.np` (daemon port 8090)
- **Mobile Test Device**: Connected at `root@100.120.244.95` (`32a5a9ae`)
- **Current App Package**: `com.udayashree.schoolapp.debug`
