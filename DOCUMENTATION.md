# Udayashree School App - Technical Reference Manual (v5.0)

This manual documents the **Modular Distributed Architecture**, backend data access layers, cryptographic stamp security engine, SMS & OTP gateway integration, persistent session authentication system, Android client layer, and unit testing infrastructure of the Udayashree School Management System.

---

## 1. Project Overview & Architecture

The Udayashree School App is a lightweight, responsive management system designed for primary and middle school operations (strictly Classes 1 to 8).

### 1.1 Tech Stack
- **Frontend**: Vanilla JavaScript (ES6+), Tailwind CSS, static HTML shells.
- **Backend**: Node.js + Express (`server.js`) hosting JSON-backed persistent data (`db.json`), cryptographic stamp verification, and static uploads (`/uploads`).
- **SMS & OTP Engine**: Integrated gateway (`https://sms.success0.com.np`) with `X-Gateway-Token` authorization, anti-tamper stamp validation, per-phone cooldown timers, IP rate limiting, and persistent session tokens (`smsSecurity.js`).
- **Android Client**: Native Java wrapper (`MainActivity.java`), background notification poller (`NotificationPollService.java`), secure URI validator (`SecurityUtils.java`), and native SMS gateway client (`SchoolSmsService.java`).
- **Testing**: Zero-dependency Node.js test runner (`tests/runner.js`) with isolated polyfills and 27 test suites.
- **CI / CD**: GitHub Actions (`.github/workflows/test.yml`), automated pre-commit hook (`.git/hooks/pre-commit`), and one-command deployment script (`deploy.sh`).

---

## 2. Directory Structure

```
├── .github/
│   └── workflows/
│       ├── static.yml            # GitHub Pages deployment workflow
│       └── test.yml              # CI automated unit test runner workflow
├── .git/hooks/
│   └── pre-commit                # Automated pre-commit test validation hook
├── app/                          # Native Android wrapper project (Gradle)
│   └── app/src/
│       ├── main/java/.../
│       │   ├── BootReceiver.java          # Boot receiver for background tasks
│       │   ├── MainActivity.java          # Fullscreen WebView native shell
│       │   ├── NotificationHelper.java    # Android notification channels & banners
│       │   ├── NotificationPollService.java # Long-polling notification service
│       │   ├── SchoolSmsModels.java       # Typed SMS request and response DTOs
│       │   ├── SchoolSmsService.java      # OkHttp/HttpURLConnection SMS API client
│       │   └── SecurityUtils.java         # Allowed host validation & sanitization
│       └── test/java/.../
│           ├── SchoolSmsModelsTest.java   # Android unit tests for SMS models
│           └── SecurityUtilsTest.java     # Android unit tests for security rules
├── modules/                      # Modular browser services & DAL
│   ├── api.js                   # APIService (HTTP methods, uploads, offline handling)
│   ├── auth.js                  # AuthService (Sessions, OTP, stamps, role guards)
│   ├── db.js                    # DatabaseService (Comprehensive Data Access Layer)
│   └── package.json             # ES module declaration
├── tests/
│   ├── runner.js                # Complete unit test suite (27 suites / all functions)
│   └── package.json             # Test configuration
├── uploads/                     # Upload directory for student/teacher photo assets
├── admin.html                   # Admin dashboard portal
├── teacher.html                 # Teacher & attendance portal
├── parent.html                  # Parent & student report card portal
├── index.html                   # Single sign-on and 6-digit OTP login screen
├── login.js                     # Login controller with auto-advance OTP & paste support
├── shared.js                    # Compatibility adapter and mock Firebase interfaces
├── smsSecurity.js               # Cryptographic stamp engine & SMS gateway proxy
├── server.js                    # Local & production Express backend API
├── db.json                      # Local JSON persistence store
├── deploy.sh                    # Automated test, commit, push, and remote deploy script
├── package.json                 # Project dependencies & npm scripts
├── DEVELOPMENT_PLAN.md          # Architectural roadmap and completed milestones
├── MODEL_CONTEXT.md             # Developer context & defensive guidelines
└── PROJECT_STATUS.md            # Current operational status & changelog
```

---

## 3. SMS & OTP Security Architecture

The SMS system provides military-grade security against spam, credential abuse, clock manipulation, and replay attacks.

### 3.1 Anti-Tampering Challenge Stamps (`/api/auth/stamp`)
Before any OTP request can be submitted:
1. The client requests a challenge stamp from `GET /api/auth/stamp`.
2. The server generates a unique payload: `${timestamp}.${nonce}.${signature}`:
   - `timestamp`: Milliseconds since epoch.
   - `nonce`: Cryptographically secure 16-byte random hex string.
   - `signature`: HMAC-SHA256 of `${timestamp}:${nonce}` signed with `STAMP_SECRET`.
3. The stamp expires after 5 minutes (`300000 ms`).
4. Replay attacks are prohibited: each `nonce` is logged in an in-memory ledger and rejected if reused.
5. All signature comparisons use `crypto.timingSafeEqual` with byte-length verification to prevent timing attacks.

### 3.2 Cooldowns and Rate Limiting
- **Per-Phone Cooldown**: 60 seconds between successive OTP requests to the same mobile number.
- **Hourly Phone Quota**: Maximum 5 OTP requests per hour per phone number.
- **IP Rate Limit**: Maximum 10 OTP requests per 10-minute window per IP.
- **Phone Whitelisting**: The system verifies that the phone number exists in `db.json` under admin, teacher, or parent mapping before issuing an SMS.

### 3.3 Persistent Sessions (One-Time Authentication)
Users do not need to re-authenticate every time they launch or refresh the application:
1. Upon successful OTP verification, the server generates a persistent HMAC-signed session token (`base64Url(payload).signature`).
2. The client stores the token in `localStorage`.
3. On page launch, `AuthService.validateSession()` calls `POST /api/auth/session/verify`.
4. If valid, the user is directly navigated to their role dashboard (`admin.html`, `teacher.html`, or `parent.html`) without prompting for login.

---

## 4. API Endpoints Reference

### 4.1 Authentication & SMS Endpoints
- **`GET /api/auth/stamp`**
  - Generates a fresh cryptographic challenge stamp.
  - Response: `{ "success": true, "stamp": "...", "expires_in_seconds": 300 }`

- **`POST /api/auth/otp/send`**
  - Body: `{ "phone": "9809248510", "stamp": "..." }`
  - Validates challenge stamp, checks cooldowns, verifies database registration, and proxies request to remote SMS Gateway.
  - Response: `{ "success": true, "sms_job_id": 42, "cooldown_seconds": 60 }`

- **`POST /api/auth/otp/verify`**
  - Body: `{ "phone": "9809248510", "otp": "245510" }`
  - Verifies code via Gateway (or master test bypasses `000000` / `123456`).
  - Response: `{ "success": true, "token": "...", "user": { ... } }`

- **`POST /api/auth/session/verify`**
  - Headers: `Authorization: Bearer <token>` or body `{ "token": "..." }`
  - Validates persistent session signature.
  - Response: `{ "success": true, "user": { ... } }`

- **`POST /api/sms/send`**
  - Body: `{ "phone": "...", "message": "..." }`
  - Proxies general SMS announcements to parents and faculty.

---

## 5. Modular Service Functions Reference

### 5.1 APIService (`modules/api.js`)
- `request(endpoint, options)`: Network wrapper supporting retries, query timeouts, and offline status checks.
- `get(path)`: Retrieves data from `/api/db?path=<encoded_path>`.
- `post(path, data)`: Persists new records.
- `patch(path, data)`: Partially updates fields.
- `delete(path)`: Removes records.
- `upload(file, onProgress)`: Multipart file upload to `/api/upload`.
- `showNetworkWarning(message)`: Renders temporary toast notification.

### 5.2 AuthService (`modules/auth.js`)
- `fetchStamp()`: Retrieves fresh security stamp from `/api/auth/stamp`.
- `sendOtp(phone)`: Requests 6-digit OTP code with anti-tamper stamp.
- `verifyOtp(phone, otp)`: Verifies OTP, receives and saves persistent session token.
- `validateSession()`: Validates saved session so user does not need to re-login.
- `getAuthToken()` / `setAuthToken(token)`: Manages persistent storage in `localStorage`.
- `getRoles()`: Returns role constants (`admin`, `teacher`, `parent`).
- `getSession()` / `setSession()`: Session storage accessors.
- `logout()`: Clears persistent token and session, redirects to login.
- `checkAuth(allowedRoles)`: Guard enforcing route security.
- `redirectUserToRoleDashboard(role)`: Directs user to appropriate portal.

### 5.3 DatabaseService (`modules/db.js`)
- Complete DAL covering students, teachers, login mappings, exam windows, marks, attendance, bell schedules, notices, tickets, and feedback.

---

## 6. How to Review and Run the Project

### 6.1 Running Locally
```bash
npm start
# or
node server.js
```
The server runs on `http://localhost:5050`.

### 6.2 Testing
Execute all 27 unit test suites locally:
```bash
npm test
# or
node tests/runner.js
```

Run Android native unit tests:
```bash
cd app && JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64 ./gradlew testDebugUnitTest --no-daemon --console=plain < /dev/null
```

### 6.3 Deployment (`deploy.sh`)
```bash
# Test, stage, and commit locally:
./deploy.sh "Your commit message"

# Test, commit, and push to GitHub:
./deploy.sh "Your commit message" --push

# Test, commit, push, and deploy to remote production server:
./deploy.sh "Your commit message" --push --remote
```