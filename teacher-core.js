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

            <!-- Polished Quick Action Shortcuts Grid -->
            <h3 class="font-bold text-gray-800 mt-8 mb-4">Faculty Quick Operations</h3>
            <div class="grid grid-cols-2 gap-4">
                <button onclick="teacherRouter('attendance')" class="mobile-card flex flex-col items-center justify-center p-6 text-emerald-600 bg-white hover:bg-emerald-50/20 active:scale-95 transition-all">
                    <i class="fas fa-user-check text-2xl mb-2"></i>
                    <span class="text-[10px] font-black uppercase tracking-wider">Attendance</span>
                </button>
                <button onclick="teacherRouter('marks')" class="mobile-card flex flex-col items-center justify-center p-6 text-blue-600 bg-white hover:bg-blue-50/20 active:scale-95 transition-all">
                    <i class="fas fa-file-signature text-2xl mb-2"></i>
                    <span class="text-[10px] font-black uppercase tracking-wider">Marks Entry</span>
                </button>
                <button onclick="teacherRouter('suggestions')" class="mobile-card flex flex-col items-center justify-center p-6 text-amber-600 bg-white hover:bg-amber-50/20 active:scale-95 transition-all">
                    <i class="fas fa-comment-dots text-2xl mb-2"></i>
                    <span class="text-[10px] font-black uppercase tracking-wider">Suggestions Feed</span>
                </button>
                <button onclick="teacherRouter('reassignment')" class="mobile-card flex flex-col items-center justify-center p-6 text-purple-600 bg-white hover:bg-purple-50/20 active:scale-95 transition-all">
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
            
            <div class="space-y-4">
                ${(currentUser?.schedule || [ ]).map(s => `
                    <div class="mobile-card border-l-4 border-blue-600 bg-white flex items-center justify-between p-4">
                        <div>
                            <span class="text-[9px] font-bold text-blue-600 uppercase tracking-widest">Period ${s.period}</span>
                            <h4 class="font-bold text-gray-800 text-base mt-0.5">${s.subject}</h4>
                            <p class="text-[10px] text-gray-400 font-bold uppercase mt-1">Class ${s.class} | ${s.time}</p>
                        </div>
                        <span class="bg-gray-50 text-gray-600 px-3 py-1 rounded-xl text-xs font-bold">Room 102</span>
                    </div>
                `).join('')}
            </div>
        `
    },

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

                <div id="teacher-suggestions-list" class="space-y-4 pb-10">
                    <div class="text-center py-10 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Syncing suggestions board...</div>
                </div>
            `;
        }
    },
    reassignment: {
        title: 'Class Reassignment',
        render: () => {
            setTimeout(() => {
                loadReassignmentRequestsHistory();
            }, 50);

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
                            <select id="req-class" class="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold outline-none">
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
                            <input type="text" id="req-subject" class="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold outline-none" placeholder="e.g. Mathematics">
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
                    <span class="text-[8px] text-gray-400 font-bold">${new Date(s.timestamp).toLocaleString()}</span>
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
                        <span>Submitted: ${new Date(r.timestamp).toLocaleDateString()}</span>
                    </div>
                </div>
            `;
        }).join('');

    } catch (e) {
        console.error(e);
        container.innerHTML = `<div class="text-center py-10 text-red-400 text-xs">Error loading requests: ${e.message}</div>`;
    }
}
    