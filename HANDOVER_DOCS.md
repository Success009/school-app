# Udayashree School App - HANDOVER DOCUMENTATION (May 31, 2026)

## ⚠️ ATTENTION TO THE NEXT MODEL:
**DO NOT HALLUCINATE.** If you lack context on a function or database path, **read the files first.** This project uses a modular distributed architecture where logic is separated into specific scripts to prevent bloat. Always check `MODEL_CONTEXT.md` and `DEVELOPMENT_PLAN.md` before starting.

---

## 1. PROJECT SCOPE & PHILOSOPHY
*   **Target:** Small school (Class 1-8).
*   **Scale:** Low density (approx. 5-6 pupils per class).
*   **Tech Stack:** Vanilla JS, Tailwind CSS, Firebase Realtime DB, Firebase Storage.
*   **Architecture:** HTML shells (`admin.html`, `teacher.html`, `parent.html`) loading modular JS files (e.g., `teacher-attendance.js`) sequentially. No bundlers (Webpack/Vite).

---

## 2. RECENT CORE UPDATES (V4.0)

### 2.1 Attendance Security (`classTeacherOf`)
We have moved away from allowing any teacher to take attendance for any class.
*   **New Logic:** Each teacher profile in `school/teachers/{id}` now contains a `classTeacherOf` attribute.
*   **Enforcement:** `teacher-attendance.js` and `teacher-core.js` now check this attribute. If it's not set, attendance access is denied. If set, it automatically loads that specific class roster without a dropdown selection.

### 2.2 Global Period Timings
*   **Admin Tool:** Added a "Period Timings" manager in the Admin Dashboard.
*   **Database Path:** `school/config/period_timings`.
*   **Purpose:** Centralizes school hours so that changes to period start/end times reflect immediately on all student/teacher schedules.

### 2.3 Android Wrapper (Beta)
*   **Location:** `/mnt/data_vault/Downloads/school-app-android`
*   **Tech:** Capacitor 6.
*   **Config:** `minSdkVersion: 22`, `targetSdkVersion: 35`.
*   **Build Info:** APKs are built using Java 21 and the Android SDK located in `/home/success0/android-sdk`.
*   **Download Portal:** A Python server is hosting the latest APK at `http://100.120.244.95:4000`.

---

## 3. FIREBASE MIGRATION (CRITICAL)
The project is transitioning from `mydb-7cfc4` to the production project `deep-freehold-389006`.

### 3.1 Rules Management
The `database.rules.json` has been updated to merge the school app's open rules with existing production rules for the creator's other apps (Grocery/Hotel).
*   **Security:** The "school" node allows public read/write for now, but other nodes are strictly protected. **Do not overwrite the top-level rules.**

### 3.2 Android Authentication Restriction
*   **The Issue:** The production API key has "Website restrictions" enabled in the Google Cloud Console. This blocks the Android app's internal WebView.
*   **The SHA-1 Fingerprint:** `20:D5:FD:8F:3C:54:8D:7C:A8:A1:91:BA:97:CC:46:CD:0F:95:F2:58`
*   **Next Task:** The next model must confirm if the Android restriction for `com.udayashree.app` has been added to the credentials in the Google Cloud Console.

### 3.3 Profile Not Found Bug
*   **Status:** Fixed. The `login.js` logic was throwing a premature error when resolving teacher profiles. This has been patched in both the main repo and the `www/` folder of the Android project.

---

## 4. DEPLOYMENT & SYNC
*   **Local Server:** Sync using `rsync` to `bigfish@100.120.244.95:school-app-deploy/`.
*   **GitHub:** Push to `Success009/school-app` (Master branch).
*   **Android builds:** Run `./gradlew assembleDebug` inside the `android` folder of the wrapper project using `JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64`.

---

## 5. PENDING TASKS FOR NEXT MODEL
1.  **Verify Data Integrity:** Check that all student and teacher records were correctly imported into the `school/` node of `deep-freehold-389006`.
2.  **Fix Cloud Console Restrictions:** If the Android app still fails to fetch data, ensure the SHA-1 (provided above) is whitelisted in Google Cloud APIs & Services.
3.  **Implement Phase 6/7 of Development Plan:** See `DEVELOPMENT_PLAN.md` for details on Report Card generation and Soft Delete logic.

**Good luck. Read the files, keep the code modular, and respect the home server environment.**