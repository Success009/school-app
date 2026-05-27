# Udayashree School Management System - Technical Documentation (v2.2)

This reference manual documents the **Distributed Architecture** and recently integrated **Dynamic Core Workflows** of the Udayashree School Application. The app features role-isolated sub-portals sharing central configurations, a reusable components engine, and full real-time database synchronizations.

---

## 1. Directory Tree & Distributed Layout

The codebase separates concerns across isolated role controllers, which mitigates code bleed and streamlines Capacitor/Cordova builds.

*   `/home/success0/Downloads/school-app/`
    *   `index.html` — Splash page, branding animations, and unified numeric login gateway.
    *   `login.js` — Phone and OTP session registration controller.
    *   `shared.js` — central bootstrap engine, security authorization filters, custom resolvers, dynamic debug tools, and the shared Faculty Directory.
    *   `style.css` — Standard mobile style sheets, safe area paddings, and print-layout media styles.
    *   `parent.html` / `parent.js` — Parent and pupil records, printable report cards, financial ledgers, and help desk ticket submissions.
    *   `teacher.html` / `teacher.js` — Class rosters, attendance logs, and sequential mark submission entries.
    *   `admin.html` / `admin.js` — Master directories, configuration panels (exams and help desk), and profile update controls.
    *   `principal.html` / `principal.js` — Performance analytics dashboards, pupil filters, and teacher workload summaries.

---

## 2. Integrated Feature Pipelines

### 2.1 Student Sorting, Onboarding, and Record Management (Iteration 1)
*   **Alphabetical Class Sorting:** The administrator can filter the master students list by specific Class and Section (e.g. `10-A`), which automatically sorts entries alphabetically by first name.
*   **On-the-Fly Directory Edits:** Clicking a student profile loads a dynamic edit form, allowing administrative updates to pupil names, blood groups, roll numbers, ages, parent designations, and phone numbers directly in `/school/students/{studentId}`.

### 2.2 Dynamic Operational Status & Departments (Iteration 2)
*   **Real-time Availability Status:** Faculty profiles feature active status markers (such as *Active / On Duty*, *In Class*, *On Leave*, *Off Duty*) which render as colored tags across directories.
*   **Subject Expert Grouping:** Teachers are classified under discrete Departments (e.g., `DEPARTMENT_MATH`, `DEPARTMENT_SCIENCE`) and Divisions (e.g., `DIVISION_SECONDARY`), highlighting coordinators with a distinct red **HOD** badge.
*   **Setting Controls:** Administrators can update operational availability, department alignments, division ranks, joined years, and HOD status flags seamlessly via the teacher profile settings form in `admin.js`.

### 2.3 Exam Configuration & Entry Lockout (Iteration 3 & 4)
*   **Exam Scheduler:** Administrators configure active exam terms (e.g., `First Terminal Exam 2026`) and set evaluation date windows (`openingDate` and `closingDate`). Full Marks and Pass Marks are now managed dynamically by teachers.
### 2.8 Academic Subject Management (Iteration 7)
*   **Class Subject Configuration:** Admins can define compulsory and up to 5 optional subject groups per class via the Subject Manager.
*   **Dynamic Student Enrollment:** During registration, selecting a class dynamically loads that class's subjects, allowing for personalized elective selection per pupil.
### 2.9 Media Performance Engine
*   **Image Normalization:** The app now locally converts all profile and document uploads to high-quality JPGs before transmission, ensuring high clarity with minimal storage footprint.
*   **Real-time Progress UI:** All file uploads now feature a global backdrop-blurred progress ring, providing visual feedback during multi-file registration.
*   **Date Enforcement & Lockout:** The teacher portal validates deadlines on entry. If the evaluation dates are exceeded or if the status is marked closed, the system triggers a **Deadline Lockout** mode. This allows teachers to audit existing grades but locks all edit boxes and blocks draft submissions.

### 2.4 Sequential Marks Submission Sheet (Iteration 4)
*   **Focus-Centered Entry:** Displays one student profile at a time, sorted strictly by numeric roll number. Contains full bio headers, including photo, name, and ID card indicators.
*   **Type Preview:** As teachers type grades, the system runs dynamic percentage checks and highlights predicted letter grades (e.g. `A+`, `B`) in real-time.
*   **Draft Auto-Save:** Pressing `Enter` or clicking `Next` automatically registers the grade as an interim draft at `/school/draft_results/{studentId}/{examId}/{subject}` and shifts focus to the subsequent student card.

### 2.5 Archive, Publication & Report Cards (Iteration 5)
*   **Archive Transition:** Once evaluations close, the administrator can audit statistics and click **Publish Results**. This locks draft scores and aggregates/archives them under `/school/results/{studentId}/{examId}/{subject}`.
*   **Dynamic Report Cards:** Once published, report cards unlock on parent profiles.
*   **Printable Certificate Generator:** Clicking the PDF button opens a cleanly compiled print window which overrides mobile interfaces, formats table metrics (Full, Pass, Obtained, letter grade, final percentage, and calculated GPA), appends dynamic signature blocks, and triggers native device printing (`window.print()`) in clean A4 proportions.

### 2.6 Support Tickets & Response Thread (Iteration 6)
*   **Parent Help Requests:** Parents can submit academic, transport, or accounts tickets. These register a ticket metadata block at `/school/tickets/{ticketId}` with active tracking status flags.
*   **Unified Support Inbox:** Admin monitors all tickets in a unified queue. 
*   **Discussion Feed:** Selecting a ticket launches a discussion view with parent-child profile info, priority levels, and a chronologically compiled message history thread.
*   **Help Desk Response Console:** Administrative personnel can type replies, push messages to the replies database timeline, and update the resolution status to **Resolved** in real time.

### 2.7 Financial Ledgers & Automated Billing Reconciliation (Finance Module)
*   **Parent Ledger Dashboard:** Parents can access a dynamic financial statement detailing their active outstanding dues, upcoming invoices (tuition, exams, buses, and labs), and deadline timetables.
*   **Digital Wallet Settle Gate:** Parents can select any unpaid debit invoice and initiate mock payment transitions through green *eSewa Wallet* or purple *Khalti Pay* gateways. Successful transactions immediately deduct student statement balances and log a verified receipt.
*   **Collection Metrics Board:** Accountants monitor monthly collection parameters and aggregate pending outstanding dues dynamically across all registered grade folders.
*   **Student Ledger Directory:** Accountant views a comprehensive, class-sortable and searchable ledger checklist, highlighting deficit accounts. Clicking any student card opens their detailed statements.
*   **Ad-Hoc Manual Debit Billing:** Accountant can manually charge and bill separate student accounts with custom invoice items (e.g. damages or activity fees) with specific deadlines.
*   **Offline Payment Clearance:** Enables recording physical check or cash collections against unpaid student invoice items, immediately updating parent statements.
*   **Batch Billing Generation:** Accountants can generate batch billing for the whole school with a single click, automatically posting a Rs. 3,000 tuition debit invoice to every student.

---

## 3. Real-Time Firebase Database Schema Reference

### 3.1 `/school/students/{studentId}`
json
{
  "name": { "first": "Aarav", "middle": "Chandra", "last": "Sharma" },
  "class": "10",
  "section": "A",
  "roll": "01",
  "bloodGroup": "A+",
  "age": 16,
  "joinYear": "2024",
  "fatherName": "Kamal Sharma",
  "motherName": "Sita Sharma",
  "phone": "9812345678",
  "photo": "https://...",
  "address": {
    "current": { "street": "Belchowk", "city": "Bharatpur", "district": "Chitwan" },
    "permanent": { "street": "Belchowk", "city": "Bharatpur", "district": "Chitwan" }
  }
}
### 3.2 `/school/teachers/{employeeId}`
json
{
  "name": "Sunita Rai",
  "phone": "9801122334",
  "subjects": ["Mathematics", "Advanced Math"],
  "assignedClasses": ["10-A", "9-B"],
  "professionalTitle": "Senior Mathematics Faculty",
  "statusLabel": "Active",
  "isAvailable": true,
  "department": "DEPARTMENT_MATH",
  "division": "DIVISION_SECONDARY",
  "isDepartmentHead": true,
  "joinedYear": "2022"
}
### 3.3 `/school/exam_windows/{examId}`
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
### 3.4 `/school/tickets/{ticketId}`
json
{
  "id": "TK-183049",
  "studentId": "US-2026-4819",
  "studentName": "Aarav Chandra Sharma",
  "parentPhone": "9812345678",
  "parentName": "Kamal Sharma",
  "category": "Accounts & Billing",
  "title": "May Lab Fee Overcharge",
  "description": "We were billed double for computing fees. Please correct.",
  "priority": "Medium",
  "status": "Opened",
  "timestamp": 1779884500000,
  "replies": [
    {
      "sender": "Nabin Jha (Admin)",
      "message": "We are checking with the accounting desk now.",
      "timestamp": 1779884900000
    }
  ]
}
### 3.5 `/school/fee_ledgers/{studentId}`
json
{
  "studentId": "US-2026-4819",
  "studentName": "Aarav Chandra Sharma",
  "classSection": "10-A",
  "balance": 4500,
  "invoices": {
    "inv_01": {
      "id": "inv_01",
      "title": "Tuition Fee (May 2026)",
      "amount": 3000,
      "status": "Unpaid",
      "deadline": "2026-06-10"
    },
    "inv_02": {
      "id": "inv_02",
      "title": "Exam Fee (Term 1)",
      "amount": 1500,
      "status": "Unpaid",
      "deadline": "2026-06-15"
    }
  }
}
### 3.6 `/school/payment_history/{studentId}/{paymentId}`
json
{
  "id": "PAY-918204",
  "invoiceId": "inv_01",
  "title": "Tuition Fee (May 2026)",
  "amount": 3000,
  "method": "eSewa Mobile Wallet",
  "reconciliationCode": "REC-93821092",
  "status": "Verified",
  "timestamp": 1779885700000
}
---

*End of Reference Manual.*