# Udayashree School App - Technical Reference Manual (Modularized v3.0)

This reference manual documents the **Highly Distributed Modular Architecture** of the Udayashree School Management System. By splitting large monolithic files into dedicated specialized script segments, this architecture simplifies maintenance, mitigates file conflicts, and eliminates points of failure.

---

## 1. Modular Directory Tree & Distributed Scripts Layout

The web application separates role-specific screens and core actions into isolated files, loaded sequentially within simple HTML shells.

### 1.1 Base Resources
*   `index.html` — Spalsh portal, mobile-first login views with numeric inputs.
*   `login.js` — Dynamic Firebase OTP authentication. Checks `school/admin/`, `school/head/`, or `school/login_mappings/` dynamic phone records and uses `0000` bypass.
*   `shared.js` — Core bootstrap engine, initial Firebase declarations, ROLES enumeration, safe area filters, SafeResolvers, and customizable global notifications.
*   `style.css` — Standard mobile style sheets, safe area padding, and reports overrides.

### 1.2 Parent Sub-Application (distributed)
*   `parent.html` — Parent HTML shell structure.
*   `parent-attendance.js` — Student attendance analytics calculations and historical logs.
*   `parent-results.js` — Academic grade charts rendering and printable certificate PDFs.
*   `parent-tickets.js` — Query raised desk tickets, response console logging, and resolving.
*   `parent-core.js` — Base routing controller, assignments checkboxes, notices, and routine schedules.

### 1.3 Faculty Portal (distributed)
*   `teacher.html` — Teacher HTML shell layout with persistent navigation tabs.
*   `teacher-attendance.js` — Dynamic roster loaders and daily attendance submissions.
*   `teacher-marks.js` — Subject scale configurations, sequence rosters sorting, real-time letter grades predictions, and score saves.
*   `teacher-core.js` — Schedule timelines, profile cards, and dashboard metrics.

### 1.4 Central Administration (distributed)
*   `admin.html` — Master layout.
*   `admin-subjects.js` — Compulsory and optional academic subject configurations.
*   `admin-students.js` — On-the-fly directory list filters, address syncs, and automatic compulsory subjects assignment.
*   `admin-teachers.js` — Faculty profiles, availability status settings, and document proving.
*   `admin-exams.js` — Dynamic exam term schedules, dates lockout, and result publishes.
*   `admin-tickets.js` — Centralized helpdesk logs thread discussions, replies, and closures.
*   `admin-config.js` — School principal credentials and photo configuration.
*   `admin-core.js` — Command dashboard statistics, notice broadcasts, and core routing.

---

## 2. Real-Time Firebase Database Schema Map

The entire application relies on a single Firebase Realtime Database. The active database branches are structured as follows:

### 2.1 Students Database — `school/students/{studentId}`
json
{
  "id": "US-2026-4718",
  "name": { "first": "Aarav", "middle": "Chandra", "last": "Sharma" },
  "class": "3",
  "section": "General",
  "roll": "01",
  "bloodGroup": "O+",
  "age": 9,
  "joinYear": "2026",
  "fatherName": "Kamal Sharma",
  "motherName": "Sita Sharma",
  "phone": "9812345678",
  "photo": "https://...",
  "address": {
    "current": { "street": "Belchowk", "city": "Bharatpur", "district": "Chitwan" },
    "permanent": { "street": "Belchowk", "city": "Bharatpur", "district": "Chitwan" }
  },
  "academic": {
    "subjects": ["Mathematics", "Science", "Social Studies"],
    "session": "2026"
  }
}
### 2.2 Faculty Database — `school/teachers/{employeeId}`
json
{
  "id": "UT-2026-1052",
  "name": { "first": "Sunita", "middle": "Kumari", "last": "Rai" },
  "phone": "9801122334",
  "subjects": ["Mathematics", "Science"],
  "assignedClasses": ["1", "2", "3"],
  "professionalTitle": "Senior Mathematics Faculty",
  "statusLabel": "Active",
  "isAvailable": true,
  "department": "DEPARTMENT_MATH",
  "division": "DIVISION_PRIMARY",
  "isDepartmentHead": true,
  "joinedYear": "2022"
}
### 2.3 Exam Windows Scheduling — `school/exam_windows/{examId}`
json
{
  "title": "First Terminal Exam 2026",
  "termId": "Term 1",
  "status": "Published",
  "openingDate": "2026-06-01",
  "closingDate": "2026-06-15"
}
### 2.4 Discussion Support Helpdesk — `school/tickets/{ticketId}`
json
{
  "id": "TK-183049",
  "studentId": "US-2026-4718",
  "studentName": "Aarav Chandra Sharma",
  "parentPhone": "9812345678",
  "parentName": "Kamal Sharma",
  "category": "Academics",
  "title": "Curriculum details query",
  "description": "Please share details regarding textbooks.",
  "priority": "Medium",
  "status": "Resolved",
  "timestamp": 1779884500000,
  "replies": [
    {
      "sender": "Nabin Rai (Admin)",
      "message": "We have shared the PDF over Viber.",
      "timestamp": 1779884900000
    }
  ]
}
### 2.5 Attendance Logging — `school/attendance/{class}/{date}/{studentId}`
json
{
  "status": "present",
  "studentName": "Aarav Chandra Sharma",
  "teacherName": "Ms. Sunita Rai",
  "timestamp": 1779884500000
}
### 2.6 Results & Grades — `school/results/{studentId}/{examId}/{subject}`
json
{
  "subject": "Mathematics",
  "total": 100,
  "pass": 40,
  "obtained": 85,
  "grade": "A",
  "recordedBy": "Ms. Sunita Rai",
  "timestamp": 1779885700000
}
---

## 3. Core Technical Features

1.  **Simplified School Model (Class 1-8)**: All classes are restricted strictly to lower grades (Class 1 to Class 8) to reduce structural code bleed.
2.  **No Sectioning**: Dropped complex sections code, defaulting sections value internally to "General" to maintain dynamic class configurations.
3.  **Compulsory Subject Automation**: Student registration automatically fetches compulsory subjects matching their selected Class Code from the database configuration `school/class_configs/{classId}/subjects/compulsory` and saves them to the student's profile.
4.  **No Financial Records**: Cleaned up and removed all ledger tracking, collections dashboards, digital settles, and accounting panels.
5.  **Image Optimization Engine**: Converts uploaded profiles and documents locally to highly optimized JPGs (0.9 quality) and handles dynamic blur progress loaders.
    