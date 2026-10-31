# Udayashree School App - Modular Architecture Roadmap & Progress Tracker

This document is the **Single Source of Truth** for architectural progression, active task states, and forward-looking milestones for the Udayashree School App.

---

## 1. Architectural Philosophy & Rules
1. **Single-Responsibility ES Modules**: Each subsystem is isolated into a standalone file under `modules/` with 0 DOM coupling and full testability.
2. **User-Centric UI**: Zero tutorial fluff, zero engineering jargon, clean visual indicators (e.g. *"Photo uploaded"*, *"Document attached"*).
3. **Client-Side Optimization**: Mandatory canvas portrait compression to ~30KB JPEG (400×400 at 0.8 quality) prior to server upload.
4. **Zero Hardcoding**: All grades (Classes 1–8), subjects, and configurations are loaded dynamically from the database (`school/classes`, `school/class_configs`).
5. **Separation of Concerns**: Viewing/Browsing is kept strictly isolated from Editing/Mutating so lookups are fast, zero-risk, and crash-resistant.

---

## 2. Master Progress Tracker

### [COMPLETED] Milestone A: Core Foundation & Infrastructure
- [x] Persistent JSON Database Storage Engine (`controllers/dbStorage.js` & `server.js`)
- [x] Multi-layer SMS Gateway with anti-tamper stamps, cooldowns, and session tokens (`smsSecurity.js`)
- [x] Zero-Cost Developer Bypass Mode (`..` prefix with 4/5/6 zero OTP)
- [x] Unified API Client with retry, offline toasts, and multipart upload (`modules/api.js`)
- [x] Unified Data Access Layer for Students, Teachers, and Mappings (`modules/db.js`)
- [x] Isolated CLI Unit Test Runner with 55 passing tests (`tests/runner.js`)

### [COMPLETED] Milestone B: Setup & Configuration Engine
- [x] Standalone Setup ES Module (`modules/setupModule.js`)
- [x] Admin Setup UI Controller (`admin-setup.js`)
- [x] Responsive Master-Detail layout for Desktop & Mobile
- [x] Dynamic Class and Compulsory Subject creation, ordering, and cascade deletion
- [x] Integrated into `admin.html` & `adminRouter('schoolSetup')`

### [COMPLETED] Milestone C: Faculty Onboarding Engine
- [x] Single-Responsibility Faculty ES Module (`modules/facultyAddModule.js`)
- [x] User-Centric Faculty UI Controller (`admin-faculty-add.js`)
- [x] Client-side canvas portrait compression
- [x] Multi-document verification attachments (citizenship, appointment, certificates)
- [x] Dynamic workload assignment matrix pulled from database
- [x] Integrated into `admin.html` & `adminRouter('addTeacher')`

### [COMPLETED] Milestone D: Student Onboarding Engine
- [x] Single-Responsibility Student ES Module (`modules/studentAddModule.js`)
- [x] User-Centric Student UI Controller (`admin-student-add.js`)
- [x] Client-side canvas portrait compression with live preview
- [x] Multi-document verification attachments (Birth Cert, Transfer Cert, Marksheet, etc.)
- [x] Multi-parent phone parsing and SMS login mapping (`school/login_mappings/{phone}`)
- [x] Removed roll number and subject preview clutter
- [x] Cleaned header and eliminated tutorial text
- [x] Integrated into `admin.html` & `adminRouter('addStudent')`
- [x] Standalone test instance at `student-add.html`
- [x] Dedicated automated test group: `npm run test:student-add` (5 passing tests)

---

### [COMPLETED] Milestone E: Student Class Directory & Roster Viewer
- [x] **Step 1: Core Engine (`modules/studentViewModule.js`)**:
  - Pure ES module with 0 DOM coupling.
  - Dynamically loads classes and students from `DatabaseService`.
  - Filters by class (Classes 1–8 or "All").
  - Searches students by full name, student ID, guardian phone, or parent name.
  - Sorts by roll number, name, or student ID.
  - Computes class stats (pupil counts, gender breakdown, document status, phone link status).
- [x] **Step 2: Automated Unit Tests (`tests/runner.js`)**:
  - Dedicated test group: `npm run test:student-view` (4 passing tests).
  - Validates class grouping, filtering, search fuzzy matching, and stats calculation.
- [x] **Step 3: UI Controller (`admin-student-view.js`)**:
  - High-density class tab pills with real-time student count badges.
  - Instant live search input with clear button.
  - Student card grid displaying photo, student ID, full name, age, roll number, guardian info, and document indicators.
  - Full Student Detail Modal: comprehensive personal info, addresses, assigned subjects, guardian contacts, viewable documents, and quick "Edit Student" action.
- [x] **Step 4: Standalone Testing Instance (`student-view.html`)**:
  - Standalone instance serving at `http://localhost:5050/student-view.html`.
- [x] **Step 5: Main Application Integration**:
  - Imported in `admin.html` and connected to `adminRouter('viewStudents')` in `admin-core.js`.

---

### [COMPLETED] Milestone F: Faculty Directory & Workload Inspector
- [x] **Step 1: Core Engine (`modules/teacherViewModule.js`)**:
  - Pure ES module with 0 DOM coupling.
  - Dynamically loads teachers, classes, and subjects from `DatabaseService`.
  - Filters by category (All Faculty, Class Teachers, Subject Teachers) or by specific class.
  - Searches faculty by name, ID, phone, email, professional title, qualification, or workload subject.
  - Sorts by name (A-Z), faculty ID, or seniority/experience.
  - Computes faculty stats (total faculty, class teachers, verified records, classes covered).
- [x] **Step 2: Automated Unit Tests (`tests/runner.js`)**:
  - Dedicated test group: `npm run test:teacher-view` (4 passing tests).
  - Validates zero hardcoding, filtering, fuzzy search across all fields, and profile formatting.
- [x] **Step 3: UI Controller (`admin-teacher-view.js`)**:
  - Streamlined dropdown category & class filter (replaced horizontal pill clutter).
  - Prominent monospace Faculty ID badge header on every roster card.
  - Removed sort dropdown overhead; defaults to canonical ID/name ordering.
  - High-density faculty card grid displaying photo, Faculty ID badge, full name, title, class teacher badges, compact workload tags, and direct phone link.
  - Full Faculty Detail Modal: personal & academic info, assigned curriculum workload matrix by class.
  - In-app document previewer modal (`document-preview-modal`) with PDF iframe & image inspector.
- [x] **Step 4: Standalone Testing Instance (`teacher-view.html`)**:
  - Standalone testing instance serving at `http://localhost:5050/teacher-view.html`.
- [x] **Step 5: Main Application Integration**:
  - Imported in `admin.html` and connected to `adminRouter('viewTeachers')` in `admin-core.js`.

---

## 3. ACTIVE OBJECTIVE: Dedicated Record Editors (`studentEditModule.js` & `teacherEditModule.js`)

### Objective Scope
Build isolated, single-responsibility record editing modules allowing administrators to update existing pupil and faculty profiles, adjust class allocations, modify parent contact links, update curriculum workloads, and attach or replace verification documents with full field validation and zero side-effects.

### Work Breakdown:
- [x] **Step 1: Student Edit Engine (`modules/studentEditModule.js`)**:
  - Pure ES module with 0 DOM coupling.
  - Pre-fills current student state, performs strict input validation and defensive XSS sanitization.
  - Dynamic class allocation and automatic curriculum subject reassignment from `DatabaseService.getClassConfigs()`.
  - Atomic parent login mapping synchronization: deletes obsolete parent phone entries and registers updated phone credentials in `school/login_mappings` for SMS OTP authorization.
  - Document management with secure URL protocol enforcement (neutralizes `javascript:` protocols).
- [x] **Step 2: Standalone Student Edit Preview & Controller (`student-edit.html` & `admin-student-edit.js`)**:
  - Standalone preview page active at `http://localhost:5050/student-edit.html`.
  - Instant student switcher, pre-filling, dynamic class subject tags, and document management.
  - Wired into `admin-student-view.js` "Edit" buttons.
- [x] **Step 3: Automated Unit Tests (`tests/runner.js`)**:
  - Group `student-edit` with 5 automated unit tests (5/5 passing, total test suite: 68/68 passing).
  - Dedicated script: `npm run test:student-edit`.
- [x] **Step 4: Faculty Record Editor Engine (`modules/teacherEditModule.js`)**:
  - Pure ES module with 0 DOM coupling; strict validation, phone uniqueness, and defensive sanitization.
  - Class workload reassignment & class teacher authority changes; atomic login mapping synchronization.
  - Dedicated preview at `http://localhost:5050/teacher-edit.html` with full test coverage (73/73 tests passing).
- [x] **Step 5: Main Application Integration & Color Scheme Harmonization**:
  - Merged into `admin.html` with parameterized routing (`editStudent`, `editTeacher`) and context-aware back navigation.
  - Color palette completely aligned with main app primary blue branding; uncluttered UI parity established between faculty and student directories.

---

## 4. Upcoming Milestones (Roadmap)
1. **Milestone H: Admin Central Dashboard Revamp**:
   - High-level KPI cards (Total Students, Faculty, Classes), rapid module launchers, and alert feeds.
2. **Milestone I: Mobile Parent Portal Revamp (`parent.html`)**:
   - Child profile view, attendance calendar, and digital report card.
3. **Milestone J: Mobile Teacher Portal Revamp (`teacher.html`)**:
   - Class roster inspector, daily attendance marker, and grading inputs.
