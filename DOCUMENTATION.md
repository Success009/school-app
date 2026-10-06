# Udayashree School App - Technical Reference Manual (v4.2)

This manual documents the **Modular Distributed Architecture**, backend data access layers, authentication system, unit testing infrastructure, and review environments of the Udayashree School Management System.

---

## 1. Project Overview & Architecture

The Udayashree School App is a lightweight, responsive management system designed for small-scale primary and middle school operations (strictly Classes 1 to 8, with ~5–6 students per class).

### 1.1 Tech Stack
- **Frontend**: Vanilla JavaScript (ES6+), Tailwind CSS, static HTML shells.
- **Backend**: Node.js + Express (`server.js`) hosting JSON-backed persistent data (`db.json`) and static uploads (`/uploads`).
- **Testing**: Zero-dependency Node.js test runner (`tests/runner.js`) with isolated mocks.
- **CI / CD**: GitHub Actions (`.github/workflows/test.yml`), automated pre-commit hook (`.git/hooks/pre-commit`), and one-command deployment script (`deploy.sh`).

### 1.2 Core Architectural Principles
- **No Heavy Bundlers**: Client runs directly on modern browsers via native scripts and ES module adapters.
- **Zero-Bandwidth Offline Graphic Fallbacks**: Fallback profile avatars use inline URL-safe base64 SVGs to ensure full functionality without external CDNs or network connectivity.
- **Flat Sectioning ("No-Section Protocol")**: All classes default to the "General" section.
- **Strict Role Boundaries**: Enforced roles for `admin`, `teacher`, and `parent`. All billing and finance modules have been eliminated to keep the scope focused.

---

## 2. Directory Structure

```
├── .github/
│   └── workflows/
│       ├── static.yml            # GitHub Pages deployment workflow
│       └── test.yml              # CI automated unit test runner workflow
├── .git/hooks/
│   └── pre-commit                # Automated pre-commit test validation hook
├── modules/                      # Modular services & strong-typed backend DAL
│   ├── api.js                   # APIService (HTTP methods, uploads, offline handling)
│   ├── auth.js                  # AuthService (Sessions, PIN validation, role guards)
│   ├── db.js                    # DatabaseService (Comprehensive Data Access Layer)
│   └── package.json             # ES module declaration
├── tests/
│   ├── runner.js                # Complete unit test suite (22 suites / all functions)
│   └── package.json             # Test configuration
├── uploads/                     # Upload directory for student/teacher photo assets
├── admin.html                   # Admin dashboard portal
├── teacher.html                 # Teacher & attendance portal
├── parent.html                  # Parent & student report card portal
├── index.html                   # Single sign-on and unified login screen
├── shared.js                    # Compatibility adapter and mock Firebase interfaces
├── server.js                    # Local & production Express backend API
├── db.json                      # Local JSON persistence store
├── deploy.sh                    # Automated test, commit, push, and remote deploy script
├── package.json                 # Project dependencies & npm scripts
├── DEVELOPMENT_PLAN.md          # Architectural roadmap and completed milestones
├── MODEL_CONTEXT.md             # Developer context & defensive guidelines
└── PROJECT_STATUS.md            # Current operational status & changelog
```

---

## 3. Modular Service Functions Reference

### 3.1 APIService (`modules/api.js`)
Handles all communication between frontend interfaces and the backend database/storage.
- `request(endpoint, options)`: Core network call wrapper supporting automatic retries (up to 3 attempts), query timeouts, and offline status checks.
- `get(path)`: Retrieves data from `/api/db?path=<encoded_path>`.
- `post(path, data)`: Persists new objects or replaces data at specified paths.
- `patch(path, data)`: Partially updates specific fields or nested paths.
- `delete(path)`: Removes records from the database.
- `upload(file, onProgress)`: Submits `multipart/form-data` file uploads to `/api/upload` with upload progress events.
- `showNetworkWarning(message)`: Renders temporary user-facing toast notifications for offline/network interruptions.

### 3.2 AuthService (`modules/auth.js`)
Manages authentication, session state, route guards, and dashboard redirection.
- `getRoles()`: Returns the set of recognized role constants (`admin`, `teacher`, `parent`).
- `getSession()`: Retrieves currently authenticated user session from `sessionStorage`.
- `setSession(sessionData)`: Writes authenticated session details to `sessionStorage`.
- `logout()`: Clears active sessions and redirects to `index.html`.
- `checkAuth(allowedRoles)`: Guard function that inspects current session role against permitted roles, redirecting unauthorized users.
- `redirectUserToRoleDashboard(role)`: Navigates authenticated users directly to their designated dashboard (`admin.html`, `teacher.html`, or `parent.html`).
- `verifyPhoneRegistered(phone)`: Checks if a supplied mobile number is registered under any role.
- `executeLogin(phone, pin, role)`: Validates PIN codes (including master bypass `0000`) and constructs user sessions.

### 3.3 DatabaseService (`modules/db.js`)
Provides strongly-typed access to all database operations.
- **Students**:
  - `getStudents(classId)`: Lists students (optionally filtered by class).
  - `getStudent(id)`: Fetches individual student profile.
  - `saveStudent(studentData)`: Enrolls a new student.
  - `updateStudent(id, updates)`: Updates student details.
  - `removeStudent(id)`: Deletes student record.
- **Teachers**:
  - `getTeachers()`: Retrieves all faculty members.
  - `getTeacher(id)`: Retrieves a specific faculty member.
  - `saveTeacher(teacherData)`: Registers faculty profile.
  - `updateTeacher(id, updates)`: Updates faculty record.
  - `removeTeacher(id)`: Deletes faculty record.
- **Login Mappings**:
  - `getLoginMap()`: Retrieves all registered phone-to-role mappings.
  - `setLoginMapping(phone, mappingData)`: Sets or updates phone credential mapping.
- **Soft Delete & Archiving**:
  - `archiveRecord(type, id, reason)`: Archives student or teacher records for data preservation.
  - `getStatusHistory(type, id)`: Fetches change logs and audit history.
- **Exam Windows & Grading**:
  - `getExamWindows()`: Lists active/past exam windows.
  - `saveExamWindow(windowData)`: Configures an exam window.
  - `removeExamWindow(windowId)`: Removes an exam window.
  - `getMarks(examId, classId, subjectId)`: Retrieves marks roster.
  - `saveMarks(examId, classId, subjectId, marksData)`: Saves grade inputs.
- **Attendance & Timings**:
  - `getAttendance(classId, date)`: Retrieves daily attendance log.
  - `saveAttendance(classId, date, attendanceData)`: Records attendance.
  - `getClassConfigs()`: Retrieves class subject configurations.
  - `getPeriodTimings()`: Retrieves global bell schedule.
  - `savePeriodTimings(timings)`: Saves period timings.
- **Notices, Tickets & Feedback**:
  - `getNotices()` / `createNotice(noticeData)`: School announcement broadcast.
  - `getTickets()` / `createTicket(ticketData)` / `updateTicket(ticketId, updates)`: Parent support tickets.
  - `getSuggestions()` / `submitSuggestion(suggestionData)`: Faculty suggestions.
  - `getReassignmentRequests()` / `submitReassignmentRequest(requestData)`: Teacher schedule reassignment requests.

---

## 4. How to Review and Run the Project

### 4.1 Running Locally
Start the integrated Express server:
```bash
npm start
# or
node server.js
```
The server will boot on `http://localhost:5050` (or `PORT` defined in environment).

### 4.2 Where to Review Each Role
Open your browser and navigate to:
- **Login Screen**: `http://localhost:5050/index.html` (or `http://localhost:5050/`)
- **Admin Dashboard**: `http://localhost:5050/admin.html`
- **Teacher Dashboard & Attendance**: `http://localhost:5050/teacher.html`
- **Parent Portal & Report Cards**: `http://localhost:5050/parent.html`

### 4.3 Default Credentials / Master Bypass
- Any registered phone number can log in using their registered PIN.
- Development / Master PIN bypass: `0000` is accepted for all registered accounts.

### 4.4 Remote & Production Environments
- **Production Subdomain**: `https://school.success0.com.np`
- **Remote Host**: `bb@100.89.137.102` (Systemd service: `school-app.service`)
- **APK Portal**: Hosted on local network at `http://100.120.244.95:4000`

---

## 5. Unit Testing Suite

### 5.1 How to Run Tests
To execute the unit tests locally:
```bash
npm test
# or directly
node tests/runner.js
```

### 5.2 Test Coverage (22 Suites)
The test runner is located in `tests/runner.js` and provides comprehensive test coverage without third-party runner dependencies:
1. `APIService: get()` — Successfully queries backend data.
2. `APIService: post()` — Stores records accurately.
3. `APIService: patch()` — Selectively updates fields and nested values.
4. `APIService: delete()` — Deletes records at specified paths.
5. `APIService: upload()` — Handles multipart file uploads and progress callbacks.
6. `APIService: showNetworkWarning()` — Generates network alert UI elements.
7. `APIService: handles offline gracefully` — Detects offline status and retries properly.
8. `AuthService: getRoles()` — Validates role list constants.
9. `AuthService: session storage` — Confirms getter and setter persistence.
10. `AuthService: logout()` — Clears session and triggers redirection.
11. `AuthService: checkAuth()` — Restricts unauthorized roles and grants permitted roles.
12. `AuthService: redirectUserToRoleDashboard()` — Redirects each role to correct view.
13. `AuthService: verifyPhoneRegistered()` — Validates phone registry across roles.
14. `AuthService: executeLogin()` — Validates credentials and constructs active sessions.
15. `DatabaseService: Student operations` — Covers get, save, update, remove.
16. `DatabaseService: Teacher operations` — Covers get, save, update, remove.
17. `DatabaseService: Login mapping operations` — Covers retrieval and update.
18. `DatabaseService: Archive and Status History` — Verifies soft deletes and logs.
19. `DatabaseService: Exam Window operations` — Verifies scheduling and deletion.
20. `DatabaseService: Results and Marks operations` — Covers mark entry and lookup.
21. `DatabaseService: Attendance, Class Configs, and Period Timings` — Verifies routine and attendance.
22. `DatabaseService: Notices, Tickets, Suggestions, and Requests` — Verifies communication channels.

### 5.3 Automated Pre-Commit Hook & GitHub Actions
- **Pre-commit hook**: `.git/hooks/pre-commit` automatically runs `node tests/runner.js` before every `git commit`. Any failing test aborts the commit.
- **CI Workflow**: `.github/workflows/test.yml` automatically executes unit tests on push and pull requests to `master`.

---

## 6. Deployment Script (`deploy.sh`)

To test, commit, and deploy changes:
```bash
# Test, stage, and commit locally:
./deploy.sh "Your commit message"

# Test, commit, and push to GitHub:
./deploy.sh "Your commit message" --push

# Test, commit, push, and deploy to remote production server:
./deploy.sh "Your commit message" --push --remote
```