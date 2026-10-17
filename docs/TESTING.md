# Testing Suite & Verification Guide

## 1. Overview

The project features an automated headless test runner executing both client-side and server-side modular unit tests without requiring a live browser or remote database.

```bash
npm test
```

## 2. Test Suites & Coverage Map (31/31 Passing)

| Suite Name | Module Tested | Key Verifications |
|---|---|---|
| **APIService** | `modules/api.js` | GET, POST, PATCH, DELETE, file upload progress, offline fallback |
| **AuthService** | `modules/auth.js` | Role permissions, session storage, logout redirect, PIN validation |
| **DatabaseService** | `modules/db.js` | CRUD for Students, Teachers, Mappings, Archive, Exams, Results, Notices |
| **SmsSecurityService** | `smsSecurity.js` | Stamp generation, timing-safe signatures, rate limits, whitelist, HMAC sessions |
| **AuthService OTP Integration** | `modules/auth.js` | Stamp acquisition, OTP dispatch, token issuance, persistent restore |
| **ValidationService** | `modules/validation.js` | Phone normalization, +977 stripping, test mode detection, sanitize |
| **DbStorageService** | `controllers/dbStorage.js` | Deep nested get/set, slash patch notation, path deletion, atomic saves |
| **UploadController Security** | `controllers/uploadController.js` | Google Play compliance: whitelist verification & executable rejection |
| **Zero-Cost Test Bypass** | Full Integration | End-to-end `000` prefix bypass dispatch and `000000` OTP login |

---

## 3. Native Android Unit Tests

Android unit tests verify native SMS data models, background notification polling, and cryptographic utilities:

```bash
cd app
JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64 ./gradlew testDebugUnitTest --console=plain
```

---

## 4. Headless Polyfill Architecture

The test harness (`tests/runner.js`) runs in pure Node.js and provides browser polyfills:
- `global.localStorage`: Mock key-value storage for testing session persistence.
- `global.navigator`: Online status simulation for testing network disconnect toasts.
- `global.document`: DOM tree stub for verifying toast element insertion and cleanup.
- `global.fetch`: Mock HTTP interceptor verifying request bodies, stamps, and tokens.
