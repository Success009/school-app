# Administration Module Plan

## 1. Student Management
- [ ] **Registration Form:** 
  - Student Name, Parent Name, Parent Phone (Primary Key for Login).
  - Blood Group (A+, A-, B+, B-, O+, O-, AB+, AB-, Unknown).
  - Class & Section (Flexible input: e.g., "10-A", "10", "10-APPLE").
- [ ] **Student Directory:** Searchable list of all students with profile view.
- [ ] **Attendance Oversight:** View real-time attendance stats school-wide.

## 2. Teacher Management
- [ ] **Faculty Onboarding:** 
  - Name, Phone Number, Subjects.
  - Assignment: Assign teachers to specific classes/sections.
- [ ] **Schedule Management:** Define periods and subjects for each teacher.

## 3. Communication Hub (Notifications)
- [ ] **Global Announcements:** Send alerts to everyone (Parents + Teachers).
- [ ] **Parent-Only Alerts:** Send notifications to all parents.
- [ ] **Teacher-Only Alerts:** Send internal faculty notifications.
- [ ] **Targeted Messages:** Send a notification to parents of a specific class or student.

## 4. Firebase Integration (Real-time)
- [ ] **Node Structure:** Data stored under `school/students`, `school/teachers`, and `school/notices`.
- [ ] **Media Storage:** Student/Teacher photos stored in `school/profiles/`.