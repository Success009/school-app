# Udayashree School App - Model Context (v4.2)

> **CRITICAL INSTRUCTION FOR ALL DEVELOPMENT AGENTS:**
> Read the codebase directly before modifying anything. This document outlines **WHY** structural architectural decisions were made, mapping out past mistakes and critical defensive practices to prevent regression. Follow the exact same defensive practices in your turns.

---

## 1. Safe Development Protocol (Preventing Clipboard File Corruption)
*   **THE MISTAKE:** In some versions of the local CLI harness used to run development models, the browser-based auto-paste mechanism has a bug when executing string/line-based edits (like `sys_edit_file`). It can accidentally capture the entire browser/Google AI Studio page context and paste 20,000+ lines of UI text directly into code files (e.g., bloating `shared.js` from 30 KB to 860+ KB and causing immediate syntax crashes).
*   **THE PREVENTATIVE PROTOCOL ("WHY"):** To guarantee file integrity, **NEVER use browser-based regex edit tools (`sys_edit_file`) on core files**. Instead, write small, programmatic Node.js or Python patching scripts and run them via a shell command (`sys_run_command`). This performs edits strictly in-memory using solid filesystem calls, bypassing clipboard-pasting bugs completely.

---

## 2. Default Asset Resolution ("Why" Offline-Ready Inline SVGs)
*   **THE MISTAKE:** Using external placeholder image services like `via.placeholder.com` for missing student, teacher, or parent portraits introduces high latency, and often fails with `net::ERR_CONNECTION_CLOSED` due to DNS/network blocks in local Nepal classroom environments. Furthermore, if the app is wrapped into local hybrid webshells (like Apache Cordova or Capacitor) for offline use in classrooms with no active internet, external links break completely.
*   **THE SOLUTION ("WHY"):** All fallbacks for missing images (in `shared.js`, `admin-students.js`, `teacher-core.js`, `parent-core.js`, `teacher-marks.js`) must use a base64-encoded, URL-safe inline SVG user avatar graphic:
    `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2NiZDVlMSI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg==`
    This consumes 0 bytes of network bandwidth, loads with 0ms latency, and is **100% reliable offline** on any device.

---

## 3. High-Performance Local Backend & Transparency Adapter ("Why" Design)
*   **THE MISTAKE:** Rewriting over 5,000 lines of legacy dashboard scripts (`admin-core.js`, `teacher-core.js`, etc.) which query data using Firebase compatibility syntax (e.g. `db.ref(path).once()`) would introduce endless human/model typos and massive regressions.
*   **THE SOLUTION ("WHY"):** We implement the **Adapter Pattern** inside `shared.js`:
    - **`APIService`**: Encapsulates fetch connections, retries, and offline checks.
    - **`AuthService`**: Manages phone number verifications, logins, and local session caching.
    - **`DatabaseService`**: Exposes a strongly-typed data access layer (DAL).
    - **`MockSnapshot` / `MockRef`**: Emulates the original Firebase Realtime Database SDK, fully supporting `numChildren()`, `exists()`, `val()`, and `forEach()`.
    - This allows all legacy client files to run with zero changes, while exposing strongly-typed backend modules for seamless isolated unit testing.

---

## 4. Key Implementation Rules
*   **Cache-Busting:** Any update to `shared.js` must be accompanied by incrementing the cache-buster query parameter (e.g. `shared.js?v=4.2`) inside `index.html`, `admin.html`, `teacher.html`, and `parent.html` to bypass browser and CDN cache nodes immediately.
*   **ServerValue.TIMESTAMP:** The mock client converts the placeholder string `__TIMESTAMP__` recursively into `Date.now()` right before posting, ensuring all database timestamps map to valid unix millisecond epochs.
*   **JS Bracket Bug:** Never output `[ ]` empty array brackets right next to each other inside prompt tool parameters or edits without a space; it crashes the CLI renderer. Use `[ ]` (with a space) or `new Array()` instead.
*   **Primary Constraints:** Target Class 1 to Class 8 only. Default section to "General" (no section code). All billing/finance code is prohibited.

---

## 5. Live Environment Details
*   **Local Project Directory:** `/home/success0/Documents/BigFish-cli/projects/school-app-server` (Resolves to `/mnt/data_vault/Documents/BigFish-cli/projects/school-app-server`)
*   **SSH Target Server:** `bb@100.89.137.102` (Pwd: `pariwarik`)
*   **Production Subdomain:** `https://school.success0.com.np`
*   **Service Name:** `school-app.service` (Systemd background daemon)
