# System Architecture & Modularity Blueprint

## 1. High-Level Modular Design

The Udayashree School Application uses a decoupled, three-tier modular architecture designed for fault isolation, zero-downtime client updates, and low-cost testing.

```
+-------------------------------------------------------------------------+
|                         NATIVE ANDROID LAYER                            |
|  - MainActivity (WebView Shell with Offline fallback & cache control)   |
|  - NotificationPollService (Background notice fetch & push alerts)      |
|  - BootReceiver (Autostart service on boot)                             |
+------------------------------------+------------------------------------+
                                     | HTTPS (TLS 1.3)
                                     v
+------------------------------------+------------------------------------+
|                         BACKEND SERVICE LAYER                           |
|  server.js (Orchestrator)                                               |
|    |                                                                    |
|    +--> controllers/authController.js (Stamp challenge, OTP, Sessions)  |
|    +--> controllers/dbController.js   (Hierarchical REST API)           |
|    +--> controllers/uploadController.js (Multer MIME security filter)   |
|    +--> controllers/validation.js     (Phone & test bypass normalizer)  |
|    |                                                                    |
|    +--> controllers/dbStorage.js      (Atomic JSON file persistence)    |
|    +--> smsSecurity.js                (HMAC tokens, rate limit, quota)  |
+------------------------------------+------------------------------------+
                                     | Dynamic Web Modules
                                     v
+------------------------------------+------------------------------------+
|                         CLIENT FRONTEND MODULES                         |
|  - modules/api.js        (Unified network client with retry & offline)  |
|  - modules/auth.js       (Client authentication, roles & token storage) |
|  - modules/db.js         (Domain-specific school database operations)   |
|  - modules/validation.js (Client-side input normalization & formatting) |
|  - Portals: admin-*.js, teacher-*.js, parent-*.js                       |
+-------------------------------------------------------------------------+
```

---

## 2. Failure Isolation & Blast Radius Containment

The primary advantage of modular decomposition is **blast radius minimization**:

1. **Database Storage Decoupling (`controllers/dbStorage.js`)**:
   - Disk writes are atomic (`write-to-temp-then-rename`). If the Node process is killed during a write operation, the `.tmp` file is safely discarded and the active `db.json` remains uncorrupted.
   - Any read/write error in database serialization is caught locally, logging a structured error without crashing the Express server.

2. **Authentication Isolation (`controllers/authController.js`)**:
   - All SMS gateway interactions, cryptographic challenge stamps, and OTP validations run inside an isolated Express sub-router.
   - If the external cellular SMS gateway times out or returns an error (e.g., HTTP 502/504), the rest of the application (attendance, marks, grade calculation, file downloads) continues functioning without interruption.

3. **Upload MIME Security (`controllers/uploadController.js`)**:
   - File uploads are validated strictly against an allowlist of safe MIME types (`image/*`, `application/pdf`). Executable files (`.apk`, `.sh`, `.exe`) are rejected before touching disk storage.

4. **Client-Side Service Abstraction (`modules/api.js`)**:
   - `APIService` wraps standard `fetch` with automatic offline detection, network retry logic, and toast notifications. Frontend portal code does not deal with raw HTTP headers or status parsing.

---

## 3. Directory Layout & Responsibility Matrix

| Path | Runtime | Role & Responsibility |
|---|---|---|
| `server.js` | Node.js (CommonJS) | Server entrypoint; mounts routers, sets middleware, serves assets |
| `controllers/authController.js` | Node.js (CommonJS) | Express router for `/api/auth/*` and test bypass logic |
| `controllers/dbController.js` | Node.js (CommonJS) | Express router for `/api/db` (GET, POST, PATCH, DELETE) |
| `controllers/dbStorage.js` | Node.js (CommonJS) | Thread-safe, atomic file persistence engine for `db.json` |
| `controllers/uploadController.js` | Node.js (CommonJS) | Media upload router with extension & MIME type allowlist |
| `controllers/validation.js` | Node.js (CommonJS) | Server-side phone and input sanitation |
| `smsSecurity.js` | Node.js (CommonJS) | Cryptographic challenge stamps, rate limiting, HMAC sessions |
| `modules/api.js` | Browser (ESM) | Reusable HTTP client with error handling and retry loops |
| `modules/auth.js` | Browser (ESM) | Client session manager, token validator, role authorization |
| `modules/db.js` | Browser (ESM) | High-level data access service for students, teachers, results |
| `modules/validation.js` | Browser (ESM) | Client-side phone normalizer and test mode detector |
| `app/` | Android (Java/Gradle) | Native WebView shell and background notification poller |
| `tests/runner.js` | Node.js (ESM) | Polyfilled headless unit test suite verifying all modules |
