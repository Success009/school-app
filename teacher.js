/**
 * ==========================================
 * UDAYASHREE SCHOOL - TEACHER PORTAL MODULE
 * ==========================================
 * 
 * DESCRIPTION:
 * This module controls the Teacher sub-application of the Udayashree School App.
 * It is built with a Single Page Application (SPA) architecture, using dynamic 
 * view swaps rendered directly into the "#main-content" DOM container. It shares 
 * visual styles from "style.css" and database connections from "shared.js".
 * 
 * DESIGN PRINCIPLES:
 * 1. Single App, Multiple Identities: State is derived from "currentUser" populated by shared.js.
 * 2. Mobile-First: Large touch targets, horizontal slides, safe padding.
 * 3. Crash-Resistant: All parameters utilize SafeResolvers from shared.js to prevent UI breakage if fields are null.
 * 
 * SYSTEM ARCHITECTURE (TABS INCLUDED):
 * - Dashboard: General welcome banner, registration metrics, chronological routine summaries.
 * - Schedule: Detailed breakdown of periods, subjects, and rooms assigned to the faculty.
 * - Attendance: Database-linked student register loader, instant Present/Absent toggles, and daily update queries.
 * - Marks: Evaluation recorder that calculates letter grades (A+, A, B+, B, C+, C, E) and writes results.
 * - Profile: Displays teacher credentials, assigned classes, and primary subjects.
 * 
 * DATABASE SCHEMA MAPS:
 * - Read student roster: /school/students (matches 'class' and 'section')
 * - Write attendance logs: /school/attendance/{class-section}/{date}/{studentId}
 * - Write marks cards: /school/results/{studentId}/{termId}/{subject}
 * 
 * COOPERATING FILES:
 * - shared.js (Provides database hooks, SafeResolvers, and active debug utilities)
 * - teacher.html (Acts as the HTML shell structure and bottom persistent nav)
 */

// ==========================================
// 1. INITIALIZATION & SESSION GUARD
// ==========================================

// Ensure that only authenticated users with the 'teacher' role can execute this script.
if (checkAuth([ROLES.TEACHER])) {
    document.addEventListener('DOMContentLoaded', () => {
        // Automatically default routing to the Teacher Dashboard view on boot.
        teacherRouter('dashboard');
    });
}

// Global buffer state to hold the selected class student roster before database commit.
let activeRosterList = [ ];

// ==========================================
// 2. VIEW TEMPLATES (THE TEACHER VIEWS)
// ==========================================

const teacherViews = {
    /**
     * View: Dashboard
     * Displays greeting cards, dynamic counts of school students, period metrics, and today's schedule.
     */
    dashboard: {
        title: 'Faculty Dashboard',
        render: () => `
            <!-- Top Greeting Card with Portrait -->
            <div class="mb-6 flex justify-between items-center animate-fade-in">
                <div>
                    <h2 class="text-2xl font-black text-gray-800">Hello, ${SafeResolvers.text(currentUser?.name.split(' ')[0], 'Teacher')}</h2>
                    <p class="text-xs text-blue-600 font-bold uppercase tracking-widest mt-1">Faculty Member</p>
                </div>
                <img src="${SafeResolvers.photo(currentUser?.photo)}" class="w-12 h-12 rounded-full object-cover border-2 border-blue-500 shadow-md" alt="Teacher Photo">
            </div>

            <!-- Quantitative Overview Cards -->
            <div class="grid grid-cols-2 gap-4 mb-6">
                <div class="mobile-card bg-blue-700 text-white p-5 shadow-lg">
                    <span id="dash-total-students" class="block text-2xl font-black">...</span>
                    <span class="text-[10px] opacity-70 uppercase font-bold tracking-wide">Registered Students</span>
                </div>
                <div class="mobile-card bg-indigo-600 text-white p-5 shadow-lg">
                    <span class="block text-2xl font-black">${SafeResolvers.count(currentUser?.schedule ? currentUser.schedule.length : 2)}</span>
                    <span class="text-[10px] opacity-70 uppercase font-bold tracking-wide">Periods Today</span>
                </div>
            </div>

            <!-- Current Schedule Timeline Summary -->
            <h3 class="font-bold text-gray-800 mb-4">My Schedule Summary</h3>
            <div class="space-y-3">
                ${(currentUser?.schedule || [ ]).map(s => `
                    <div class="mobile-card flex items-center justify-between border-l-4 border-blue-600 bg-white">
                        <div>
                            <h4 class="font-bold text-gray-800">${s.subject} - Class ${s.class}</h4>
                            <p class="text-[10px] text-gray-400 font-bold uppercase mt-1">${s.time} | Period ${s.period}</p>
                        </div>
                        <button onclick="teacherRouter('attendance')" class="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-xs font-bold active:scale-95 transition-all">
                            Take Attendance
                        </button>
                    </div>
                `).join('')}
            </div>

            <!-- Quick Action Shortcuts -->
            <div class="mt-8 grid grid-cols-2 gap-4">
                <button onclick="teacherRouter('marks')" class="mobile-card flex flex-col items-center justify-center p-6 text-blue-600 bg-white hover:bg-gray-50">
                    <i class="fas fa-file-signature text-xl mb-2"></i>
                    <span class="text-[10px] font-black uppercase">Enter Marks</span>
                </button>
                <button onclick="teacherRouter('schedule')" class="mobile-card flex flex-col items-center justify-center p-6 text-purple-600 bg-white hover:bg-gray-50">
                    <i class="fas fa-calendar-day text-xl mb-2"></i>
                    <span class="text-[10px] font-black uppercase">Full Routine</span>
                </button>
            </div>
        `
    },

    /**
     * View: Schedule
     * Renders a clean chronological list of all lessons and classes assigned to this teacher.
     */
    schedule: {
        title: 'Weekly Routine',
        render: () => `
            <div class="mb-6">
                <h3 class="font-bold text-gray-800 mb-1 text-lg">My Subject Schedule</h3>
                <p class="text-xs text-gray-500">View chronological periods and classrooms</p>
            </div>
            
            <div class="space-y-4">
                ${(currentUser?.schedule || [ ]).map(s => `
                    <div class="mobile-card border-l-4 border-blue-600 bg-white flex items-center justify-between p-4">
                        <div>
                            <span class="text-[9px] font-bold text-blue-600 uppercase tracking-widest">Period ${s.period}</span>
                            <h4 class="font-bold text-gray-800 text-base mt-0.5">${s.subject}</h4>
                            <p class="text-[10px] text-gray-400 font-bold uppercase mt-1">Class ${s.class} | ${s.time}</p>
                        </div>
                        <span class="bg-gray-50 text-gray-600 px-3 py-1 rounded-xl text-xs font-bold">Room ${s.class.includes('A') ? '102' : '104'}</span>
                    </div>
                `).join('')}
            </div>
        `
    },

    /**
     * View: Attendance
     * Interactive roster loader and attendance marker.
     * Dynamic inputs allow filtering by date and class-section to commit updates to /school/attendance/.
     */
    attendance: {
        title: 'Daily Attendance',
        render: () => `
            <div class="mb-4">
                <h3 class="font-bold text-gray-800 text-lg mb-1">Mark Daily Attendance</h3>
                <p class="text-xs text-gray-500">Select class to load student database records</p>
            </div>

            <div class="space-y-4">
                <!-- Class Selection Cards -->
                <div class="mobile-card grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1">Select Class</label>
                        <select id="attend-class-select" class="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none text-xs font-bold">
                            <option value="10-A">Class 10-A</option>
                            <option value="9-B">Class 9-B</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1">Select Date</label>
                        <input type="date" id="attend-date" class="w-full p-2 bg-gray-50 border border-gray-100 rounded-xl outline-none text-xs font-bold" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                </div>

                <!-- Load Trigger -->
                <button onclick="loadAttendanceRoster()" class="w-full bg-blue-700 text-white font-black py-3 rounded-xl shadow-md active:scale-95 transition-all text-xs">
                    <i class="fas fa-users-cog mr-2"></i> Load Class Roster
                </button>

                <!-- Roster Rendering Container -->
                <div id="attendance-roster-container" class="space-y-3 pt-2">
                    <div class="text-center py-8 text-gray-300 italic text-xs">No roster loaded. Choose class and click Load.</div>
                </div>

                <!-- Commit Changes Button -->
                <div id="submit-roster-btn-div" class="hidden">
                    <button onclick="submitAttendance()" class="w-full bg-green-600 text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all mt-4">
                        <i class="fas fa-check-double mr-2"></i> Submit Daily Register
                    </button>
                </div>
            </div>
        `
    },

    /**
     * View: Marks
     * Real-time report card evaluation forms. Calculates letter grades instantly and posts records.
     */
    marks: {
        title: 'Exam Marks Entry',
        render: () => `
            <div id="marks-config-panel" class="space-y-4">
                <div class="mb-4">
                    <h3 class="font-bold text-gray-800 text-lg mb-1">Select Exam Configuration</h3>
                    <p class="text-xs text-gray-500">Choose exam window, class, and subject to begin sequential marks entry</p>
                </div>

                <div class="mobile-card">
                    <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Exam Term Window</label>
                    <select id="marks-exam-select" class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-xs font-bold">
                        <option value="loading">Loading active exam terms...</option>
                    </select>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="mobile-card">
                        <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Class / Section</label>
                        <select id="marks-class-select" class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-xs font-bold">
                            ${(currentUser?.assignedClasses || ["10-A", "9-B"]).map(c => `<option value="${c}">${c}</option>`).join('')}
                        </select>
                    </div>
                    <div class="mobile-card">
                        <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Subject</label>
                        <select id="marks-subject-select" class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-xs font-bold">
                            ${(currentUser?.subjects || ["Mathematics", "Science"]).map(s => `<option value="${s}">${s}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <button onclick="startSequentialEntry()" class="w-full bg-blue-700 text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all">
                    <i class="fas fa-play mr-2"></i> Start Sequential Entry
                </button>
            </div>

            <!-- Sequential Marks Sheet Container (Initially Hidden) -->
            <div id="sequential-entry-panel" class="hidden space-y-4 pb-10">
                <div class="flex items-center justify-between">
                    <div>
                        <h3 id="seq-header-term" class="font-black text-gray-800 text-base">...</h3>
                        <p id="seq-header-details" class="text-xs text-gray-500">...</p>
                    </div>
                    <button onclick="exitSequentialEntry()" class="text-gray-400 font-bold text-xs hover:text-red-500">
                        <i class="fas fa-times-circle mr-1"></i> Exit
                    </button>
                </div>

                <!-- Active Student Card -->
                <div class="mobile-card border-t-4 border-blue-600 bg-white relative overflow-hidden flex flex-col items-center py-6 text-center shadow-lg">
                    <!-- Progress meter -->
                    <span id="seq-student-index" class="absolute right-4 top-4 text-[9px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">...</span>

                    <div class="w-24 h-24 rounded-2xl overflow-hidden border-2 border-gray-50 shadow-md mb-3">
                        <img id="seq-student-photo" src="https://via.placeholder.com/150" class="w-full h-full object-cover">
                    </div>

                    <h4 id="seq-student-name" class="font-black text-gray-800 text-lg">...</h4>
                    <p id="seq-student-id" class="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">...</p>
                    <p id="seq-student-roll" class="text-[9px] font-bold text-blue-500 uppercase mt-0.5">Roll Number: ...</p>
                </div>

                <!-- Keyboard-Optimized Input Entry -->
                <div class="mobile-card">
                    <div class="grid grid-cols-3 gap-3 mb-4">
                        <div class="text-center">
                            <span class="block text-[8px] font-black text-gray-400 uppercase">Full Marks</span>
                            <span id="seq-fm" class="text-sm font-black text-gray-700 mt-1 block">100</span>
                        </div>
                        <div class="text-center">
                            <span class="block text-[8px] font-black text-gray-400 uppercase">Pass Marks</span>
                            <span id="seq-pm" class="text-sm font-black text-gray-700 mt-1 block">40</span>
                        </div>
                        <div class="text-center">
                            <span class="block text-[8px] font-black text-gray-400 uppercase font-black text-blue-600">Calculated</span>
                            <span id="seq-grade-preview" class="text-sm font-black text-blue-600 mt-1 block">N/A</span>
                        </div>
                    </div>

                    <div>
                        <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Enter Obtained Marks</label>
                        <div class="relative">
                            <input type="number" id="seq-obtained" oninput="previewSequenceGrade()" class="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl text-center text-xl font-black outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. 85">
                        </div>
                        <p class="text-[9px] text-gray-400 mt-2 text-center font-bold">Press <span class="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">Enter ⏎</span> to auto-save and advance to next student.</p>
                    </div>
                </div>

                <!-- Horizontal Navigation Controls -->
                <div class="grid grid-cols-2 gap-3 mt-4">
                    <button onclick="prevSequenceStudent()" class="bg-white border border-gray-100 text-gray-700 font-bold p-3 rounded-xl text-xs flex items-center justify-center gap-1 active:scale-95 transition-all">
                        <i class="fas fa-chevron-left text-[10px]"></i> Previous
                    </button>
                    <button id="seq-next-btn" onclick="nextSequenceStudent()" class="bg-blue-700 text-white font-black p-3 rounded-xl text-xs flex items-center justify-center gap-1 active:scale-95 transition-all">
                        Next / Save <i class="fas fa-chevron-right text-[10px]"></i>
                    </button>
                </div>
            </div>
        `
    },

    /**
     * View: Profile
     * Faculty dashboard credentials display card showing assigned classes, subjects, IDs, and avatars.
     */
    profile: {
        title: 'Faculty Profile',
        render: () => `
            <div class="flex flex-col items-center my-6">
                <div class="w-24 h-24 bg-white rounded-full flex items-center justify-center text-blue-700 mb-3 border-4 border-white shadow-xl relative overflow-hidden">
                    <img src="${SafeResolvers.photo(currentUser?.photo)}" class="w-full h-full object-cover" alt="Teacher">
                </div>
                <h2 class="text-xl font-bold">${SafeResolvers.text(currentUser?.name)}</h2>
                <span class="text-xs text-gray-500 font-bold uppercase tracking-widest">Faculty Member</span>
                <p class="text-[10px] text-gray-400 mt-1">Faculty ID: ${SafeResolvers.text(currentUser?.id)}</p>
            </div>
            
            <div class="mobile-card space-y-4">
                <div>
                    <span class="block text-[9px] font-bold text-gray-400 uppercase">Primary Subject Competencies</span>
                    <span class="font-bold text-gray-700 text-sm mt-1 block">${SafeResolvers.text(currentUser?.subjects ? currentUser.subjects.join(', ') : 'Mathematics, Science')}</span>
                </div>
                <hr class="border-gray-50">
                <div>
                    <span class="block text-[9px] font-bold text-gray-400 uppercase">Assigned Classes</span>
                    <span class="font-bold text-gray-700 text-sm mt-1 block">${SafeResolvers.text(currentUser?.assignedClasses ? currentUser.assignedClasses.join(', ') : '10-A, 9-B')}</span>
                </div>
                <hr class="border-gray-50">
                <div>
                    <span class="block text-[9px] font-bold text-gray-400 uppercase">Registered Mobile Contact</span>
                    <span class="font-bold text-gray-700 text-sm mt-1 block">${SafeResolvers.text(currentUser?.phone)}</span>
                </div>
            </div>

            <div class="mobile-card !p-0 overflow-hidden divide-y divide-gray-50 mt-4">
                <div onclick="teacherRouter('teachers')" class="p-4 flex items-center active:bg-gray-50 cursor-pointer">
                    <i class="fas fa-chalkboard-teacher text-gray-400 mr-4 w-5"></i>
                    <span class="text-sm font-medium">Faculty Directory</span>
                    <i class="fas fa-chevron-right ml-auto text-gray-300 text-xs"></i>
                </div>
                <div onclick="handleLogout()" class="p-4 flex items-center active:bg-gray-50 text-red-500 cursor-pointer">
                    <i class="fas fa-power-off mr-4 w-5"></i>
                    <span class="text-sm font-bold">Logout</span>
                </div>
            </div>
        `
    },
    teachers: {
        title: 'Faculty Directory',
        render: () => `
            <div id="teacher-colleagues-container" class="space-y-3 pb-10">
                <div class="text-center py-10 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Loading Directory...</div>
            </div>
        `
    }
};

// ==========================================
// 3. CENTRAL ROUTER & PORTAL EMULATOR
// ==========================================

/**
 * Main Teacher view dispatch router.
 * Activates templates dynamically, triggers horizontal slide anims, and handles sub-tab listeners.
 * @param {string} viewName 
 */
function teacherRouter(viewName) {
    const view = teacherViews[viewName] || teacherViews.dashboard;
    
    // Render standardized header and perform view slides
    renderHeader(view.title);
    triggerViewTransition();

    // Render targeted view template
    document.getElementById('main-content').innerHTML = view.render();

    // Toggle navigation tab active classes
    document.querySelectorAll('.nav-item').forEach(btn => {
        if (btn.getAttribute('data-view') === viewName) {
            btn.classList.add('text-blue-700');
            btn.classList.remove('text-gray-400');
        } else {
            btn.classList.remove('text-blue-700');
            btn.classList.add('text-gray-400');
        }
    });

    // Sub-view hooks and observers
    if (viewName === 'dashboard') {
        db.ref('school/students').once('value', snap => {
            const el = document.getElementById('dash-total-students');
            if (el) el.innerText = SafeResolvers.count(snap.numChildren());
        });
    }

    if (viewName === 'marks') {
        populateExamWindowsDropdown();
    }

    if (viewName === 'teachers') {
        renderSharedTeacherDirectory('teacher-colleagues-container', { canClickToCall: true });
    }

    // Always reset main content window scroll to top
    document.getElementById('main-content').scrollTop = 0;
}

// ==========================================
// 4. FUNCTIONAL BUSINESS LOGICS (DATABASE CONNECTIONS)
// ==========================================

/**
 * Loads dynamic student roster based on selected Class-Section filter.
 * Parses selections (e.g. "10-A" -> Class "10", Section "A") and maps active Present/Absent indicators.
 */
async function loadAttendanceRoster() {
    const classVal = document.getElementById('attend-class-select').value;
    const dateVal = document.getElementById('attend-date').value;
    const rosterContainer = document.getElementById('attendance-roster-container');
    const submitBtnDiv = document.getElementById('submit-roster-btn-div');

    if (!classVal || !dateVal) return;

    rosterContainer.innerHTML = `<div class="text-center py-10 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Loading student profiles...</div>`;
    submitBtnDiv.classList.add('hidden');
    activeRosterList = [ ];

    // Extract Grade and Sections matching DB structures
    let targetClass = classVal;
    let targetSection = "General";
    if (classVal.includes('-')) {
        const parts = classVal.split('-');
        targetClass = parts[0];
        targetSection = parts[1];
    }

    try {
        const snap = await db.ref('school/students').once('value');
        const students = snap.val();
        
        if (!students) {
            rosterContainer.innerHTML = `<div class="text-center py-8 text-gray-400 italic">No registered students found in database.</div>`;
            return;
        }

        // Filter student database by classroom parameters
        const filtered = Object.entries(students).filter(([studentId, s]) => {
            return s.class === targetClass && s.section === targetSection;
        });

        if (filtered.length === 0) {
            rosterContainer.innerHTML = `<div class="text-center py-8 text-yellow-600 bg-yellow-50 rounded-xl text-xs p-4 border border-yellow-100">No students are registered in Class ${classVal} yet. Add them in the Admin panel!</div>`;
            return;
        }

        // Initialize local session roster arrays
        activeRosterList = filtered.map(([studentId, s]) => {
            return {
                id: studentId,
                name: s.name ? `${s.name.first || ''} ${s.name.middle || ''} ${s.name.last || ''}`.replace(/\s+/g, ' ').trim() : 'Student',
                status: 'present' // default baseline
            };
        });

        rosterContainer.innerHTML = activeRosterList.map((s, index) => `
            <div class="mobile-card flex items-center justify-between p-4 bg-white border border-gray-100">
                <div class="flex items-center">
                    <div class="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-xs mr-3">
                        ${s.name.charAt(0)}
                    </div>
                    <div>
                        <h4 class="font-bold text-gray-800 text-sm">${s.name}</h4>
                        <p class="text-[9px] text-gray-400 font-bold uppercase mt-0.5">ID: ${s.id}</p>
                    </div>
                </div>
                <div class="flex gap-2">
                    <button id="p-btn-${index}" onclick="toggleRosterStatus(${index}, 'present')" class="px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all bg-green-100 text-green-700 shadow-sm border border-green-200">
                        Present
                    </button>
                    <button id="a-btn-${index}" onclick="toggleRosterStatus(${index}, 'absent')" class="px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all bg-gray-50 text-gray-400 border border-gray-100">
                        Absent
                    </button>
                </div>
            </div>
        `).join('');

        submitBtnDiv.classList.remove('hidden');
    } catch (e) {
        console.error(e);
        rosterContainer.innerHTML = `<div class="text-center py-10 text-red-400">Failed to load class roster: ${e.message}</div>`;
    }
}

/**
 * Toggles a single student's attendance flag in the active buffer roster list.
 * Updates green (Present) / red (Absent) pill buttons on the UI instantly.
 * @param {number} index 
 * @param {string} status 
 */
function toggleRosterStatus(index, status) {
    if (!activeRosterList[index]) return;
    activeRosterList[index].status = status;

    const pBtn = document.getElementById(`p-btn-${index}`);
    const aBtn = document.getElementById(`a-btn-${index}`);

    if (status === 'present') {
        pBtn.className = "px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all bg-green-100 text-green-700 shadow-sm border border-green-200";
        aBtn.className = "px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all bg-gray-50 text-gray-400 border border-gray-100";
    } else {
        pBtn.className = "px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all bg-gray-50 text-gray-400 border border-gray-100";
        aBtn.className = "px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all bg-red-100 text-red-700 shadow-sm border border-red-200";
    }
}

/**
 * Writes active attendance roster logs to the Realtime database under school/attendance/
 * Path: school/attendance/{class-section}/{date}/{studentId}
 */
async function submitAttendance() {
    const classVal = document.getElementById('attend-class-select').value;
    const dateVal = document.getElementById('attend-date').value;
    
    if (activeRosterList.length === 0 || !classVal || !dateVal) return;

    try {
        const batchUpdates = { };
        const teacherName = currentUser?.name || "Teacher Staff";

        activeRosterList.forEach(s => {
            batchUpdates[`school/attendance/${classVal}/${dateVal}/${s.id}`] = {
                status: s.status,
                studentName: s.name,
                teacherName: teacherName,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            };
        });

        await db.ref().update(batchUpdates);
        alert(`Attendance roster for Class ${classVal} submitted successfully!\nDate: ${dateVal}`);
        teacherRouter('dashboard');
    } catch (e) {
        console.error(e);
        alert("Failed to submit attendance roster: " + e.message);
    }
}

// ==========================================
// BUSINESS LOGIC: SEQUENTIAL EXAMINATION MARKS ENTRY
// ==========================================

let activeSeqRoster = [ ];
let activeSeqIndex = 0;
let activeExamId = '';
let activeClassId = '';
let activeSubjectId = '';
let activeFM = 100;
let activePM = 40;

async function populateExamWindowsDropdown() {
    const select = document.getElementById('marks-exam-select');
    if (!select) return;

    try {
        const snap = await db.ref('school/exam_windows').once('value');
        const windows = snap.val();

        if (!windows) {
            // Fallback mock values if DB is empty so that it doesn't break
            select.innerHTML = `
                <option value="term1_2026">First Terminal Exam 2026 (Active)</option>
                <option value="midterm_2026">Mid-Term Exam 2026 (Draft)</option>
                <option value="finals_2026">Final Examination 2026 (Closed)</option>
            `;
            return;
        }

        select.innerHTML = Object.entries(windows).map(([examId, item]) => {
            const statusLabel = item.status === 'Active' ? 'Active' : 'Closed/Draft';
            return `<option value="${examId}">${item.title} (${statusLabel})</option>`;
        }).join('');

    } catch (e) {
        console.error(e);
        select.innerHTML = `<option value="none">Error loading exam windows</option>`;
    }
}

async function startSequentialEntry() {
    const examSelect = document.getElementById('marks-exam-select');
    const classSelect = document.getElementById('marks-class-select');
    const subjectSelect = document.getElementById('marks-subject-select');

    if (!examSelect || !classSelect || !subjectSelect) return;

    activeExamId = examSelect.value;
    activeClassId = classSelect.value;
    activeSubjectId = subjectSelect.value;

    if (activeExamId === 'loading' || activeExamId === 'none') {
        alert("Please select a valid exam window.");
        return;
    }

    // Default lockout states
    window.activeExamLocked = false;

    // Load defaults from exam window and check deadlines
    try {
        const snapExam = await db.ref('school/exam_windows/' + activeExamId).once('value');
        const examDetails = snapExam.val();
        if (examDetails) {
            // Date verification & lockout checks
            const now = new Date();
            const start = new Date(examDetails.openingDate);
            const end = new Date(examDetails.closingDate + 'T23:59:59');

            let isLocked = false;
            let lockReason = "";

            if (examDetails.status !== 'Active' && examDetails.status !== 'Published') {
                isLocked = true;
                lockReason = `This exam window status is '${examDetails.status}'.`;
            } else if (now < start) {
                isLocked = true;
                lockReason = `This exam window opens on ${examDetails.openingDate}.`;
            } else if (now > end) {
                isLocked = true;
                lockReason = `This exam window closed on ${examDetails.closingDate}.`;
            }

            if (isLocked) {
                alert(`[DEADLINE LOCKOUT] ${lockReason}\n\nScores can be reviewed but modifications are disabled.`);
                window.activeExamLocked = true;
            }
        }
    } catch (err) {
        console.error("Deadline lookup error:", err);
    }

    // Step 2: Show Configuration Modal if not locked
    if (!window.activeExamLocked) {
        showMarksConfigModal();
    } else {
        // Default values for viewing
        activeFM = 100;
        activePM = 40;
        proceedToSequentialLoading();
    }
}

function showMarksConfigModal() {
    const modalId = 'teacher-marks-config-modal';
    let modal = document.getElementById(modalId);
    if (!modal) {
        modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'fixed inset-0 z-[10002] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-opacity duration-300';
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div class="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-fade-in text-center">
            <div class="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl">
                <i class="fas fa-sliders-h"></i>
            </div>
            <h3 class="text-lg font-black text-gray-800 mb-1">Subject Scale</h3>
            <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-6">${activeSubjectId} | Class ${activeClassId}</p>
            
            <div class="grid grid-cols-2 gap-3 mb-6">
                <div>
                    <label class="text-[8px] font-black text-gray-400 uppercase block mb-1 text-left ml-2">Full Marks</label>
                    <input type="number" id="config-fm" class="w-full p-4 bg-gray-50 border-none rounded-2xl text-base font-bold focus:ring-2 focus:ring-indigo-500 outline-none" value="100">
                </div>
                <div>
                    <label class="text-[8px] font-black text-gray-400 uppercase block mb-1 text-left ml-2">Pass Marks</label>
                    <input type="number" id="config-pm" class="w-full p-4 bg-gray-50 border-none rounded-2xl text-base font-bold focus:ring-2 focus:ring-indigo-500 outline-none" value="40">
                </div>
            </div>

            <button onclick="confirmMarksConfig()" class="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-transform">
                Start Grading
            </button>
            <button onclick="document.getElementById('teacher-marks-config-modal').remove()" class="w-full text-gray-400 font-bold py-2 text-xs mt-2">Cancel</button>
        </div>
    `;
}

function confirmMarksConfig() {
    const fm = parseInt(document.getElementById('config-fm').value);
    const pm = parseInt(document.getElementById('config-pm').value);

    if (isNaN(fm) || isNaN(pm) || fm <= 0) {
        alert("Please enter valid numeric values for scaling.");
        return;
    }

    activeFM = fm;
    activePM = pm;
    
    document.getElementById('teacher-marks-config-modal').remove();
    proceedToSequentialLoading();
}

async function proceedToSequentialLoading() {
    const examSelect = document.getElementById('marks-exam-select');
    const configPanel = document.getElementById('marks-config-panel');
    const seqPanel = document.getElementById('sequential-entry-panel');
    

    try {
        const snapStudents = await db.ref('school/students').once('value');
        const students = snapStudents.val();

        if (!students) {
            alert("No students registered in the database.");
            return;
        }

        // Parse selected class/section (e.g. "10-A" -> Class "10", Section "A")
        let targetClass = activeClassId;
        let targetSection = "General";
        if (activeClassId.includes('-')) {
            const parts = activeClassId.split('-');
            targetClass = parts[0];
            targetSection = parts[1];
        }

        activeSeqRoster = Object.entries(students).filter(([id, data]) => {
            return data.class === targetClass && data.section === targetSection;
        }).map(([id, data]) => {
            let fullName = '';
            if (data.name && typeof data.name === 'object') {
                fullName = `${data.name.first || ''} ${data.name.middle || ''} ${data.name.last || ''}`.replace(/\s+/g, ' ').trim();
            } else {
                fullName = data.name || 'Student';
            }
            return {
                id,
                name: fullName,
                roll: data.roll || 'N/A',
                photo: data.photo || 'https://via.placeholder.com/150'
            };
        });

        // Sort by Roll Number numerically, or by name if roll is missing
        activeSeqRoster.sort((a, b) => {
            const rollA = parseInt(a.roll);
            const rollB = parseInt(b.roll);
            if (!isNaN(rollA) && !isNaN(rollB)) return rollA - rollB;
            return a.name.localeCompare(b.name);
        });

        if (activeSeqRoster.length === 0) {
            alert(`No students found registered for Class ${activeClassId}.`);
            return;
        }

        // Transition views
        configPanel.classList.add('hidden');
        seqPanel.classList.remove('hidden');

        // Set Exam header details
        document.getElementById('seq-header-term').innerText = examSelect.options[examSelect.selectedIndex].text;
        document.getElementById('seq-header-details').innerText = `Class ${activeClassId} | Subject: ${activeSubjectId}`;
        document.getElementById('seq-fm').innerText = activeFM;
        document.getElementById('seq-pm').innerText = activePM;

        // Load first student
        activeSeqIndex = 0;
        showSequenceStudent();

        // Listen for the Enter key on the Obtained Marks input box
        const obtainedInput = document.getElementById('seq-obtained');
        if (obtainedInput) {
            obtainedInput.onkeydown = function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    nextSequenceStudent();
                }
            };
        }

    } catch (e) {
        console.error(e);
        alert("Failed to query student registry: " + e.message);
    }
}

async function showSequenceStudent() {
    if (activeSeqIndex < 0 || activeSeqIndex >= activeSeqRoster.length) return;

    const student = activeSeqRoster[activeSeqIndex];
    
    // Set UI indicators
    document.getElementById('seq-student-index').innerText = `Student ${activeSeqIndex + 1} of ${activeSeqRoster.length}`;
    document.getElementById('seq-student-name').innerText = student.name;
    document.getElementById('seq-student-id').innerText = `ID: ${student.id}`;
    document.getElementById('seq-student-roll').innerText = `Roll Number: ${student.roll}`;
    document.getElementById('seq-student-photo').src = SafeResolvers.photo(student.photo);

    // Update next button label
    const nextBtn = document.getElementById('seq-next-btn');
    if (activeSeqIndex === activeSeqRoster.length - 1) {
        nextBtn.innerHTML = `Save & Finish <i class="fas fa-flag-checkered text-[10px]"></i>`;
    } else {
        nextBtn.innerHTML = `Next / Save <i class="fas fa-chevron-right text-[10px]"></i>`;
    }

    const input = document.getElementById('seq-obtained');
    input.value = '';
    if (window.activeExamLocked) {
        input.disabled = true;
        input.placeholder = "Locked";
    } else {
        input.disabled = false;
        input.placeholder = "Out of " + activeFM;
    }
    document.getElementById('seq-grade-preview').innerText = 'N/A';
    document.getElementById('seq-grade-preview').className = 'text-sm font-black text-blue-600 mt-1 block';

    // Query if there is an existing draft/final mark in results node or drafts node
    try {
        const snap = await db.ref(`school/draft_results/${student.id}/${activeExamId}/${activeSubjectId}`).once('value');
        if (snap.exists()) {
            const data = snap.val();
            if (data.obtained !== undefined) {
                input.value = data.obtained;
                previewSequenceGrade();
            }
        } else {
            // Also check final results node in case it was published or saved there earlier
            const snapFinal = await db.ref(`school/results/${student.id}/${activeExamId}/${activeSubjectId}`).once('value');
            if (snapFinal.exists()) {
                const data = snapFinal.val();
                if (data.obtained !== undefined) {
                    input.value = data.obtained;
                    previewSequenceGrade();
                }
            }
        }
    } catch (e) {
        console.error(e);
    }

    // Auto-focus input box
    setTimeout(() => {
        input.focus();
        input.select();
    }, 100);
}

    const obtained = parseFloat(obtainedVal);
    if (isNaN(obtained) || obtained < 0 || obtained > activeFM) {
        preview.innerText = 'Error';
        preview.className = 'text-sm font-black text-red-500 mt-1 block';
        return;
    }

    const percentage = (obtained / activeFM) * 100;
    let grade = 'E';
    let colorClass = 'text-red-500';

    if (percentage >= 90) { grade = 'A+'; colorClass = 'text-green-600'; }
    else if (percentage >= 80) { grade = 'A'; colorClass = 'text-green-600'; }
    else if (percentage >= 70) { grade = 'B+'; colorClass = 'text-teal-600'; }
    else if (percentage >= 60) { grade = 'B'; colorClass = 'text-blue-600'; }
    else if (percentage >= 50) { grade = 'C+'; colorClass = 'text-yellow-600'; }
    else if (percentage >= 40) { grade = 'C'; colorClass = 'text-yellow-600'; }

    preview.innerText = `${grade} (${percentage.toFixed(0)}%)`;
    preview.className = `text-sm font-black mt-1 block ${colorClass}`;
}

async function saveActiveSequenceStudentScore() {
    if (activeSeqIndex < 0 || activeSeqIndex >= activeSeqRoster.length) return false;

    const student = activeSeqRoster[activeSeqIndex];
    const obtainedVal = document.getElementById('seq-obtained').value;

    // If empty, we can allow skipped or treat as unrecorded draft
    if (obtainedVal === '') return true;

    if (window.activeExamLocked) {
        alert("Deadline Lockout: Further grade submissions for this closed exam window are locked.");
        return false;
    }

    const obtained = parseFloat(obtainedVal);
    if (isNaN(obtained) || obtained < 0 || obtained > activeFM) {
        alert("Invalid score entered! Score must be between 0 and Full Marks.");
        return false;
    }

    const percentage = (obtained / activeFM) * 100;
    let grade = 'E';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B+';
    else if (percentage >= 60) grade = 'B';
    else if (percentage >= 50) grade = 'C+';
    else if (percentage >= 40) grade = 'C';

    const markData = {
        subject: activeSubjectId,
        total: activeFM,
        pass: activePM,
        obtained,
        grade,
        recordedBy: currentUser?.name || "Teacher Staff",
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };

async function saveActiveSequenceStudentScore() {
    if (activeSeqIndex < 0 || activeSeqIndex >= activeSeqRoster.length) return false;

    const student = activeSeqRoster[activeSeqIndex];
    const obtainedVal = document.getElementById('seq-obtained').value;

    // If empty, we can allow skipped or treat as unrecorded draft
    if (obtainedVal === '') return true;

    if (window.activeExamLocked) {
        alert("Deadline Lockout: Further grade submissions for this closed exam window are locked.");
        return false;
    }

    const obtained = parseFloat(obtainedVal);
    if (isNaN(obtained) || obtained < 0 || obtained > activeFM) {
        alert("Invalid score entered! Score must be between 0 and Full Marks.");
        return false;
    }

    const percentage = (obtained / activeFM) * 100;
    let grade = 'E';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B+';
    else if (percentage >= 60) grade = 'B';
    else if (percentage >= 50) grade = 'C+';
    else if (percentage >= 40) grade = 'C';

    const markData = {
        subject: activeSubjectId,
        total: activeFM,
        pass: activePM,
        obtained,
        grade,
        recordedBy: currentUser?.name || "Teacher Staff",
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };

    try {
        // Save as draft results first as per examination_marks_workflow plan!
        await db.ref(`school/draft_results/${student.id}/${activeExamId}/${activeSubjectId}`).set(markData);
        return true;
    } catch (e) {
        console.error(e);
        alert("Failed to auto-save score: " + e.message);
        return false;
    }
}

async function nextSequenceStudent() {
    const isSaved = await saveActiveSequenceStudentScore();
    if (!isSaved) return;

    if (activeSeqIndex === activeSeqRoster.length - 1) {
        alert("Roster completed! All entered marks have been auto-saved as drafts.\nThese scores are now ready for Administrator archiving and parent publication.");
        exitSequentialEntry();
    } else {
        activeSeqIndex++;
        showSequenceStudent();
    }
}

async function prevSequenceStudent() {
    const isSaved = await saveActiveSequenceStudentScore();
    if (!isSaved) return;

    if (activeSeqIndex > 0) {
        activeSeqIndex--;
        showSequenceStudent();
    }
}

function exitSequentialEntry() {
    const configPanel = document.getElementById('marks-config-panel');
    const seqPanel = document.getElementById('sequential-entry-panel');

    if (configPanel && seqPanel) {
        seqPanel.classList.add('hidden');
        configPanel.classList.remove('hidden');
    }
}