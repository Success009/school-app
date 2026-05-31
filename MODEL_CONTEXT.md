# Udayashree School App - Future Model Context & Guidelines (MODEL_CONTEXT.md)

Welcome! If you are an incoming AI model assigned to make modifications or upgrades to the **Udayashree School Management System**, this document is your primary guardrail. Read this completely before opening files or writing code.

---

## IMPORTANT: ACTIVE DEVELOPMENT ROADMAP

All active feature updates, portal decommissionings, and customization workflows are detailed in **[DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md)**.
You MUST read `DEVELOPMENT_PLAN.md` sequentially and implement its specified phases as your primary tasks. Do not deviate or make guessed assumptions!

---
    
## 1. Ground Rules & Principles (DO NOT GUESS)

*   **Read Before Editing:** NEVER write code based on assumptions or play guessing games. Always use file reading tools to inspect the active implementations.
*   **The Sequential Loading Rule:** This app does not use module bundlers (like Webpack or Vite). It uses a clean, progressive hybrid layout: core static HTML files (`admin.html`, `parent.html`, `teacher.html`, `principal.html`, `index.html`) loaded sequentially with dedicated standalone JS scripts.
*   **distributed Code over Monoliths:** Do not compile code back into massive monolithic files. Each specialized controller must remain separated. If you add a feature, write a dedicated modular file and load it sequentially in the corresponding HTML shell.
*   **Preserve No-Brackets UI rendering:** NEVER output empty array brackets `[]` right next to each other inside code replace blocks; always add a space `[ ]` to prevent terminal rendering crashes.

---

## 2. Server, Deployment & Local Tools

### 2.1 Connection Metadata
*   **Local Workspace Path:** `/home/success0/Downloads/school-app`
*   **Remote SSH Host:** `100.120.244.95`
*   **SSH / Server User:** `bigfish`
*   **SSH / Server Password:** `bigfish`
*   **Remote Workspace Path:** `/home/bigfish/school-app-deploy`
*   **Active Hosting Port:** served dynamically on **port 5050** via python: `python3 -m http.server 5050` inside `/home/bigfish/school-app-deploy`.

### 2.2 Local Utility Availability
*   `sshpass` is pre-installed on this development machine.
*   You can sync files instantly using this rsync command:
    bash
    sshpass -p 'bigfish' rsync -avz --delete --exclude '.git' --exclude 'backups' --exclude '*.log' /home/success0/Downloads/school-app/ bigfish@100.120.244.95:school-app-deploy/
    ---

## 3. Strict Functional Boundaries (DOs vs. DONTs)

### 3.1 WHAT NOT TO DO (The Purge list)
*   **NO Finance / Accountant Systems:** The school accountant already utilizes an external specialized financial system and requested complete exclusion. **DO NOT** add any fee ledgers, bills, outstanding dues, manual accounting debits, offline payment clearances, wallet settlements, or transaction logs. All ledger branches, collection metrics, and accountant roles have been completely purged.
*   **NO Upper Grades / College Classes:** The school's operational scope is strictly Class 1 through Class 8. **DO NOT** add options for Grades 9, 10, 11, or 12 (College) to any registration forms, subject configs, or directories.
*   **NO Heavy Visual Animations:** Keep UI components snappy, functional, and clean. Avoid complex JS transition loops or animation triggers that consume high CPU resources on hybrid mobile devices.

### 3.2 WHAT TO DO (The System Model)
*   **Enforce Class 1-8 Scope:** Always constrain class selections and discovery configurations strictly to Classes 1-8.
*   **Default Section to "General":** Do not render section filter dropdowns or entry inputs. To maintain database consistency without breaking schema lookups, section keys are internally set to `"General"` by default on saving profiles.
*   **Automatic Subject Assignment:** During student enrollment, the application automatically queries `school/class_configs/{classId}/subjects/compulsory` to fetch the compulsory subjects configured for their grade and sets them into their academic profile. No manual checkbox select step is rendered.
*   **Image Compression & Upload Loading:** All image files (profile photos, document proving) are normalized locally to highly efficient JPG formats (0.9 quality) before transmission. Keep the dynamic blur loader overlaid to show transfer progress.

---

## 4. Codebase Layout Map

When editing, locate the correct script module to avoid code bleed:

/home/success0/Downloads/school-app/
├── admin.html               # Admin Shell
├── admin-core.js            # Admin Views Router, Notices Broadcasting, & Dashboards
├── admin-students.js        # Admin Student Register, Filter Lists, and Onboarding
├── admin-teachers.js        # Admin Teacher Onboardings, Availability, & Proving Docs
├── admin-subjects.js        # Admin subjects configurations by grade
├── admin-exams.js           # Admin exams windows schedulers, deadlines, & results publishes
├── admin-tickets.js         # Admin Help Desk ticketing logs and discussion panels
├── admin-config.js          # Admin Principal settings updates
├── parent.html              # Parent App Shell
├── parent-core.js           # Parent Dashboards, Routines, and Homework Viewers
├── parent-attendance.js     # Parent Attendance Score graphs & calendars
├── parent-results.js        # Parent Report Cards & Printable Certificate Generator
├── parent-tickets.js        # Parent Support Ticket queries & logs
├── teacher.html             # Teacher App Shell
├── teacher-core.js          # Teacher Dashboard, Schedules, and Profile Details
├── teacher-attendance.js    # Teacher Daily Student register roll loaders & submits
├── teacher-marks.js         # Teacher sequential exam grading sheet controllers
├── principal.html           # Principal App Shell
├── principal-core.js        # Principal Dashboard, Analytics, and shared listings
├── principal-students.js    # Principal pupil directory searches
├── shared.js                # Firebase Init, ROLES, SafeResolvers, and alerts
├── login.js                 # Unified login router (SMS bypass 0000)
└── DOCUMENTATION.md         # Simplified technical system reference manual
Use this map to find where logic belongs and keep files well-distributed and highly functional!
    