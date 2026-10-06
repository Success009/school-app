// Teacher Sub-Application Logic (Core Router & Views)

// Ensure that only authenticated users with the 'teacher' role can execute this script.
if (checkAuth([ROLES.TEACHER])) {
    document.addEventListener('DOMContentLoaded', () => {
        teacherRouter('dashboard');
    });
}

// Global state variables
let activeRosterList = [ ];
let activeSeqRoster = [ ];
let activeSeqIndex = 0;
let activeExamId = '';
let activeClassId = '';
let activeSubjectId = '';
let activeFM = 100;
let activePM = 40;

const teacherViews = {
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
                    <span class="text-[10px] opacity-70 uppercase font-bold tracking-wide">My Class Size</span>
                </div>
                <div class="mobile-card bg-indigo-600 text-white p-5 shadow-lg">
                    <span class="block text-2xl font-black">${SafeResolvers.count(currentUser?.schedule ? currentUser.schedule.length : 2)}</span>
                    <span class="text-[10px] opacity-70 uppercase font-bold tracking-wide">Periods Today</span>
                </div>
            </div>
            <!-- Polished Quick Action Shortcuts Grid -->
            <h3 class="font-bold text-gray-800 mt-8 mb-4">Faculty Quick Operations</h3>
            
            <!-- Full-width Daily Attendance Button -->
            <button onclick="teacherRouter('attendance')" class="mobile-card flex items-center justify-center p-5 gap-3 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 shadow-sm active:scale-95 transition-all animate-fade-in w-full mb-4">
                <i class="fas fa-calendar-check text-2xl"></i>
                <span class="text-xs font-black uppercase tracking-wider">Take Daily Attendance</span>
            </button>

            <div class="grid grid-cols-2 gap-4">
                <button onclick="teacherRouter('classStudents')" class="mobile-card flex flex-col items-center justify-center p-6 text-teal-600 bg-white hover:bg-teal-50/20 active:scale-95 transition-all animate-fade-in">
                    <i class="fas fa-users text-2xl mb-2"></i>
                    <span class="text-[10px] font-black uppercase tracking-wider">Class Pupils</span>
                </button>
                <button onclick="teacherRouter('classResults')" class="mobile-card flex flex-col items-center justify-center p-6 text-indigo-600 bg-white hover:bg-indigo-50/20 active:scale-95 transition-all animate-fade-in">
                    <i class="fas fa-chart-line text-2xl mb-2"></i>
                    <span class="text-[10px] font-black uppercase tracking-wider">Results Tracker</span>
                </button>
            </div>
            <div class="grid grid-cols-2 gap-4 mt-4">
                <button onclick="teacherRouter('schedule')" class="mobile-card flex flex-col items-center justify-center p-6 text-purple-600 bg-white hover:bg-purple-50/20 active:scale-95 transition-all animate-fade-in">
                    <i class="fas fa-calendar-day text-2xl mb-2"></i>
                    <span class="text-[10px] font-black uppercase tracking-wider">Weekly Routine</span>
                </button>
                <button onclick="teacherRouter('marks')" class="mobile-card flex flex-col items-center justify-center p-6 text-blue-600 bg-white hover:bg-blue-50/20 active:scale-95 transition-all animate-fade-in">
                    <i class="fas fa-file-signature text-2xl mb-2"></i>
                    <span class="text-[10px] font-black uppercase tracking-wider">Enter Marks</span>
                </button>
            </div>
            <div class="grid grid-cols-2 gap-4 mt-4">
                <button onclick="teacherRouter('suggestions')" class="mobile-card flex flex-col items-center justify-center p-6 text-amber-600 bg-white hover:bg-amber-50/20 active:scale-95 transition-all animate-fade-in">
                    <i class="fas fa-comment-dots text-2xl mb-2"></i>
                    <span class="text-[10px] font-black uppercase tracking-wider">Suggestions Feed</span>
                </button>
                <button onclick="teacherRouter('reassignment')" class="mobile-card flex flex-col items-center justify-center p-6 text-rose-600 bg-white hover:bg-rose-50/20 active:scale-95 transition-all animate-fade-in">
                    <i class="fas fa-exchange-alt text-2xl mb-2"></i>
                    <span class="text-[10px] font-black uppercase tracking-wider">Class Change</span>
                </button>
            </div>
        `
    },
    schedule: {
        title: 'Weekly Routine',
        render: () => `
            <div class="mb-6">
                <h3 class="font-bold text-gray-800 mb-1 text-lg">My Subject Schedule</h3>
                <p class="text-xs text-gray-500">View chronological periods and classrooms</p>
            </div>
            
            <div id="teacher-schedule-container" class="space-y-4">
                <div class="text-center py-10 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Loading weekly schedule...</div>
            </div>
        `
    },

    attendance: {
        title: 'Daily Attendance',
        render: () => {
            const classTeacherOf = currentUser?.classTeacherOf;
            if (!classTeacherOf || classTeacherOf === 'none') {
                return `
                    <div class="text-center py-10 bg-white rounded-3xl border border-gray-100 p-6 space-y-3 animate-fade-in">
                        <div class="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto text-xl">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <h4 class="text-sm font-black text-gray-800 uppercase">Access Restricted</h4>
                        <p class="text-xs text-gray-500 leading-relaxed">You are not explicitly designated as a Class Teacher of any class in the school database. Attendance registers can only be managed by assigned Class Teachers.</p>
                        <button onclick="teacherRouter('dashboard')" class="bg-gray-100 text-gray-600 font-bold px-4 py-2 rounded-xl text-xs active:scale-95 transition-all">Go Back</button>
                    </div>
                `;
            }

            return `
                <div class="mb-4">
                    <h3 class="font-bold text-gray-800 text-lg mb-1">Class ${classTeacherOf} Daily Register</h3>
                    <p class="text-xs text-gray-500">Taking attendance for your class</p>
                </div>

                <div class="space-y-4">
                    <div class="mobile-card">
                        <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1">Attendance Date (BS)</label>
                        <input type="text" id="attend-date" class="w-full p-2 bg-gray-50 border border-gray-100 rounded-xl outline-none text-xs font-bold" placeholder="YYYY-MM-DD" value="${getFormattedCurrentNepaliDate()}">
                    </div>

                    <!-- Load Trigger -->
                    <button onclick="loadAttendanceRoster()" class="w-full bg-blue-700 text-white font-black py-3 rounded-xl shadow-md active:scale-95 transition-all text-xs">
                        <i class="fas fa-users-cog mr-2"></i> Load Class Roster
                    </button>

                    <!-- Roster Rendering Container -->
                    <div id="attendance-roster-container" class="space-y-3 pt-2">
                        <div class="text-center py-8 text-gray-300 italic text-xs">No roster loaded. Click Load to pull database.</div>
                    </div>

                    <!-- Commit Changes Button -->
                    <div id="submit-roster-btn-div" class="hidden">
                        <button onclick="submitAttendance()" class="w-full bg-green-600 text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all mt-4">
                            <i class="fas fa-check-double mr-2"></i> Submit Daily Register
                        </button>
                    </div>
                </div>
            `;
        }
    },
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
                        <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Class</label>
                        <select id="marks-class-select" class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-xs font-bold">
                            ${(currentUser?.assignedClasses || ["1", "2", "3"]).map(c => `<option value="${c}">Class ${c}</option>`).join('')}
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
                        <img id="seq-student-photo" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2NiZDVlMSI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg==" class="w-full h-full object-cover">
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
                    <span class="font-bold text-gray-700 text-sm mt-1 block">${SafeResolvers.text(currentUser?.assignedClasses ? currentUser.assignedClasses.join(', ') : '1, 2, 3')}</span>
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
    classStudents: {
        title: 'Class Pupils Directory',
        render: () => {
            setTimeout(() => {
                loadClassStudentsList();
            }, 50);

            return `
                <div class="mb-4 text-left animate-fade-in">
                    <h2 class="text-xl font-black text-gray-800 tracking-tight">Class Pupils Directory</h2>
                    <p class="text-xs text-gray-500">Search and view historical status and incident archives of class students</p>
                </div>

                <div class="mb-4 space-y-3">
                    <div class="relative">
                        <input type="text" id="student-search-input" onkeyup="filterClassStudentsList()" class="w-full p-4 bg-white border border-gray-100 rounded-xl shadow-sm outline-none pl-12 text-sm" placeholder="Search pupil by name...">
                        <i class="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 font-bold"></i>
                    </div>
                </div>

                <div id="class-students-list-container" class="space-y-3">
                    <div class="text-center py-10 text-gray-400 text-xs"><i class="fas fa-spinner fa-spin mr-2"></i>Loading student directory...</div>
                </div>

                <!-- Incident History Modal Panel (Shared) -->
                <div id="pupil-incident-history-panel" class="hidden mt-8 text-left bg-white p-5 rounded-2xl border border-gray-100 shadow-sm animate-fade-in">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="font-black text-gray-800 text-xs uppercase tracking-wider">Incident & Enrollment Archive</h3>
                        <button onclick="document.getElementById('pupil-incident-history-panel').classList.add('hidden')" class="text-[10px] text-gray-400 font-bold hover:text-gray-600"><i class="fas fa-times-circle mr-1"></i>Close</button>
                    </div>
                    <div id="pupil-incident-history-list" class="space-y-3"></div>
                </div>
            `;
        }
    },
    classResults: {
        title: 'Class Results Tracker',
        render: () => {
            setTimeout(() => {
                loadClassResultsTracker();
            }, 50);

            return `
                <div class="mb-4 text-left animate-fade-in">
                    <h2 class="text-xl font-black text-gray-800 tracking-tight">Pupils Academic Tracker</h2>
                    <p class="text-xs text-gray-500">Track current grades and search historic archives of student report cards</p>
                </div>

                <div class="mobile-card bg-white p-4 space-y-3 mb-6 text-left shadow-sm border border-gray-105">
                    <h3 class="text-xs font-black uppercase text-blue-600 tracking-wider">Search Filters & Archives</h3>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1">Select Exam Term</label>
                            <select id="res-term" onchange="loadClassResultsTracker()" class="w-full p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold outline-none">
                                <option value="Term 1" selected>Term 1</option>
                                <option value="Term 2">Term 2</option>
                                <option value="Term 3">Term 3</option>
                                <option value="Finals">Finals</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1">Results Archive Year</label>
                            <select id="res-year" onchange="loadClassResultsTracker()" class="w-full p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold outline-none">
                                <option value="2026" selected>Current Year (2026)</option>
                                <option value="2025">Year 2025 Archives</option>
                                <option value="2024">Year 2024 Archives</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div id="results-tracker-container" class="space-y-4 pb-16">
                    <div class="text-center py-10 text-gray-400 text-xs"><i class="fas fa-spinner fa-spin mr-2"></i>Loading academic records...</div>
                </div>
            `;
        }
    },
    teachers: {
        title: 'Faculty Directory',
        render: () => `
            <div id="teacher-colleagues-container" class="space-y-3 pb-10">
                <div class="text-center py-10 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Loading Directory...</div>
            </div>
        `
    },
    suggestions: {
        title: 'Parent Suggestions Board',
        render: () => {
            setTimeout(() => {
                loadTeacherSuggestionsFeed();
            }, 50);

            return `
                <div class="mb-6">
                    <h2 class="text-xl font-black text-gray-800 tracking-tight">Parent Suggestions Feed</h2>
                    <p class="text-xs text-gray-500">Read chronological suggestions and feedback submitted by school parents</p>
                </div>
                
                <div id="teacher-suggestions-list" class="space-y-4 pb-12">
                    <div class="text-center py-10 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Loading board...</div>
                </div>
            `;
        }
    },
    reassignment: {
        title: 'Class Reassignment',
        render: () => {
            setTimeout(() => {
                updateReassignmentSubjects();
                loadReassignmentRequestsHistory();
            }, 100);

            return `
                <div class="mb-6">
                    <h2 class="text-xl font-black text-gray-800 tracking-tight">Request Class Reassignment</h2>
                    <p class="text-xs text-gray-500">Apply for adjustments to your assigned classes or subject workloads</p>
                </div>

                <div class="mobile-card space-y-4 mb-6">
                    <h3 class="text-xs font-black uppercase text-purple-600 tracking-wider">Submit New Request</h3>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1">Select Class</label>
                            <select id="req-class" onchange="updateReassignmentSubjects()" class="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold outline-none">
                                <option value="1">Class 1</option>
                                <option value="2">Class 2</option>
                                <option value="3">Class 3</option>
                                <option value="4">Class 4</option>
                                <option value="5">Class 5</option>
                                <option value="6">Class 6</option>
                                <option value="7">Class 7</option>
                                <option value="8">Class 8</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1">Requested Subject</label>
                            <select id="req-subject" class="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold outline-none">
                                <option value="">Loading subjects...</option>
                            </select>
                        </div>
                    </div>
                    <button onclick="submitReassignmentRequest()" class="w-full bg-purple-700 text-white font-black py-3 rounded-xl shadow-md active:scale-95 transition-all text-xs">
                        <i class="fas fa-paper-plane mr-2"></i> Submit Request Application
                    </button>
                </div>
                <h3 class="font-bold text-gray-400 uppercase text-[10px] tracking-widest px-1 mb-4">My Application Logs</h3>
                <div id="reassignment-requests-list" class="space-y-3 pb-10">
                    <div class="text-center py-10 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Loading request history...</div>
                </div>
            `;
        }
    }
};

function teacherRouter(viewName) {
    const view = teacherViews[viewName] || teacherViews.dashboard;
    const backAction = (viewName !== 'dashboard') ? () => teacherRouter('dashboard') : null;

    renderHeader(view.title, backAction);
    triggerViewTransition();

    document.getElementById('main-content').innerHTML = view.render();

    document.querySelectorAll('.nav-item').forEach(btn => {
        if (btn.getAttribute('data-view') === viewName) {
            btn.classList.add('text-blue-700');
            btn.classList.remove('text-gray-400');
        } else {
            btn.classList.remove('text-blue-700');
            btn.classList.add('text-gray-400');
        }
    });

    if (viewName === 'dashboard') {
        db.ref('school/students').once('value', snap => {
            const el = document.getElementById('dash-total-students');
            if (el) el.innerText = SafeResolvers.count(snap.numChildren());
        });
    }

    if (viewName === 'marks') {
        populateExamWindowsDropdown();
    }

    if (viewName === 'schedule') {
        loadTeacherScheduleWithGlobalTimings();
    }

    if (viewName === 'teachers') {
        renderSharedTeacherDirectory('teacher-colleagues-container', { canClickToCall: true });
    }

    if (viewName === 'suggestions') {
        loadTeacherSuggestionsFeed();
    }

    if (viewName === 'reassignment') {
        loadReassignmentRequestsHistory();
    }

    document.getElementById('main-content').scrollTop = 0;
}

async function loadTeacherSuggestionsFeed() {
    const container = document.getElementById('teacher-suggestions-list');
    if (!container) return;

    try {
        const snap = await db.ref('school/suggestions').once('value');
        const list = snap.val();

        if (!list) {
            container.innerHTML = `<div class="text-center py-10 text-gray-400 text-xs italic bg-white rounded-xl border border-gray-100 p-6">No suggestions have been submitted by parents yet.</div>`;
            return;
        }

        const suggestions = Object.values(list);
        suggestions.sort((a, b) => b.timestamp - a.timestamp);

        container.innerHTML = suggestions.map(s => `
            <div class="mobile-card bg-white p-4 shadow-sm relative overflow-hidden border-l-4 border-amber-500 text-left">
                <div class="flex justify-between items-center mb-2">
                    <div class="flex items-center gap-1.5">
                        <span class="text-xs font-black text-gray-800">${s.parentName}</span>
                        <span class="text-[9px] text-gray-400 font-bold">(${s.parentPhone})</span>
                    </div>
                    <span class="text-[8px] text-gray-400 font-bold">${convertToNepaliDateTime(s.timestamp)}</span>
                </div>
    
                <p class="text-xs text-gray-700 leading-relaxed font-semibold bg-gray-50 p-3 rounded-xl">${s.message}</p>
                <div class="mt-2 text-[8px] font-black text-blue-600 uppercase tracking-wider">
                    Parent of: ${s.studentName}
                </div>
            </div>
        `).join('');

    } catch (e) {
        console.error(e);
        container.innerHTML = `<div class="text-center py-10 text-red-400 text-xs">Error loading suggestions board: ${e.message}</div>`;
    }
}

async function updateReassignmentSubjects() {
    const classId = document.getElementById('req-class')?.value;
    const subjectSelect = document.getElementById('req-subject');
    if (!classId || !subjectSelect) return;
    
    subjectSelect.innerHTML = '<option value="">Loading...</option>';
    
    try {
        const snap = await db.ref(`school/class_configs/${classId}/subjects/compulsory`).once('value');
        const subjects = snap.val() || {};
        const subjectList = Object.values(subjects);
        
        if (subjectList.length === 0) {
            subjectSelect.innerHTML = '<option value="">No subjects found for this class</option>';
        } else {
            subjectSelect.innerHTML = subjectList.map(subj => `<option value="${subj}">${subj}</option>`).join('');
        }
    } catch (e) {
        console.error(e);
        subjectSelect.innerHTML = '<option value="">Error loading subjects</option>';
    }
}

async function submitReassignmentRequest() {
    const requestedClass = document.getElementById('req-class').value;
    const requestedSubject = document.getElementById('req-subject').value.trim();

    if (!requestedSubject) {
        await alert("Please specify the requested subject.");
        return;
    }

    const requestId = "REQ-" + Math.floor(100000 + Math.random() * 900000);

    const reqData = {
        requestId: requestId,
        teacherId: currentUser?.id || "UT-MOCK",
        teacherName: currentUser?.name || "Teacher",
        requestedClass: requestedClass,
        requestedSubject: requestedSubject,
        status: "Pending",
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };

    try {
        await db.ref('school/class_change_requests/' + requestId).set(reqData);
        await alert("Class Reassignment application submitted successfully to administration!");
        document.getElementById('req-subject').value = '';
        loadReassignmentRequestsHistory();
    } catch (e) {
        console.error(e);
        await alert("Failed to submit request: " + e.message);
    }
}

async function loadReassignmentRequestsHistory() {
    const container = document.getElementById('reassignment-requests-list');
    if (!container) return;

    try {
        const snap = await db.ref('school/class_change_requests').once('value');
        const list = snap.val();

        if (!list) {
            container.innerHTML = `<div class="text-center py-10 text-gray-400 text-xs italic bg-white rounded-xl border border-gray-100 p-6">No reassignment applications found.</div>`;
            return;
        }

        const teacherId = currentUser?.id || "UT-MOCK";
        const myRequests = Object.values(list).filter(r => r.teacherId === teacherId);

        if (myRequests.length === 0) {
            container.innerHTML = `<div class="text-center py-10 text-gray-400 text-xs italic bg-white rounded-xl border border-gray-100 p-6">No reassignment applications found.</div>`;
            return;
        }

        myRequests.sort((a, b) => b.timestamp - a.timestamp);

        container.innerHTML = myRequests.map(r => {
            let statusColor = "bg-yellow-100 text-yellow-700";
            if (r.status === 'Approved') statusColor = "bg-green-100 text-green-700";
            else if (r.status === 'Denied') statusColor = "bg-red-100 text-red-700";

            return `
                <div class="mobile-card bg-white p-4 shadow-sm relative overflow-hidden text-left">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-[8px] font-black text-purple-600 uppercase tracking-widest">${r.requestId}</span>
                        <span class="px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${statusColor}">${r.status}</span>
                    </div>
                    <h4 class="font-bold text-gray-800 text-sm">Class ${r.requestedClass} | ${r.requestedSubject}</h4>
                    <div class="mt-2 pt-2 border-t border-gray-50 flex items-center justify-between text-[8px] font-bold text-gray-400 uppercase">
                        <span>Submitted: ${convertToNepaliDate(r.timestamp)}</span>
                    </div>
            `;
        }).join('');

    } catch (e) {
        console.error(e);
        container.innerHTML = `<div class="text-center py-10 text-red-400 text-xs">Error loading requests: ${e.message}</div>`;
    }
}


let classStudentsCache = [ ];

async function loadClassStudentsList() {
    const container = document.getElementById('class-students-list-container');
    if (!container) return;

    try {
        const snap = await db.ref('school/students').once('value');
        const students = snap.val();
        if (!students) {
            container.innerHTML = '<div class="text-center py-10 text-gray-400 text-xs italic">No students found in directory.</div>';
            return;
        }

        const classTeacherClass = currentUser?.classTeacherOf ? currentUser.classTeacherOf : '1';
        classStudentsCache = Object.values(students).filter(s => String(s.class) === String(classTeacherClass));

        classStudentsCache.sort((a, b) => (a.roll || 999) - (b.roll || 999));
        
        renderClassStudentsList(classStudentsCache);

    } catch(e) {
        console.error(e);
        container.innerHTML = `<div class="text-center py-10 text-red-400 text-xs">Error loading students: ${e.message}</div>`;
    }
}

function renderClassStudentsList(students) {
    const container = document.getElementById('class-students-list-container');
    if (!container) return;

    if (students.length === 0) {
        container.innerHTML = '<div class="text-center py-10 text-gray-400 text-xs italic">No students match your search.</div>';
        return;
    }

    container.innerHTML = students.map(s => {
        let fullName = getStudentFullName(s.name);
        return `
            <div class="mobile-card student-card bg-white p-4 shadow-sm border-l-4 border-emerald-500 flex items-center justify-between" data-name="${fullName.toLowerCase()}">
                <div class="flex items-center gap-4">
                    <img src="${SafeResolvers.photo(s.photo)}" class="w-12 h-12 rounded-xl object-cover">
                    <div>
                        <h4 class="font-black text-gray-800 text-sm">${fullName}</h4>
                        <span class="text-[9px] text-gray-400 font-bold uppercase mt-1">Roll No: ${s.roll || 'N/A'}</span>
                    </div>
                </div>
                <button onclick="viewPupilIncidentHistory('${s.id}')" class="bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg text-xs font-bold active:scale-95 transition-all">
                    <i class="fas fa-history mr-1"></i> View History
                </button>
            </div>
        `;
    }).join('');
}
function filterClassStudentsList() {
const query = document.getElementById('student-search-input').value.toLowerCase();
const filtered = classStudentsCache.filter(s => getStudentFullName(s.name).toLowerCase().includes(query));
renderClassStudentsList(filtered);
}

function viewPupilIncidentHistory(studentId) {
document.getElementById('pupil-incident-history-panel').classList.remove('hidden');
renderSharedStudentIncidentHistory('pupil-incident-history-list', studentId);
document.getElementById('main-content').scrollTop = document.getElementById('main-content').scrollHeight;
}

async function loadClassResultsTracker() {
    const container = document.getElementById('results-tracker-container');
    const term = document.getElementById('res-term').value;
    const year = document.getElementById('res-year').value;
    if (!container) return;

    container.innerHTML = '<div class="text-center py-10 text-gray-400 text-xs"><i class="fas fa-spinner fa-spin mr-2"></i>Loading academic records...</div>';

    try {
        const classTeacherClass = currentUser?.classTeacherOf ? currentUser.classTeacherOf : '1';
        const snap = await db.ref('school/students').orderByChild('class').equalTo(classTeacherClass).once('value');
        const students = snap.val();

        if (!students) {
            container.innerHTML = '<div class="text-center py-10 text-gray-400 text-xs italic">No students enrolled in your assigned class.</div>';
            return;
        }

    let studentList = Object.values(students);
    studentList.sort((a, b) => (a.roll || 999) - (b.roll || 999));

    const resultsPromises = studentList.map(s => db.ref(`school/results/${s.id}/${term}_${year}`).once('value'));
    const resultsSnapshots = await Promise.all(resultsPromises);
    
    const resultsData = resultsSnapshots.map((snap, i) => ({ student: studentList[i], marks: snap.val() }));

    container.innerHTML = resultsData.map(({ student, marks }) => {
        let totalMarks = 0, totalObtained = 0, subjectsCount = 0;
        let isFail = false;
        let marksHtml = '<div class="text-xs text-gray-400 italic">No results published.</div>';

        if (marks) {
            marksHtml = Object.entries(marks).map(([subject, m]) => {
                totalMarks += (m.total || 100);
                totalObtained += (m.obtained || 0);
                subjectsCount++;
                if ((m.obtained || 0) < (m.pass || 40)) isFail = true;
                return `<div class="font-mono text-xs">${subject}: ${m.obtained}/${m.total} (${m.grade})</div>`;
            }).join('');
        }
        
        const percentage = totalMarks > 0 ? (totalObtained / totalMarks * 100).toFixed(1) : 0;

        return `
            <div class="mobile-card bg-white p-4 shadow-sm border-l-4 ${isFail ? 'border-red-500' : 'border-indigo-500'}">
                <div class="flex justify-between items-center">
                    <div>
                        <h4 class="font-black text-gray-800">${getStudentFullName(student.name)}</h4>
                        <span class="text-[9px] text-gray-400 font-bold">Roll: ${student.roll || 'N/A'}</span>
                    </div>
                    <div class="text-right">
                        <span class="text-lg font-black text-indigo-600">${percentage}%</span>
                        <span class="text-[9px] font-bold text-gray-400 block">${isFail ? 'FAIL' : 'PASS'}</span>
                    </div>
                </div>
                <div class="mt-3 pt-3 border-t border-gray-50 space-y-1">${marksHtml}</div>
            </div>
        `;
    }).join('');

} catch (e) {
    console.error(e);
    container.innerHTML = `<div class="text-center py-10 text-red-400 text-xs">Error loading results: ${e.message}</div>`;
}

}

async function loadTeacherScheduleWithGlobalTimings() {
    const container = document.getElementById('teacher-schedule-container');
    if (!container) return;

    try {
        const snap = await db.ref('school/config/period_timings').once('value');
        const globalTimings = snap.val() || { };

        const schedule = currentUser?.schedule || [ ];
        if (schedule.length === 0) {
            container.innerHTML = `<div class="text-center py-10 text-gray-400">No schedule assigned yet.</div>`;
            return;
        }

        container.innerHTML = schedule.map(s => {
            const periodKey = (s.period || '').replace(/\D/g, '');
            let timeStr = s.time;

            let matchedTiming = globalTimings[s.period] || Object.values(globalTimings).find(pt => {
                const ptNum = (pt.id || '').replace(/\D/g, '');
                return ptNum && periodKey && ptNum === periodKey;
            });

            if (matchedTiming) {
                timeStr = `${matchedTiming.startTime} - ${matchedTiming.endTime}`;
            }

            return `
                <div class="mobile-card border-l-4 border-blue-600 bg-white flex items-center justify-between p-4 shadow-sm">
                    <div>
                        <span class="text-[9px] font-bold text-blue-600 uppercase tracking-widest">Period ${s.period}</span>
                        <h4 class="font-bold text-gray-800 text-base mt-0.5">${s.subject}</h4>
                        <p class="text-[10px] text-gray-400 font-bold uppercase mt-1">Class ${s.class} | ${timeStr}</p>
                    </div>
                    <span class="bg-gray-50 text-gray-600 px-3 py-1 rounded-xl text-xs font-bold">Room 102</span>
                </div>
            `;
        }).join('');
    } catch (e) {
        console.error("Error building teacher schedule list:", e);
        container.innerHTML = `<div class="text-center py-10 text-red-400">Failed to load schedule: ${e.message}</div>`;
    }
}
