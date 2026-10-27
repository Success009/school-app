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
   - Fully modular notification router mounted at `/api/notifications` and `/api/notifications/poll`.
   - Android background polling service (`NotificationPollService.java`) queries `/api/db?path=school/notices` and handles high-priority system notifications with Android `NotificationChannel`.
   - In-app notices and broadcasts sent via admin or SMS broadcasts automatically mirror into the notification queue.
   - **Zero App Rebuilds Required**: All functional screens, dashboards, and logic are delivered directly via the web app (`https://school.success0.com.np`).

6. **Modular Architecture & Environment Separation**:
   - **Administrator Portal (`admin.html`)**: Exclusively Desktop view for school office workstations. Features high-density clean card views, non-destructive DOM updates, and rapid keyboard entry.
   - **Teacher Portal (`teacher.html`)**: Exclusively Mobile view for faculty smartphones (attendance, marks, homework).
   - **Parent Portal (`parent.html`)**: Exclusively Mobile view for parent smartphones (report cards, announcements, notices).
   - **Component Modularity**: Each subsystem is isolated into a standalone ES module under `modules/` with pure testable business logic and zero page re-renders.

7. **Core School Setup Engine (`modules/setupModule.js` & `admin-setup.js`)**:
   - Streamlined, focused class configuration (Classes 1 to 8 by default, custom grades like Nursery, Class 9).
   - Compulsory subjects configuration with optional book/publisher details.
   - Native application design language (`style.css`, `blue-700`, `.mobile-card`, clean typography).
   - Non-destructive DOM updates: Class switching and subject additions update localized DOM lists without whole-container reflashes.
   - Integrated in-app navigation with "Back to Dashboard" and "Save Changes".

8. **Modular CLI Test Runner & Automated Verification**:
   - **40/40 tests passing** in the accumulated test suite (`npm test`).
   - CLI flags supported for isolated module testing:
     - `node tests/runner.js --group=setup` (runs isolated setup module tests)
     - `node tests/runner.js --list` (displays available module test groups)
     - `node tests/runner.js --filter=<keyword>` (runs tests matching keyword)
   - Setup Module test coverage:
     - Class creation, order sorting (Nursery=0 to Class 10=10), and compulsory subject creation.
     - Input validation, whitespace trimming, and duplicate class/subject rejection.
     - Database POST schema verification (`school/classes/:id` and `school/class_configs/:id`).
     - Database GET loading and state reconstruction.
     - Cascade class and subject removal.
     - Storage persistence and local serialization.

9. **UI & Navigation Architecture**:
   - **Single Unified Back Navigation**: Eliminated redundant duplicate buttons across all headers and content views.
   - **Responsive Master-Detail Pattern**:
     - On Desktop (>= 768px): Classes and Subjects panels display side-by-side simultaneously.
     - On Mobile (< 768px): Dedicated Master-Detail view. Tap a class to slide into that class's subjects with a clean `← All Classes` arrow navigation.
   - Integrated into Admin Dashboard at `adminRouter('schoolSetup')`.

---

## Active Configuration

- **Production Web Application**: `https://school.success0.com.np`
- **Production Server**: `root@100.89.137.102` (`/home/bb/school-app-server`)
- **SMS Gateway Server**: `https://sms.success0.com.np` (daemon port 8090)
- **Mobile Test Device**: Connected at `root@100.120.244.95` (`32a5a9ae`)
- **Current App Package**: `com.udayashree.success0`
