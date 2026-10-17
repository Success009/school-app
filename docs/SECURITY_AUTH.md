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
|       [C] Developer Mode Check: If starts with '..' or '.#', skip SMS         |
|       [D] Rate Limiting (1 request / 60s per phone, 10 / 10m per IP)          |
|     <-- Dispatches SMS via cellular gateway OR returns test mode success      |
|                                                                               |
|  3. Verify OTP: POST /api/auth/otp/verify                                     |
|     Payload: { phone, otp }                                                   |
|     Backend Checks:                                                           |
|       [A] If test prefix & otp == '000000' and registered -> Bypass live gateway |
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

## 4. Zero-Cost Developer Mode & Production Privacy

### Purpose & Architecture
Internal QA verification and Play Store pre-launch reviews require logging in without incurring continuous SMS cellular charges. To protect real school consumers (parents and teachers) in production, this mode is designed with zero leakage: no test flags, backdoor labels, or debug messages are returned to the client UI.

### How It Operates
1. **Triggering Developer Mode**:
   Input a registered phone number prefixed with `..` or `.#` (e.g., `..9845212500` or `.#9845212500`).
2. **Backend Processing (`controllers/authController.js`)**:
   - The server normalizes the input by stripping `..` or `.#`, obtaining the underlying phone number (`9845212500`).
   - It verifies whether `9845212500` exists in `db.json`. If registered:
     - Real cellular SMS transmission is skipped.
     - A standard production-like JSON success response is returned so consumer interfaces remain completely clean.
3. **Verification**:
   - In Step 2, the UI displays the clean 10-digit number (never showing the prefix).
   - Enter `000000` in the verification code input.
   - The backend requires **both** the active developer prefix on the phone request AND the `000000` code. Attempting `000000` on a normal consumer phone number without the prefix is strictly rejected.

---

## 5. Persistent Session Tokens

- Session tokens follow an HMAC-signed format:
  `{base64url(payload)}.{hex(signature)}`
- Generated using:
  `HMAC-SHA256(payloadJson, SESSION_SECRET)`
- Stored on client in `localStorage.setItem('school_app_auth_token', token)`.
- Valid for 30 days, eliminating repeated SMS verification on device restart.
