# REST API & Endpoint Reference

## Base URL
```
Production: https://school.success0.com.np
Local Dev:   http://localhost:5050
```

---

## 1. Authentication Endpoints

### 1.1 Request Anti-Tamper Stamp
* **Endpoint**: `GET /api/auth/stamp`
* **Headers**: None
* **Response (200 OK)**:
```json
{
  "success": true,
  "stamp": "1792167841000.abc123def456.789xyz...",
  "timestamp": 1792167841000,
  "expires_in_seconds": 300
}
```

### 1.2 Send OTP Verification Code
* **Endpoint**: `POST /api/auth/otp/send`
* **Headers**: `Content-Type: application/json`
* **Request Body**:
```json
{
  "phone": "9765954850",
  "stamp": "1792167841000.abc123def456.789xyz..."
}
```
* **Developer Test Mode Request**:
```json
{
  "phone": "..9765954850",
  "stamp": "1792167841000.abc123def456.789xyz..."
}
```
* **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Verification code sent to your mobile number.",
  "sms_job_id": 999999,
  "cooldown_seconds": 60,
  "expires_in_seconds": 300
}
```
* **Error Responses**:
  - `400 Bad Request`: Missing phone or invalid 10-digit format.
  - `403 Forbidden`: Invalid or expired stamp, or phone number not in database whitelist.
  - `429 Too Many Requests`: Cooldown active or hourly rate limit reached.

### 1.3 Verify OTP & Issue Session
* **Endpoint**: `POST /api/auth/otp/verify`
* **Headers**: `Content-Type: application/json`
* **Request Body**:
```json
{
  "phone": "9765954850",
  "otp": "760760"
}
```
* **Test Mode Request**:
```json
{
  "phone": "9765954850",
  "otp": "000000"
}
```
* **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Authentication successful.",
  "token": "eyJpZCI6IkFETS00ODUwIiwicGhvbmUiOiI5NzY1OTU0ODUwIiwicm9sZSI6ImFkbWluIn0....signature",
  "user": {
    "role": "admin",
    "id": "ADM-4850",
    "name": "Super Admin",
    "phone": "9765954850"
  }
}
```

### 1.4 Validate Persistent Session
* **Endpoint**: `GET /api/auth/verify-session`
* **Headers**: `Authorization: Bearer <token>`
* **Response (200 OK)**:
```json
{
  "success": true,
  "valid": true,
  "user": {
    "id": "ADM-4850",
    "phone": "9765954850",
    "role": "admin",
    "name": "Super Admin"
  }
}
```

---

## 2. Database Endpoints (`/api/db`)

### 2.1 Get Path
* **Endpoint**: `GET /api/db?path=school/students`
* **Response**: Returns JSON object or value at path, or `null`.

### 2.2 Set Path
* **Endpoint**: `POST /api/db`
* **Request Body**:
```json
{
  "path": "school/config/academicYear",
  "value": "2081-2082"
}
```

### 2.3 Patch Path
* **Endpoint**: `PATCH /api/db`
* **Request Body**:
```json
{
  "path": "school/students/STU-101",
  "value": {
    "section": "B",
    "roll": "15"
  }
}
```

### 2.4 Delete Path
* **Endpoint**: `DELETE /api/db?path=school/students/STU-101`
* **Response**: `{ "success": true }`

---

## 3. Media Upload Endpoint (`/api/upload`)

* **Endpoint**: `POST /api/upload`
* **Headers**: `Content-Type: multipart/form-data`
* **Body Form Field**: `file` (Binary payload)
* **Allowed MIME Types**: `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `application/pdf`
* **Max Size**: 25 MB
* **Response (200 OK)**:
```json
{
  "success": true,
  "url": "/uploads/1792167841000-123456789.png",
  "size": 245100,
  "mimetype": "image/png"
}
```
