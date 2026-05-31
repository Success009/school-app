# Udayashree School App - Active Development & Roadmap

This document tracks the evolution of the Udayashree School App. It serves as the primary source of truth for completed features and upcoming architectural shifts.

---

## 1. Project Philosophy (The "Small School" Model)
*   **Scale:** Exactly 8 classes (Class 1 to Class 8).
*   **Pupil Count:** Low density (5-6 pupils per class).
*   **Versatility:** Teachers often hold multiple roles (Principal, Admin, Subject Specialist).
*   **Simplicity:** Preference for automated workflows and high-visibility UI over complex data management.

---

## 2. Completed Milestones (Archive)

### ✅ Phase 1: Principal Integration & Portal Decommissioning
*   **Action:** Merged Principal functionalities into the Teacher portal.
*   **Outcome:** Deleted `principal.html`, `principal-core.js`, and `principal-students.js`.
*   **Result:** Hierarchy is now managed via `sortOrder` and `professionalTitle` in the teacher profile.

### ✅ Phase 2: Simplified Navigation & UX
*   **Action:** Reduced Parent navigation tabs to three (Home, Suggestions, Profile).
*   **Outcome:** Cleaner mobile interface and removal of redundant "Homework" features.
*   **Result:** Teacher dashboard now features a prominent, full-width "Take Daily Attendance" button.

### ✅ Phase 3: Class Teacher Responsibility (Enforced)
*   **Action:** Implemented `classTeacherOf` attribute in Teacher profiles.
*   **Outcome:** Only the designated Class Teacher can take attendance for their specific class.
*   **Result:** Automation in `teacher-attendance.js` removes manual class selection for teachers.

### ✅ Phase 4: Global Period Timings
*   **Action:** Added "Period Timings" tool in Admin Dashboard.
*   **Outcome:** Administrators can now define global school hours for periods 1-8 and breaks.
*   **Result:** Centralized schedule synchronization across the app.

---

## 3. Current Active Tasks & Immediate Roadmap

### Phase 5: Dynamic Workload & Reassignment
*   **Status:** IMPLEMENTED.
*   **Detail:** Teachers can request class/subject changes. The reassignment form now dynamically pulls available subjects from `school/class_configs` to prevent data entry errors.
*   **Next Step:** Add push notifications (simulated or real) when an admin approves a request.

### Phase 6: Academic Record Hardening
*   **Objective:** Ensure the Results Tracker accurately reflects the global period timings and teacher assignments.
*   **Goal:** Auto-generate report cards that include the teacher's professional title and signature line.

### Phase 7: Data Integrity & Automated Backups
*   **Objective:** Implement a "Soft Delete" system for students and teachers to prevent accidental data loss.
*   **Goal:** Create an "Archived" node in Firebase for terminated faculty or graduated students.

---

## 4. Operational Boundaries (DO NOT VIOLATE)
*   **NO FINANCE:** Strictly no fee, ledger, or payment tracking.
*   **NO HIGH-GRADES:** Strictly Class 1-8 only.
*   **NO SECTIONS:** Default all sections to "General".
*   **IMAGE COMPRESSION:** All uploads must remain JPG (0.9 quality).