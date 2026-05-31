# Udayashree School App - Technical Reference Manual (v4.0)

This manual documents the **Modular Distributed Architecture** of the Udayashree School Management System.

---

## 1. Modular Directory Tree

### 1.1 Core Shells & Authentication
*   `index.html` / `login.js` — Unified entry point with role-based routing (0000 bypass).
*   `shared.js` — Bootstrap engine, Firebase config, and global SafeResolvers.

### 1.2 Administrative Suite (`admin.html`)
*   `admin-core.js` — Main dashboard, Period Timings (Global), and Notice Broadcasts.
*   `admin-students.js` — Pupil onboarding and automated subject assignments.
*   `admin-teachers.js` — Faculty management and Class Teacher designations (`classTeacherOf`).
*   `admin-subjects.js` — Curriculum mapping (Compulsory/Optional) by grade.
*   `admin-exams.js` — Grading windows and results publishing.
*   `admin-tickets.js` — Parent support helpdesk.

### 1.3 Faculty Suite (`teacher.html`)
*   `teacher-core.js` — Personal dashboard, Suggestions Feed, and Reassignment Requests.
*   `teacher-attendance.js` — Class-locked attendance register (Strictly assigned classes only).
*   `teacher-marks.js` — Academic grading and letter grade predictions.

### 1.4 Parent Suite (`parent.html`)
*   `parent-core.js` — Child's dashboard, schedules, and routine.
*   `parent-attendance.js` — Historical attendance analytics.
*   `parent-results.js` — Report card generation.
*   `parent-tickets.js` — Support queries and Suggestion board.

---

## 2. Updated Database Schema Map

### 2.1 Faculty Node — `school/teachers/{id}`
json
{
  "id": "UT-2083-1234",
  "name": { "first": "Sunita", "last": "Rai" },
  "classTeacherOf": "3", 
  "assignedClasses": ["1", "2", "3"],
  "professionalTitle": "Senior Faculty / Principal",
  "sortOrder": 1
}
*Note: `classTeacherOf` controls the "Take Attendance" permission and roster loading.*

### 2.2 Global Config — `school/config/`
*   `period_timings/`: Defines the global school bell schedule (Start/End times).
*   `class_configs/`: Defines valid subjects per class.

---

## 3. Key Feature Logic

1.  **Attendance Enforcement:** The system identifies the logged-in teacher's `classTeacherOf` attribute. If set to a class ID, the teacher gets access to a simplified attendance roster. If `none`, access is denied.
2.  **Period Settings:** Admin defines period slots (e.g., "1st", "Lunch"). These are stored globally and used to normalize schedules across student and teacher views.
3.  **Workload Requests:** Teachers can apply for reassignment. The admin panel provides a one-click "Approve" button that automatically updates the teacher's profile and schedule node in the database.
4.  **No-Section Protocol:** All operations default to the "General" section to maintain a flat, manageable structure for small class sizes.