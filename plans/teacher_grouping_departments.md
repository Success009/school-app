# Plan: Teacher Grouping & Academic Departments

This document details the architectural design for organizing teachers into structured academic departments and grade-level divisions to facilitate coordination, directory searches, and future intra-faculty messaging.

---

## 1. Academic Departments & Grade-Level Divisions

To manage large faculties, teachers are categorized under specific **Departments** and **Grade Divisions**.

### 1.1 Academic Departments
Departments group teachers by subject expertise:
*   `DEPARTMENT_MATH`: Mathematics, Advanced Math
*   `DEPARTMENT_SCIENCE`: Physics, Chemistry, Biology, Environmental Science
*   `DEPARTMENT_LANGUAGES`: English, Nepali, Sanskrit
*   `DEPARTMENT_SOCIAL`: Social Studies, History, Civics
*   `DEPARTMENT_COMPUTERS`: Computer Science, Coding, IT Literacy

### 1.2 Grade-Level Divisions
Divisions segment teachers by the classes they teach, streamlining administrative assignments:
*   `DIVISION_PRIMARY`: Grades 1 to 5 (focus on generalist education)
*   `DIVISION_LOWER_SEC`: Grades 6 to 8 (focus on intermediate subjects)
*   `DIVISION_SECONDARY`: Grades 9 to 10 (focus on Board examinations preparation)

---

## 2. Database Schema Extension

Under the `/school/teachers/{employeeId}` path, we introduce structural fields to categorize the teacher:

json
{
  "department": "DEPARTMENT_MATH",
  "division": "DIVISION_SECONDARY",
  "isDepartmentHead": false,
  "joinedYear": "2022"
}
---

## 3. Departmental Directory Views (Admin & Principal)

The Admin and Principal portals will feature an **"Academic Departments"** view to review faculty resource allocations:

### 3.1 UI & Sorting Features:
*   **Department Filter tabs:** Filter teachers dynamically by clicking tabs (e.g., Mathematics, Science, English).
*   **Head of Department (HOD) Badge:** Highlight the coordinator of each department with a distinct HOD label.
*   **Resource Allocation Analytics:** Show summary stats for each department (e.g., "Mathematics Department: 5 Active Teachers | 12 classes assigned").
*   **Roster Actions:** Enable administrative actions, such as changing a teacher's department or updating their status in real time.