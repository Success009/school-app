# Udayashree English School Management System & Mobile App

A modern, full-stack school management platform and Android application featuring cellular SMS OTP authentication, role-based dashboards (Admin, Faculty, Parent), offline-capable WebView architecture, and automated notifications.

---

## 📚 Documentation Index

To maintain modularity and high signal-to-noise ratio, comprehensive documentation is organized into dedicated topic guides:

- 🏛️ **[System Architecture & Modularity](docs/ARCHITECTURE.md)**: Three-tier design, modular controllers, blast-radius containment, and failure isolation.
- 🔒 **[Security & Authentication](docs/SECURITY_AUTH.md)**: Anti-tamper cryptographic stamps, phone whitelisting, rate limits, and persistent HMAC sessions.
- 🛡️ **[Security Bridges & Offline Resilience](docs/SECURITY_BRIDGES_AND_OFFLINE.md)**: Android WebView hardening, gateway tunnel security, offline student/roster viewing, and context-efficient isolation.
- 📱 **[Google Play Store Compliance](docs/PLAY_STORE_COMPLIANCE.md)**: Play Store policy analysis, why in-app APK updaters violate policy 4.5, and how WebView PWA enables compliant zero-touch web updates.
- 📡 **[REST API Reference](docs/API_REFERENCE.md)**: Full API endpoint contracts, request/response payloads, and status codes.
- 🧪 **[Testing & Verification](docs/TESTING.md)**: Headless test runner, polyfill architecture, and test coverage mapping.
- 📊 **[Project Status Tracker](PROJECT_STATUS.md)**: Live deployment status, completed milestones, and roadmap.

---

## 🚀 Quick Start

### 1. Run Server Locally
```bash
npm install
npm start
# Server listens at http://localhost:5050
```

### 2. Run Test Suite
```bash
npm test
# Executes all 32 unit test suites covering client, server, and offline modules
```

### 3. Deploy to Production
```bash
./deploy.sh "Your commit message" --remote
# Synchronizes server modules to production (100.89.137.102) and restarts systemd service
```

---

## 🔑 Developer Test Bypass Mode

To test full end-to-end authentication without spending money on cellular SMS gateway dispatches:

1. **Enter Phone with `..` Prefix**:
   ```text
   ..9765954850
   ```
2. **Click "Send SMS Code"**:
   - The UI cleanly displays `+977 9765954850` (never leaking the prefix to the user).
   - The server verifies `9765954850` against `db.json`, skips cellular SMS transmission, and advances to Step 2.
3. **Enter Test Code**:
   ```text
   0000
   ```
   *(Typing 4, 5, or 6 zeros auto-completes and verifies instantly without manual button clicks).*
4. **Result**:
   - The account is authenticated, issuing a persistent session token and loading the dashboard. Attempting zeros without the `..` prefix is strictly rejected.
