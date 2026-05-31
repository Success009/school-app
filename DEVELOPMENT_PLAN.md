# Udayashree School App - Next Phase Development Plan

This document details the planned enhancements, design changes, and feature purges for the next iteration of the Udayashree School App. Any future AI model working on this project must implement the modifications outlined in this plan sequentially, maintaining the distributed, modular script architecture.

---

## 1. Context & Small-School Reality
*   **Scale**: The school consists of exactly 8 classes (Class 1 to Class 8) with only 5 to 6 pupils per class.
*   **Philosophy**: Complexity must be minimized. Features that add maintenance overhead without practical classroom value should be deprecated in favor of snappy, intuitive visual features.
*   **Core Objective**: Promote faculty versatility (teachers acting in multiple administrative/leadership roles) and streamline parent communication.

---

## 2. Feature Roadmap & Execution Steps

### Phase 1: Principal Portal Decommissioning & Faculty Promotion
*   **Why**: The school is small. A standalone, separate principal account portal and login flow is redundant. The principal is also a teacher and should log in using a regular Teacher account.
*   **File Changes**:
    *   **Delete**: `principal.html`, `principal-core.js`, `principal-students.js`.
    *   **Update `shared.js` & `login.js`**: Remove the principal check (`school/head/` database check) and `ROLES.PRINCIPAL` routing logic. Redirect principal credentials to standard Teacher portal loading.
    *   **Update `admin-teachers.js` & Onboarding forms**:
        *   Add a sorting order integer (`sortOrder` or similar) to the Teacher schema in Firebase.
        *   Allow administrators to customize title hierarchies (e.g., placing the Principal, HOD, Senior Teacher, or IT Administrator at the top of listings).
        *   Teachers can be assigned professional titles (like "Principal" or "IT Administrator") which are rendered as badges in directory cards.

### Phase 2: Parent App Dashboard Enhancements
*   **Why**: The current bottom navigation is overwhelming (5 tabs). Simplifying navigation to 3 core tabs improves readability and focus.
*   **File Changes**:
    *   **Update `parent.html` & `parent-core.js`**:
        *   Reduce bottom navigation items to exactly three core buttons:
            1.  **Home** (Dashboard and Academic Grid Buttons).
            2.  **Suggestions** (New Parent-to-Faculty suggestion board).
            3.  **Profile** (Bio, Routine, other contacts, and Logout).
        *   Remove the Log Out button from the top-right corner of the header. Keep a clear, tactile **Log Out** option under the **Profile** tab cards list, or center it elegantly in the navigation footer if it adds value.
        *   Move the **Faculty Directory** (currently a banner card at the bottom of Home) into the main services grid as a regular pressed button, matching the style of Attendance, Routine, and Exam Results.

### Phase 3: Removing Legacy Assignments / Homework Feature
*   **Why**: Digitizing daily homework is overly complex and practically unused in close-knit small communities. Direct communication is preferred. Removing it eliminates code bloat.
*   **File Changes**:
    *   **Update `parent-core.js`**: Remove the Homework view render blocks and Homework grids.
    *   **Update `parent.html`**: Delete Homework bottom navigation button.
    *   **Update `teacher-core.js`**: Remove Homework buttons and dashboards shortcuts.

### Phase 4: Parent Suggestions Feed (New Feature)
*   **Why**: Create a simple, constructive channel for parent-faculty communication. Suggestions will be logged in Firebase and visible to all faculty members.
*   **File Changes**:
    *   **Create `parent-tickets.js` extension (or update)**:
        *   Under the parent's new **Suggestions** tab, display a clean form for submitting feedback directly to the faculty.
        *   Write suggestions to Firebase Realtime Database at `school/suggestions/{suggestionId}` with: `id`, `parentName`, `parentPhone`, `studentName`, `message`, `timestamp`.
    *   **Update `teacher-core.js` & `admin-core.js`**:
        *   Render a "Parent Suggestions" reader board.
        *   All teachers and administrators should have read-only access to view chronological suggestions submitted by parents.

### Phase 5: Teacher Portal UX & Class Reassignment Request Workflow
*   **Why**: Since schedules and class allocations change dynamically in small schools, teachers need an intuitive way to request class or subject adjustments.
*   **File Changes**:
    *   **Update `teacher-core.js`**:
        *   Add a "Request Class Reassignment" button.
        *   Let teachers choose a Class (1-8) and Subject from a drop-down and submit their change application.
        *   Write requests to `school/class_change_requests/{requestId}` containing: `requestId`, `teacherId`, `teacherName`, `requestedClass`, `requestedSubject`, `status: "Pending"`, `timestamp`.
    *   **Update `admin-core.js` & `admin-teachers.js`**:
        *   Render a "Class Change Requests" queue.
        *   Administrators can click "Approve" or "Deny".
        *   If approved, the system automatically writes the new class to the teacher's profile (`school/teachers/{teacherId}/assignedClasses`) and updates their schedule node.
    *   **Polish Teacher Dashboard**: Update `teacher-core.js` to look highly visual and clean, with prominent buttons for Attendance, Marks, Suggestions Feed, and Reassignment.

### Phase 6: Centralized Admin Customization Upgrades
*   **Why**: Give administrators ultimate power to customize schedules, student details, and faculty sorting orders on-the-fly.
*   **File Changes**:
    *   **Update `admin-core.js` & `admin-students.js`**:
        *   Build an interface to adjust pupil schedules, add subjects, and refine records directly.
        *   Ensure all announcements and broadcast notice panels are extremely intuitive.
    