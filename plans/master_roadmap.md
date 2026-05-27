# Udayashree School App - Comprehensive Master Roadmap (v2.0)

This master document outlines the entire functional plan, lifecycle, and implementation steps required to transform the Udayashree School App into a robust, complete system.

---

## 1. Unified Program Map

The next major evolution of the application revolves around making all static visual elements fully active, introducing dynamic administrative controls, and creating structured coordination channels between parents, teachers, and school leadership.

+--------------------------------------------------------------------------------+
|                           UNIFIED LOGIN GATEWAY                                |
|           Resolves Role and profile ID via school/login_mappings/              |
+----------------------------------------+---------------------------------------+
                                         |
         +-------------------------------+-------------------------------+
         |                               |                               |
+--------v--------+             +--------v--------+             +--------v--------+
|   PARENT PORTAL  |             |  TEACHER PORTAL |             |  ADMIN PORTAL   |
| - Attendance %  |             | - Active Tabs   |             | - Onboard Pupil |
| - Dynamic Dues  |             | - My Class RTM  |             | - Onboard Staff |
| - Notice Feed   |             | - Live Register |             | - Edit Records  |
| - Results Card  |             | - Score Entry   |             | - Set Exam dates|
| - Raise Tickets |             | - Profile Port  |             | - Publish Marks |
+--------+--------+             +-----------------+             +--------+--------+
         |                                                               |
         +-----------------------> [FIREBASE RTDB] <---------------------+
---

## 2. Dynamic Core Upgrades

### 2.1 Staff Hierarchies ("Pizza Levels")
Teachers can be assigned secondary leadership statuses (e.g., Principal, Vice Principal, HOD Science, IT Expert) while retaining their core classroom schedules. The Admin portal can update and modify these ranks seamlessly.
*   *Detail File:* `plans/teacher_hierarchy.md`

### 2.2 Dynamic Student Sorting & Directory Management
Administrators and Principals can view a consolidated student master list and filter/sort them dynamically by Class and Section. This replaces standard search with structured academic filters.
*   *Detail File:* `plans/teacher_hierarchy.md`

### 2.3 Comprehensive Examination & Archive Workflow
The Admin portal defines active exam windows (First Term, Mid-Term, Finals, Semesters). Assigned teachers can submit student grades for their classes during this window. After the window closes, the marks are archived, reviewed by Admin, and published for parent viewing.
*   *Detail File:* `plans/examination_marks_workflow.md`

### 2.4 Dynamic Client-Side Marksheet & Certificate Generator
Parents can view and download detailed printable "Marks Certificates" (report cards). The marksheet is generated dynamically on the client side to avoid server-side PDF processing.
*   *Detail File:* `plans/marksheet_pdf_generation.md`

### 2.5 Teacher Grouping & Academic Departments
Teachers are organized into "Subject Departments" (e.g., Mathematics, Humanities, Computer Science) and "Grade Level Divisions" (Primary, Secondary) to enable structured directories.
*   *Detail File:* `plans/teacher_grouping_departments.md`

### 2.6 Support Ticketing System
Parents can raise specific support queries (e.g., fee discrepancies, bus delays) that route to the Admin and Principal queues for structured resolution tracking.
*   *Detail File:* `plans/support_ticketing.md`

---

## 3. Server Architecture Analysis: "Do We Need a Central Server?"

Our exhaustive technical analysis indicates that **a dedicated central application server is NOT required** for this system. A Serverless Architecture powered directly by Firebase provides a faster, cheaper, and more scalable solution.
*   *Detail File:* `plans/server_architecture_analysis.md`

---

## 4. Sequential Step-by-Step Implementation Outline

To maintain application stability, upgrades will be implemented in the following sequence:

1.  **Iteration 1 (Onboarding & Sorting):** Upgrade Student/Teacher directories in Admin & Principal views to support dynamic editing and sorting by Class-Sections.
2.  **Iteration 2 (Teacher Status & Grouping):** Implement teacher hierarchy attributes ("Pizza Levels") and departmental groupings.
3.  **Iteration 3 (Exam Management - Admin):** Build the Admin panel interface for setting Exam dates, assigning subjects, and toggling active mark upload windows.
4.  **Iteration 4 (Marks Submission - Teacher):** Build the sequential roll-number-by-roll-number score entry interface in the Teacher Portal with auto-save capabilities.
5.  **Iteration 5 (Archive, Publish & Certificate):** Implement database archiving, Admin review/publish controls, and the dynamic client-side Printable Marksheet Certificate for parents.
6.  **Iteration 6 (Ticketing System):** Build the support ticket creation and resolution pipeline.