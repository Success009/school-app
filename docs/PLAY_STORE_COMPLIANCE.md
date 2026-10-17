# Google Play Store Compliance & Policy Analysis

## 1. Executive Summary & Policy Verdict

| Topic | Status | Policy Compliance Summary |
|---|---|---|
| **In-App APK Auto-Updates** | **STRICTLY PROHIBITED** | Prohibited under Play Policy 4.5. Must **NOT** be built. |
| **WebView Dynamic Asset Updates** | **100% COMPLIANT** | Allowed. Web assets update instantly over HTTPS. |
| **Android Permissions** | **MINIMAL & COMPLIANT** | Only 4 benign permissions (`INTERNET`, `POST_NOTIFICATIONS`, etc.). |
| **Data Safety & Privacy** | **COMPLIANT** | No third-party ad SDKs or location tracking. Minimal school data. |
| **Target SDK Version** | **SDK 34 (Android 14)** | Meets Google Play minimum target API requirements. |

---

## 2. Why We Must NOT Build an In-App APK Auto-Updater

### Google Play Developer Distribution Agreement (Section 4.5)
> *"An app distributed via Google Play may not modify, replace, or update itself using any method other than Google Play's update mechanism. Likewise, an app may not download executable code (e.g., dex, JAR, .so files) from a source other than Google Play."*

### Penalties for Violation
1. **Immediate Play Protect Flagging**: Google Play Protect automatically detects apps downloading `.apk` files from custom URLs and flags them as potentially harmful applications (PHA) / Trojans.
2. **Permanent Account Suspension**: Breaching the Device and Network Abuse policy results in app removal and strikes against the Google Play Developer Account.

### The Hybrid WebView Advantage: Zero-Touch Compliant Updates
Because the Android app is built as a native **Progressive Web Shell** pointing to `https://school.success0.com.np`:
- **All web code (HTML, CSS, JavaScript, Modules, Controllers) is hosted dynamically on the server.**
- When you update features, styling, or backend endpoints on the server, **every mobile device receives the updates instantly upon next app open or reload**.
- **No APK updates or Play Store reviews are required for web logic, portal features, or security patches.**
- Google Play explicitly permits dynamic web content and JavaScript execution inside a `WebView` as long as the native binary executable (`classes.dex`, native libraries) is not modified outside Google Play.

---

## 3. Permissions Analysis & Justification

| Permission | Justification | Play Store Risk Level |
|---|---|---|
| `android.permission.INTERNET` | Required to communicate with `https://school.success0.com.np` | Lowest (Normal permission) |
| `android.permission.ACCESS_NETWORK_STATE` | Used by `MainActivity.java` to detect offline state and show retry screen | Lowest (Normal permission) |
| `android.permission.RECEIVE_BOOT_COMPLETED` | Allows `BootReceiver.java` to restart the notice polling service after device restart | Low (Standard utility) |
| `android.permission.POST_NOTIFICATIONS` | Required on Android 13+ (API 33+) to alert parents/teachers of school notices | Standard (Requires runtime prompt) |

### Non-Existent Dangerous Permissions (Safe)
The project deliberately does **NOT** request:
- `REQUEST_INSTALL_PACKAGES` (Would trigger Play Store scrutiny)
- `READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE`
- `ACCESS_FINE_LOCATION` / `ACCESS_COARSE_LOCATION`
- `READ_SMS` / `RECEIVE_SMS` (All OTP verification is handled server-side via the dedicated cellular gateway, keeping the student/parent app free from invasive SMS permissions).

---

## 4. Google Play Data Safety Declaration

When preparing the Play Console Data Safety form:
- **Data Collected**:
  - Personal Info: Name, Phone number (for authentication and student identity).
  - Financial Info: None (Fee payments are logged manually by school administration).
  - Health Info: Blood group (optional student profile record).
- **Data Sharing**:
  - **No data is shared with third parties**. No ad networks, analytics trackers (Facebook SDK, AppsFlyer, etc.) are bundled.
- **Security Practices**:
  - All data is encrypted in transit using TLS 1.3 (`https://`).
  - Account deletion / record purge is available via school administrative panel.

---

## 5. Google Play Release Build Instructions

To generate a production-ready Android App Bundle (`.aab`):
```bash
cd app
JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64 ./gradlew bundleRelease
```
The output file is generated at:
`app/app/build/outputs/bundle/release/app-release.aab`
