# Plan: Dynamic Client-Side Marksheet & Certificate Generator

This document details the layout design, client-side rendering mechanics, and print-to-PDF export strategies for generating professional student Marksheets (report cards) and Certificates without requiring a backend PDF generation server.

---

## 1. Visual Layout of the Printable Marksheet Certificate

The report card must feel like a premium, official school certificate. When the parent accesses the results, the system compiles the database data into a structured grid:

+-------------------------------------------------------------+
|                UDAYASHREE ENGLISH SCHOOL                    |
|          Bharatpur, Chitwan, Nepal | Tel: +977-56-XXXXXX    |
+-------------------------------------------------------------+
|                  PROGRESS REPORT CARD                       |
|  Exam: First Terminal Evaluation | Year: 2026               |
+-------------------------------------------------------------+
|  Student ID: US-2026-4819        | Roll No: 01              |
|  Name: Aarav Chandra Sharma      | Class: 10 - A            |
+-------------------------------------------------------------+
| Subject      | Full  | Pass  | Obtained | Grade | Remarks   |
+--------------+-------+-------+----------+-------+-----------+
| Mathematics  | 100   | 40    | 92       | A+    | Excellent |
| Science      | 100   | 40    | 84       | A     | Very Good |
| ...          | ...   | ...   | ...      | ...   | ...       |
+--------------+-------+-------+----------+-------+-----------+
| GPA: 3.85    | Total Obtained: 176/200  | Grade: A          |
+-------------------------------------------------------------+
|                                                             |
|   ......................             ...................... |
|      Class Teacher                      Principal           |
+-------------------------------------------------------------+
### 1.1 Structural Components
*   **School Header:** Official school branding, logo, contact details, and progress report title.
*   **Student Bio Block:** Student name, ID, class, section, roll number, and academic year.
*   **Evaluation Matrix Table:** Subject names, full marks, pass marks, obtained scores, and letter grades.
*   **Academic Summary Bar:** Total marks scored, percentage, GPA, and final remarks.
*   **Signatures Block:** Teacher remarks and digital placeholder signatures (or clean blank lines for physical signatures after printing).

---

## 2. Client-Side Rendering Mechanics (The Serverless Edge)

Instead of relying on a resource-intensive central backend server to generate and compile PDFs, the application handles report card generation **directly on the client-side** using standard browser APIs.

### 2.1 Technical Stack
1.  **Tailwind CSS `@media print` Styles:** We configure clean CSS rules to hide headers, footers, buttons, and debug menus when printing. This isolates the report card container on the page, optimizing it for standard printer dimensions.
2.  **Browser Print API (`window.print()`):** A native, cross-platform call that opens the device's system print dialog. This allows users to either print the document physically or save it directly as a clean PDF file.
3.  **HTML5 Canvas & jsPDF (Optional Advanced Integration):** If an isolated download file is requested, a client-side library like `jsPDF` or `html2canvas` captures the DOM container and outputs a vector PDF instantly.

---

## 3. Printable Styling Configuration

To ensure report cards render perfectly on standard letter/A4 paper dimensions, we inject printer-specific styles into `style.css`:

css
@media print {
    /* Hide all mobile navigation, headers, and actions */
    #bottom-nav, #main-header, button, #debug-menu-container {
        display: none !important;
    }
    
    /* Reset container margins for print */
    body, #app, #main-content {
        background: white !important;
        color: black !important;
        height: auto !important;
        overflow: visible !important;
        padding: 0 !important;
        margin: 0 !important;
    }
    
    /* Page break optimization */
    .printable-report-card {
        page-break-inside: avoid;
        border: 2px solid #1d4ed8;
        padding: 2rem;
        border-radius: 0;
        box-shadow: none !important;
    }
}