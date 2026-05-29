# Upgrade Plan: Parent Portal Refinement & Data Normalization

This document details the step-by-step engineering plan to upgrade the parent portal in the Udayashree School Application. The modifications aim to improve data integrity, remove redundant accounting features, refine academic results management, and correct formatting anomalies on mobile screens.

---

## 1. Feature Specifications

### 1.1 Attendance Percentage Logic
*   **Current State:** Defaults to `100%` if no attendance logs are present.
*   **Proposed State:** If total logs are `0`, the interface must cleanly render `0%` (or `0.0%`) with an empty circle gauge. If 1 log exists (present), display `100%`. If 2 logs exist (1 present, 1 absent), display `50%`.
*   **Implementation:** Update calculation formulas in `parent.js` inside `loadDashboardAttendancePercent()` and `loadAttendanceHistoryAndStats()` to explicitly check if `totalDays === 0` (or `totalLogs === 0`) and return `0`.

### 1.2 Fee Payment Removal & Examination View Integration
*   **Current State:** Dashboard and profile feature standard green/red fee payment statements, Khalti/eSewa mock pay gateways, and outstanding balances.
*   **Proposed State:** Remove all financial ledger statements, invoices lists, payment history, and eSewa/Khalti pay consoles to reduce code bloat. In place of the "Fee Payment" grid button on the Parent Dashboard, add an **"Examination"** or **"Results"** button that immediately loads the `results` view. Remove fee-related links from the profile tab.

### 1.3 Term-Specific Results View & Empty State Handling
*   **Current State:** The `results` view hardcodes a static mockup card showing "First Terminal Examination" grades if database entries are missing.
*   **Proposed State:**
    1.  Add a dropdown selector to allow parents to pick between terminal exam periods:
        *   `Term 1` (First Term)
        *   `Term 2` (Second Term)
        *   `Term 3` (Third Term)
        *   `Finals` (Final Exam)
    2.  When a selection is changed, dynamically trigger `loadParentResults(selectedTerm)`.
    3.  **Completely strip the hardcoded fallback grades.** If the database has no records for the selected term, render a clean empty message: *"No results have been published for this exam term yet."*

### 1.4 Formatting Student Name (Resolving `[object Object]`)
*   **Current State:** The student name in the profile card and details renders as `[object Object]` because the database contains a structured name object: `name: { first: "Aarav", middle: "Chandra", last: "Sharma" }`.
*   **Proposed State:** Add a robust name helper `getStudentFullName(nameObj)` to process both flat strings and structured objects, and replace all instances in the templates.

### 1.5 Father Name Display Replacement
*   **Current State:** The bottom right of the Student Profile Card displays the default teacher's name ("Ms. Sunita Rai").
*   **Proposed State:**
    1.  During Parent login in `login.js`, extract and map the `fatherName` from the student record into the `student` session object inside `currentUser`.
    2.  Update the bottom right of the profile card in `parent.js` to render the father's name as: `Father: {Father's Name}`.

---

## 2. File-by-File Technical Tasks

### 2.1 `login.js` Updates
*   **Task:** Copy the student's `fatherName` into the `currentUser` session state.
*   **Target Block:** Inside `handleLogin()` parent resolution (lines 112-143):
    javascript
    fatherName: s.fatherName || (s.family ? s.family.fatherName : '') || 'N/A'
    ### 2.2 `parent.js` Updates
*   **Task 1:** Add `getStudentFullName(nameObj)` at the top of the script.
*   **Task 2:** Update `parentViews.dashboard` to:
    *   Render full name using the new helper.
    *   Change the teacher name label to: `Father: ${currentUser?.student.fatherName || 'N/A'}`.
    *   Replace the fourth grid button (`fees` / Accounting) with an **Examination** button (`results`).
*   **Task 3:** Update `parentViews.results` to include an HTML dropdown selector of terms and remove mock fallbacks in `loadParentResults()`. If no marks exist, display a clean empty banner.
*   **Task 4:** Clean up unused views (`fees`, `payDues`, `paymentHistory`) and remove their profile links.
*   **Task 5:** Fix `loadDashboardAttendancePercent()` and `loadAttendanceHistoryAndStats()` calculations to default to `0` when logs are empty.

---

## 3. Verification & Deployment Sequence
1.  Verify the updated javascript files using `node -c login.js` and `node -c parent.js`.
2.  Deploy/Sync the updated workspace files to the remote server `100.89.137.102` using `rsync`.
3.  Restart the web server and test directly in the browser on port 5050.
4.  Document the final implementations in `PROJECT_STATUS.md` and `DOCUMENTATION.md` to complete.