# Udayashree School App - Model Context (v4.0)

## 1. Primary Constraints
*   **Target Scope:** Class 1 through Class 8 only.
*   **Class Size:** Small (5-6 students).
*   **No Finance:** All billing/payment code is prohibited.
*   **No Sections:** Default to "General".
*   **JS Bracket Bug:** Never output `[]` empty; use `[ ]` instead.

## 2. Deployment Details
*   **SSH Host:** `100.120.244.95` (User: `bigfish`, Pwd: `bigfish`)
*   **Remote Path:** `/home/bigfish/school-app-deploy`
*   **Sync Command:**
    `sshpass -p 'bigfish' rsync -avz --delete --exclude '.git' --exclude 'backups' /mnt/data_vault/Downloads/school-app/ bigfish@100.120.244.95:school-app-deploy/`

## 3. Architecture Map
*   **Role Shells:** `admin.html`, `teacher.html`, `parent.html`.
*   **Logic:** Distributed across `-core.js` and feature-specific scripts (e.g., `teacher-attendance.js`).
*   **Core Logic Change:** Class Attendance is now strictly tied to the `classTeacherOf` property on the teacher's profile.

## 4. Immediate Working Directory
All work happens in `/mnt/data_vault/Downloads/school-app/`. Ensure you push to the remote server after significant updates to maintain synchronization with home devices.