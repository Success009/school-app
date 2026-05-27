# Plan: Comprehensive Examination & Marks Submission Workflow

This document details the complex system governing exam creation, teacher marks submission windows, sequential roll-number entry screens, and database archiving/publishing procedures.

---

## 1. Exam Configuration & Active Entry Windows (Admin Portal)

Instead of manually assigning teachers to exams, the system uses a **rules-based time window model**.

### 1.1 Exam Scheduling Form (Admin View)
The Admin Portal has an "Exam Scheduler" dashboard that lets administrators configure:
*   **Exam Name / Term:** (e.g., `First Terminal Exam 2026`, `Final Semester Evaluation`)
*   **Opening Date:** The timestamp when teachers can start entering student scores.
*   **Closing Date:** The strict deadline after which the upload window locks, prohibiting further entries.
*   **Default Scale:** Sets default Full Marks (FM) and Pass Marks (PM) (e.g., FM: 100, PM: 40).

### 1.2 Schema for Active Exams
Active windows are written under `/school/exam_windows/{examId}`:
json
{
  "title": "First Terminal Exam 2026",
  "termId": "Term 1",
  "openingDate": "2026-06-01",
  "closingDate": "2026-06-15",
  "defaultFullMarks": 100,
  "defaultPassMarks": 40,
  "status": "Active"
}
---

## 2. Dynamic Teacher Permissions & Verification

When a teacher logs in, the portal checks for any currently active exam windows.

### 2.1 Authorization Mapping:
The system automatically resolves permissions based on existing workload assignments without manual admin routing:
1.  **Workload Query:** The system reads the teacher's assigned classes (e.g., `10-A`) and subjects (e.g., `Mathematics`) from their profile.
2.  **Date Verification:** Checks if the current local date falls between an active exam window's `openingDate` and `closingDate`.
3.  **Active Option Open:** If yes, the "Enter Marks" tab displays the active exam. The teacher is granted access to write scores only for classes and subjects assigned to their profile.

---

## 3. Sequential Marks Entry Interface (Teacher Portal)

To make marks entry fast and user-friendly, we design a **Focus-Centered Sequential Entry Sheet**:

+-------------------------------------------------------------+
| Class: 10-A  | Subject: Mathematics | Term: First Terminal  |
| Full Marks: 100                     | Pass Marks: 40        |
+-------------------------------------------------------------+
|                                                             |
|   [Roll No. 01]  Aarav Sharma                               |
|   Enter Obtained Marks: [  85  ] (Out of 100)               |
|                                                             |
|   [Prev Student]                             [Next Student] |
+-------------------------------------------------------------+
### 3.1 UX Workflow:
*   **Roster Loop:** The interface displays one student at a time, ordered by Roll Number.
*   **Keyboard-optimized Inputs:** Pressing `Enter` or clicking `Next` automatically saves the current student's score and loads the next student, moving the focus to the input box.
*   **Real-time Grade Calculation:** As the teacher types a score, the screen dynamically displays the percentage and calculated letter grade (e.g., `85 -> 85% -> A`).
*   **Interim Auto-Save:** Every time the teacher clicks "Next", the score is saved as a draft under `/school/draft_results/{studentId}/{examId}/{subject}`.

---

## 4. Archiving, Publication, and Parent Notifications

Once the exam window deadline is reached, the system transitions from draft entry to final archiving and parent publication.

### 4.1 Archiving Procedure:
1.  **Automatic Lockout:** On the closing date, the Teacher Portal automatically locks the inputs, hiding the submit controls and making the marks cards read-only.
2.  **Admin Review Queue:** The Administrator reviews the compiled class statistics (missing entries, grade averages, highest scores).
3.  **Publish Trigger:** The Administrator clicks **"Publish Results"**.
4.  **Archiving Post:** The system moves all verified scores from `/school/draft_results` to the final `/school/results/{studentId}/{examId}` node.
5.  **Dynamic Parent Unlock:** Once published, parent profiles receive an active notification, and the "Report Card" tab dynamically unlocks and renders the student's final marksheet.