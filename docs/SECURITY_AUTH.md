# Security & Authentication Architecture

## 1. Overview & Threat Model

Authentication in the Udayashree School Application uses a cellular OTP architecture protected by layered defense mechanisms against SMS wallet draining, credential replay, automated bot abuse, and unauthorized privilege escalation.

```
+-------------------------------------------------------------------------------+
|                             CLIENT AUTHENTICATION FLOW                        |
|                                                                               |
|  1. Request Anti-Tamper Stamp: GET /api/auth/stamp                            |
|     <-- Returns timestamp, nonce, HMAC-SHA256 signature                      |
|                                                                               |
|  2. Dispatch OTP Request: POST /api/auth/otp/send                             |
|     Payload: { phone, stamp }                                                 |
|     Backend Checks:                                                           |
|       [A] Validate Stamp Signature & Expiry (within 300s, unused nonce)       |
|       [B] Whitelist Verification (Must exist in db.json)                      |
|       [C] Test Bypass Check: If starts with '000', return static test mode    |
|       [D] Rate Limiting (1 request / 60s per phone, 10 / 10m per IP)          |
|     <-- Dispatches SMS via cellular gateway OR returns test mode success      |
|                                                                               |
|  3. Verify OTP: POST /api/auth/otp/verify                                     |
|     Payload: { phone, otp }                                                   |
|     Backend Checks:                                                           |
|       [A] If otp == '000000' and registered -> Bypass live gateway            |
|       [B] Otherwise -> Verify with SMS Gateway                                |
|       [C] Issue Persistent Session Token (HMAC-SHA256 signed payload)         |
|     <-- Returns JWT-like persistent session token & user profile              |
|                                                                               |
|  4. Startup Re-Authentication Bypass: GET /api/auth/verify-session            |
|     Header: Authorization: Bearer <token>                                     |
|     Backend Checks:                                                           |
|       [A] Timing-safe signature match                                         |
|       [B] Expiry check (30 days validity)                                     |
|     <-- Returns verified session user without requiring new SMS               |
+-------------------------------------------------------------------------------+
```

---

## 2. Cryptographic Stamp Specification (`GET /api/auth/stamp`)

To prevent automated scripts or scrapers from submitting arbitrary OTP requests:
1. The server generates a unique challenge formatted as:
   `{timestamp}.{nonce}.{signature}`
2. **Signature Generation**:
   `HMAC-SHA256(timestamp + ":" + nonce, STAMP_SECRET)`
3. **Validation Rules**:
   - The stamp must not be older than 300 seconds (5 minutes).
   - The nonce is recorded in memory; if submitted again within the validity window, the request is rejected with `Anti-replay violation: stamp already used`.
   - The cryptographic signature is compared using `crypto.timingSafeEqual` with byte-length normalization to prevent timing attacks.

---

## 3. Anti-Drain Phone Whitelisting

Direct SMS gateway dispatch costs real currency per SMS message. To prevent malicious actors from submitting arbitrary phone numbers:
1. Before calling the gateway, the backend executes `SmsSecurityService.isPhoneRegistered(dbData, phone)`.
2. The phone number must be matched against one of the following:
   - `school.admin[phone]` (Administrator)
   - `school.login_mappings[phone]` (Teacher, Parent, or Staff)
   - `school.students[*].phone` or `school.students[*].parentPhone`
   - `school.teachers[*].phone`
3. Any unregistered number is immediately rejected with HTTP 403:
   `Invalid phone number: This mobile number is not registered in the school database.`

---

## 4. Zero-Cost Test Bypass Mode

### Purpose & Architecture
Live automated integration tests and Play Store test reviews require logging in without incurring SMS costs or relying on external cellular connectivity.

### How It Operates
1. **Triggering Test Mode**:
   Input a phone number prefixed with `000` (e.g., `0009765954850`).
2. **Backend Processing (`controllers/authController.js`)**:
   - The server strips the leading `000`, obtaining the underlying phone number (`9765954850`).
   - It checks whether `9765954850` is registered in `db.json`. If registered:
     - Gateway SMS transmission is completely skipped (zero cost).
     - Returns `{ success: true, message: "[Test Mode] Verification bypass active.", cooldown_seconds: 3 }`.
3. **Verification**:
   - Enter `000000` in the 6-digit verification code input.
   - The backend accepts `000000` without calling the gateway, constructs the genuine user profile from `db.json`, and signs a persistent session token.

---

## 5. Persistent Session Tokens

- Session tokens follow an HMAC-signed format:
  `{base64url(payload)}.{hex(signature)}`
- Generated using:
  `HMAC-SHA256(payloadJson, SESSION_SECRET)`
- Stored on client in `localStorage.setItem('school_app_auth_token', token)`.
- Valid for 30 days, eliminating repeated SMS verification on device restart.
