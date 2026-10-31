
# Udayashree School App — Module Rehaul Backlog & Future Plan

> Single source of truth for the current rehaul cycle. Each module is built **isolated → tested → spun up standalone → reviewed by owner → merged into main app**.
> Status legend: `[ ]` todo · `[~]` in progress · `[x]` done & merged · `[r]` awaiting owner review

---

## 0. Working Protocol (per module)
1. Isolate the module (engine + UI controller + standalone page).
2. Write/extend automated tests (tests/runner.js, `--group=<name>`).
3. Spin up on local server (port 5050 background job) for owner review.
4. Owner reviews in browser and gives feedback; iterate until perfect.
5. Commit + push to private repo (`Success009/school-app`).
6. Merge into main app (`admin.html` / `teacher.html` / `parent.html` routing).

---

## 1. Admin Module Status

| Module | Status | Notes |
|---|---|---|
| Faculty: Add / Directory / Edit | `[x]` | 73/73 tests, verified, committed `df4891b` |
| Student: Add | `[x]` | done; needs width + dup-back-button fix (see §2) |
| Student: Directory / Edit | `[x]` | done & tested |
| **Examination module** | `[ ]` | **NOT STARTED — entirely remaining** |
| **Class & Subject Management (Setup)** | `[~]` | exists but mislabeled/over-scoped — see §2 |
| **Notice Board** | `[ ]` | minimal stub (`Recent Notices` + `sendNotice` only) |
| **Period Timings** | `[ ]` | minimal (basic slot CRUD), needs upgrade |
| **Support Help Desk** | `[ ]` | empty — needs full ticket lifecycle |
| **Parent Suggestions / Feedback** | `[ ]` | empty — needs redesign (see §3 group-chat idea) |
| **Unified Messaging / Group Chat** | `[ ]` | NEW future module — see §3 |

---

## 2. Immediate Fixes (from owner review)

### 2.1 Duplicate back buttons — [x] DONE (2026-06)
- Removed in-content "Dashboard"/"Back to Panel" buttons from: student-add, faculty-add, admin-setup, teacher-edit, admin-core (helpDesk, examsManagement, periodSettings). Universal header arrow is now the single back control. (original note below)
- **Problem:** Modules render their own in-content "Back to Dashboard" button *plus* the universal header back arrow. Dashboard button is also non-functional in some.
- **Fix:** Remove all in-content back-to-dashboard buttons. Keep ONE universal header back arrow (`renderHeader` / `handleBackNavigation`). Applies to: `student-add`, `faculty-add`, `admin-setup`, `helpDesk`, `examsManagement`, and any other `adminRouter('dashboard')` in-content button.

### 2.2 Width / aspect-ratio mismatch — [x] DONE (2026-06)
- Standardized student-add canvas to `max-w-3xl mx-auto` (matches faculty-add). Both forms now share one width. (original note below)
- **Problem:** `student-add` uses `max-w-4xl` (full wide), `faculty-add` uses `max-w-3xl` (narrower). Inconsistent visual width between modules.
- **Fix:** Standardize all admin module canvases to one width (`max-w-3xl` preferred for forms) via a shared wrapper class.

### 2.3 Setup / Subject Management restructuring — [x] DONE (2026-06)
- Removed the big "System Foundation" banner from dashboard. Removed legacy `subjectManager` view + router hook + grid button; replaced with single "Class & Subject Mgmt" button routing to `schoolSetup`. Setup header retitled "Class & Subject Management". (original note below)
- **Problem:** Two overlapping concepts — `schoolSetup` (a big "System Foundation / Configure Classes & Subjects" banner + wizard) and `subjectManager` (a legacy per-class subject config). The "System Foundation" branding/big banner is unwanted.
- **Fix (owner directive):**
  - Remove the big "System Foundation → Configure Classes & Subjects → Open Setup" banner from the dashboard.
  - Remove the separate legacy `subjectManager` view.
  - Keep a **single** module — rename to **"Class & Subject Management"** — that does classes + subjects (what `schoolSetup`/`admin-setup.js` already does well). This becomes the one canonical place for class/subject config.

---

## 3. New / Redesigned Modules

### 3.1 Unified Messaging & Group Chat (NEW — separate module)
- A cross-role communication system, independent of the teacher/parent/admin portals but accessible within each (different permission levels).
- **Channels:** per-class groups (class teacher + parents of that class), faculty lounge, admin broadcast, direct messages.
- **Permissions:** admin (all channels, moderation), teacher (own class + faculty), parent (own class only, read/post).
- Backend: `school/messages/{channelId}` with role-based read/write; poll or SSE for live updates.
- Replaces/absorbs the currently-empty "Parent Suggestions" into a proper interactive channel.

### 3.2 Notice Board (upgrade)
- Rich notices: title, body, target (all/parents/teachers/class), attachments, pin/expiry, read-receipts.
- Admin CRUD list + parent/teacher feed with unread badges.

### 3.3 Period Timings (upgrade)
- Full bell schedule: per-period start/end, break periods, working-days, tie into attendance & routine generation.

### 3.4 Support Help Desk (upgrade)
- Ticket lifecycle: open → in-progress → resolved, threaded replies, priority, category, assignment to staff, parent-visible status.

---

## 4. Examination Module (NOT STARTED — full scope)

Planned design (mirrors faculty/student module pattern):
- **Engine:** `modules/examModule.js` (zero DOM) — exam window CRUD, subject exam config, marks entry, grade computation, report-card data assembly.
- **Marks entry engine:** per class/subject/full-marks/pass-marks; letter grades (A+ 90, A 80, B+ 70, B 60, C+ 50, C 40, D, E).
- **Results publishing:** draft → publish gate; parent report card consumption.
- **UI:** `admin-exam-*.js` controllers + standalone pages (`exam-view.html`, `exam-marks.html`, `exam-config.html`).
- **Tests:** new `--group=exam` suite.

---

## 5. Execution Order (proposed)
1. §2.1 duplicate back buttons (quick, all modules)
2. §2.2 width standardization (quick)
3. §2.3 Class & Subject Management consolidation
4. §4 Examination module (largest — build isolated + tested + standalone)
5. §3.3 Period Timings upgrade
6. §3.2 Notice Board upgrade
7. §3.4 Support Help Desk upgrade
8. §3.1 Unified Messaging / Group Chat (new, largest design)
