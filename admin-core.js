// Admin Core Router and Views Definition

// Check authorization on load
if (checkAuth([ROLES.ADMIN])) {
    document.addEventListener('DOMContentLoaded', () => {
        adminRouter('dashboard');
    });
}

const adminViews = {

    schoolSetup: {
        title: 'School Setup Wizard',
        render: () => {
            setTimeout(() => {
                if (typeof initAdminSetup === 'function') {
                    initAdminSetup();
                }
            }, 50);
            return `<div id="setup-engine-container"></div>`;
        }
    },
    dashboard: {
        title: 'Central Command',
        render: () => `
            <div class="mb-6">
                <h2 class="text-2xl font-black text-gray-800">Admin Panel</h2>
                <p class="text-xs text-red-600 font-bold tracking-widest uppercase mt-1">Central Command</p>
            </div>
            
            <div class="grid grid-cols-2 gap-4 mb-6">
                <div onclick="adminRouter('viewStudents')" class="mobile-card !p-5 bg-blue-50 border-none shadow-none cursor-pointer">
                    <i class="fas fa-users text-blue-600 text-xl mb-2"></i>
                    <h4 id="stat-students" class="text-2xl font-black">...</h4>
                    <p class="text-[10px] text-gray-400 uppercase font-bold tracking-wide mt-1">Students</p>
                </div>
                <div onclick="adminRouter('viewTeachers')" class="mobile-card !p-5 bg-purple-50 border-none shadow-none cursor-pointer">
                    <i class="fas fa-chalkboard-teacher text-purple-600 text-xl mb-2"></i>
                    <h4 id="stat-teachers" class="text-2xl font-black">...</h4>
                    <p class="text-[10px] text-gray-400 uppercase font-bold tracking-wide mt-1">Teachers</p>
                </div>
            </div>

                        <h3 class="font-bold text-gray-800 mb-4">Management Core</h3>
            <div class="grid grid-cols-2 gap-4 mb-8">
                <button onclick="adminRouter('addStudent')" class="mobile-card flex flex-col items-center justify-center p-6 text-blue-700 bg-white hover:bg-gray-50">
                    <i class="fas fa-user-plus text-xl mb-2"></i>
                    <span class="text-[10px] font-black uppercase">Add Student</span>
                </button>
                <button onclick="adminRouter('addTeacher')" class="mobile-card flex flex-col items-center justify-center p-6 text-purple-700 bg-white hover:bg-gray-50">
                    <i class="fas fa-chalkboard-teacher text-xl mb-2"></i>
                    <span class="text-[10px] font-black uppercase">Add Teacher</span>
                </button>
                <button onclick="adminRouter('examsManagement')" class="mobile-card flex flex-col items-center justify-center p-6 text-orange-700 bg-white hover:bg-gray-50">
                    <i class="fas fa-file-signature text-xl mb-2"></i>
                    <span class="text-[10px] font-black uppercase">Exam Windows</span>
                </button>
                <button onclick="adminRouter('sendNotice')" class="mobile-card flex flex-col items-center justify-center p-6 text-teal-700 bg-white hover:bg-gray-50">
                    <i class="fas fa-bullhorn text-xl mb-2"></i>
                    <span class="text-[10px] font-black uppercase">Send Notice</span>
                </button>
    
                <button onclick="adminRouter('schoolSetup')" class="mobile-card flex flex-col items-center justify-center p-6 text-indigo-700 bg-white hover:bg-gray-50">
                    <i class="fas fa-book text-xl mb-2"></i>
                    <span class="text-[10px] font-black uppercase">Class &amp; Subject Mgmt</span>
                </button>
                <button onclick="adminRouter('periodSettings')" class="mobile-card flex flex-col items-center justify-center p-6 text-pink-700 bg-white hover:bg-gray-50">
                    <i class="fas fa-clock text-xl mb-2"></i>
                    <span class="text-[10px] font-black uppercase">Period Timings</span>
                </button>
            </div>

            <div onclick="adminRouter('helpDesk')" class="mobile-card flex items-center p-4 bg-teal-50 hover:bg-teal-100/30 border-none shadow-none mb-4 cursor-pointer active:scale-98 transition-all">
                <div class="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 mr-4">
                    <i class="fas fa-ticket-alt text-sm"></i>
                </div>
                <div class="flex-grow">
                    <h4 class="text-sm font-bold text-gray-800">Support Help Desk</h4>
                    <p class="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Manage and resolve parent support tickets</p>
                </div>
                <i class="fas fa-chevron-right text-gray-400 text-xs"></i>
            </div>

            <div onclick="adminRouter('parentSuggestionsBoard')" class="mobile-card flex items-center p-4 bg-amber-50 hover:bg-amber-100/30 border-none shadow-none mb-4 cursor-pointer active:scale-98 transition-all">
                <div class="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mr-4">
                    <i class="fas fa-comment-dots text-sm"></i>
                </div>
                <div class="flex-grow">
                    <h4 class="text-sm font-bold text-gray-800">Parent Suggestions</h4>
                    <p class="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Read feedback and suggestions submitted by parents</p>
                </div>
                <i class="fas fa-chevron-right text-gray-400 text-xs"></i>
            </div>

            <div onclick="adminRouter('classReassignmentQueue')" class="mobile-card flex items-center p-4 bg-purple-50 hover:bg-purple-100/30 border-none shadow-none mb-8 cursor-pointer active:scale-98 transition-all">
                <div class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mr-4">
                    <i class="fas fa-exchange-alt text-sm"></i>
                </div>
                <div class="flex-grow">
                    <h4 class="text-sm font-bold text-gray-800">Class Change Requests</h4>
                    <p class="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Approve or deny teacher workload changes</p>
                </div>
                <i class="fas fa-chevron-right text-gray-400 text-xs"></i>
            </div>

            <div class="flex justify-between items-center mb-4">
                <h3 class="font-bold text-gray-800">Recent Notices</h3>
                <span onclick="alert('Opening Notice Board Manager...')" class="text-[10px] font-bold text-blue-600 uppercase cursor-pointer">View All</span>
            </div>
            <div id="admin-recent-notices" class="space-y-3 pb-10">
                <div class="text-center py-6 text-gray-300 text-xs italic">No announcements found.</div>
            </div>
        `
    },
    viewStudents: {
        title: 'Students Directory',
        render: () => {
            setTimeout(() => {
                if (typeof initStudentView === 'function') {
                    initStudentView('student-view-container');
                }
            }, 50);
            return `<div id="student-view-container"></div>`;
        }
    },
    viewTeachers: {
        title: 'Faculty Directory',
        render: () => {
            setTimeout(() => {
                if (typeof initTeacherView === 'function') {
                    initTeacherView('teacher-view-container');
                }
            }, 50);
            return `<div id="teacher-view-container"></div>`;
        }
    },
    editStudent: {
        title: 'Edit Student Profile',
        render: (params = {}) => {
            const sid = (params && params.id) ? params.id : '';
            setTimeout(() => {
                if (typeof initStudentEdit === 'function') {
                    initStudentEdit('student-edit-container', sid);
                }
            }, 50);
            return `<div id="student-edit-container"></div>`;
        }
    },
    editTeacher: {
        title: 'Edit Faculty Profile',
        render: (params = {}) => {
            const tid = (params && params.id) ? params.id : '';
            setTimeout(() => {
                if (typeof initTeacherEdit === 'function') {
                    initTeacherEdit('teacher-edit-container', tid);
                }
            }, 50);
            return `<div id="teacher-edit-container"></div>`;
        }
    },
    studentDetails: {
        title: 'Details View',
        render: () => `
            <div id="student-profile-container">
                 <div class="text-center py-10 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Fetching Profile...</div>
            </div>
        `
    },
    helpDesk: {
        title: 'Support Help Desk',
        render: () => `
            <div class="mb-4">
                <p class="text-xs text-gray-500">Track and resolve parent support requests</p>
            </div>
            
            <div id="admin-helpdesk-list" class="space-y-3 pb-16">
                <div class="text-center py-10 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Loading active tickets...</div>
            </div>
        `
    },
    examsManagement: {
        title: 'Exam Configuration',
        render: () => `
            <div class="mb-6">
                <h2 class="text-xl font-black text-gray-800">Exam Term Windows</h2>
                <p class="text-xs text-gray-500 mt-1">Configure active exam evaluation terms, marks scales, and entry deadlines for teachers.</p>
            </div>

            <div class="space-y-4 pb-16">
                <div class="mobile-card">
                    <h3 class="text-xs font-black uppercase text-orange-600 mb-3 tracking-wider"><i class="fas fa-plus-circle mr-1"></i>Schedule New Exam Term</h3>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Exam Name / Title</label>
                            <input type="text" id="exam-title" class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm font-bold" placeholder="e.g. First Terminal Exam 2026">
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Term Key</label>
                                <select id="exam-term-id" class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-xs font-bold">
                                    <option value="Term 1">First Term (Term 1)</option>
                                    <option value="Term 2">Second Term (Term 2)</option>
                                    <option value="Term 3">Third Term (Term 3)</option>
                                    <option value="Finals">Final Examination</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Status</label>
                                <select id="exam-status" class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-xs font-bold">
                                    <option value="Active">Active (Open for Entries)</option>
                                    <option value="Closed">Closed (Locked)</option>
                                </select>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Opening Date (BS)</label>
                                <input type="text" id="exam-opening" class="w-full p-2 bg-gray-50 border border-gray-100 rounded-xl outline-none text-xs font-bold" placeholder="YYYY-MM-DD" value="${getFormattedCurrentNepaliDate()}">
                            </div>
                            <div>
                                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Closing Date (BS)</label>
                                <input type="text" id="exam-closing" class="w-full p-2 bg-gray-50 border border-gray-100 rounded-xl outline-none text-xs font-bold" placeholder="YYYY-MM-DD" value="${convertToNepaliDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000))}">
                            </div>
                        </div>
    
                        <div class="p-3 bg-orange-50 rounded-xl border border-orange-100">
                            <p class="text-[10px] text-orange-700 font-bold leading-tight"><i class="fas fa-info-circle mr-1"></i> Marks Scaling: Full Marks and Pass Marks are now managed dynamically by Teachers during grading.</p>
                        </div>
                        <button onclick="saveExamWindow()" class="w-full bg-orange-600 hover:bg-orange-700 text-white font-black py-3.5 rounded-xl shadow-md active:scale-95 transition-all text-xs">
                            <i class="fas fa-save mr-1"></i> Save Exam Window
                        </button>
                    </div>
                </div>

                <h3 class="font-bold text-gray-800 text-sm px-1 mb-2">Active & Scheduled Windows</h3>
                <div id="admin-exams-list" class="space-y-3">
                    <div class="text-center py-6 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Loading scheduled terms...</div>
                </div>
            </div>
        `
    },
    periodSettings: {
        title: 'School Period Timings',
        render: () => {
            setTimeout(async () => {
                await loadPeriodTimings();
            }, 50);
            return `
            <div class="mb-6">
                <h2 class="text-xl font-black text-gray-800">Global Period Schedule</h2>
                <p class="text-xs text-gray-500 mt-1">Define start and end times for each period. These timings apply to all student and teacher schedules.</p>
            </div>

            <div class="space-y-4 pb-16">
                <div class="mobile-card">
                    <h3 class="text-xs font-black uppercase text-pink-600 mb-3 tracking-wider">Define New Period Slot</h3>
                    <div class="space-y-4">
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Period ID/Name</label>
                                <input type="text" id="period-key" class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-xs font-bold" placeholder="e.g. 1st, 2nd, Lunch">
                            </div>
                            <div>
                                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Display Sort Order</label>
                                <input type="number" id="period-sort" class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-xs font-bold" value="1">
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Start Time</label>
                                <input type="time" id="period-start" class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-xs font-bold">
                            </div>
                            <div>
                                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">End Time</label>
                                <input type="time" id="period-end" class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-xs font-bold">
                            </div>
                        </div>
                        <button onclick="savePeriodTiming()" class="w-full bg-pink-600 hover:bg-pink-700 text-white font-black py-3.5 rounded-xl shadow-md active:scale-95 transition-all text-xs">
                            <i class="fas fa-save mr-1"></i> Add/Update Period Slot
                        </button>
                    </div>
                </div>

                <div id="admin-periods-list" class="space-y-3">
                    <div class="text-center py-10 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Loading school timings...</div>
                </div>
            </div>
            `;
        }
    },
    addStudent: {
        title: 'Add Student',
        render: () => {
            setTimeout(() => {
                if (typeof initStudentAdd === 'function') {
                    initStudentAdd('student-add-container');
                }
            }, 50);
            return `<div id="student-add-container"></div>`;
        }
    },
        addTeacher: {
        title: 'Add Teacher',
        render: () => {
            setTimeout(() => {
                if (typeof initFacultyAdd === 'function') {
                    initFacultyAdd();
                }
            }, 50);
            return `<div id="faculty-add-container"></div>`;
        }
    },
    sendNotice: {
        render: () => `
            <div class="mb-6">
                <h2 class="text-xl font-black text-gray-800">Broadcast Message</h2>
                <p class="text-xs text-gray-500 mt-1">Send notifications to parents and teachers</p>
            </div>
            
            <div class="space-y-4">
                <div class="mobile-card">
                    <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Target Audience</label>
                    <select id="notice-target" class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                        <option value="all">All (Everyone)</option>
                        <option value="parents">All Parents</option>
                        <option value="teachers">All Teachers</option>
                        <option value="specific">Specific Class</option>
                    </select>
                </div>

                <div id="target-class-div" class="mobile-card hidden">
                    <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Class Name</label>
                    <input type="text" id="notice-class" class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. 10-A">
                </div>

                <div class="mobile-card">
                    <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Notice Title</label>
                    <input type="text" id="notice-title" class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Emergency Holiday">
                </div>

                <div class="mobile-card">
                    <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Message Content</label>
                    <textarea id="notice-body" rows="4" class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Write your announcement here..."></textarea>
                </div>

                <button onclick="broadcastNotice()" class="w-full bg-teal-600 text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all">
                    <i class="fas fa-paper-plane mr-2"></i> Send Notification
                </button>
                <button onclick="adminRouter('dashboard')" class="w-full text-gray-400 font-bold py-2 text-xs">
                    Cancel
                </button>
            </div>
        `
    },
    parentSuggestionsBoard: {
        title: 'Parent Suggestions Feed',
        render: () => {
            setTimeout(() => {
                loadAdminSuggestionsFeed();
            }, 50);

            return `
                <div class="mb-6 animate-fade-in">
                    <h2 class="text-xl font-black text-gray-800 tracking-tight">Parent Suggestions Feed</h2>
                    <p class="text-xs text-gray-500">Read feedback and suggestions submitted by school parents</p>
                </div>

                <div id="admin-suggestions-list" class="space-y-4 pb-10">
                    <div class="text-center py-10 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Syncing suggestions board...</div>
                </div>
            `;
        }
    },
    classReassignmentQueue: {
        title: 'Class Reassignment Applications',
        render: () => {
            setTimeout(() => {
                loadAdminReassignmentQueue();
            }, 50);

            return `
                <div class="mb-6 animate-fade-in">
                    <h2 class="text-xl font-black text-gray-800 tracking-tight">Class Reassignment Requests</h2>
                    <p class="text-xs text-gray-500">Approve or deny applications submitted by faculty members</p>
                </div>

                <div id="admin-reassignment-list" class="space-y-4 pb-10">
                    <div class="text-center py-10 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Syncing application queue...</div>
                </div>
            `;
        }
    }
};

function adminRouter(viewName, params = {}) {
    const view = adminViews[viewName] || adminViews.dashboard;
    let backAction = (viewName !== 'dashboard') ? () => adminRouter('dashboard') : null;
    if (viewName === 'editStudent') {
        backAction = () => adminRouter('viewStudents');
    } else if (viewName === 'editTeacher') {
        backAction = () => adminRouter('viewTeachers');
    }

    renderHeader(view.title, backAction);
    triggerViewTransition();

    document.getElementById('main-content').innerHTML = typeof view.render === 'function' ? view.render(params) : view.render;

    db.ref('school/students').off();
    db.ref('school/teachers').off();

    if (viewName === 'dashboard') {
        db.ref('school/students').on('value', snap => {
            const el = document.getElementById('stat-students');
            if (el) el.innerText = SafeResolvers.count(snap.numChildren());
        });
        db.ref('school/teachers').on('value', snap => {
            const el = document.getElementById('stat-teachers');
            if (el) el.innerText = SafeResolvers.count(snap.numChildren());
        });
        loadAdminNotices();
    }

        if (viewName === 'viewStudents') {
        if (typeof initStudentView === 'function') {
            initStudentView('student-view-container');
        } else {
            loadStudentsList();
        }
    }

    if (viewName === 'viewTeachers') {
        if (typeof initTeacherView === 'function') {
            initTeacherView('teacher-view-container');
        } else {
            loadTeachersList();
        }
    }

    if (viewName === 'sendNotice') {
        const targetSelect = document.getElementById('notice-target');
        const classDiv = document.getElementById('target-class-div');
        targetSelect.addEventListener('change', () => {
            if (targetSelect.value === 'specific') {
                classDiv.classList.remove('hidden');
            } else {
                classDiv.classList.add('hidden');
            }
        });
    }

    if (viewName === 'examsManagement') {
        loadExamWindowsList();
    }

    if (viewName === 'helpDesk') {
        loadHelpDeskTicketsList();
    }

    if (viewName === 'parentSuggestionsBoard') {
        loadAdminSuggestionsFeed();
    }

    if (viewName === 'classReassignmentQueue') {
        loadAdminReassignmentQueue();
    }

    document.getElementById('main-content').scrollTop = 0;
}

function filterList(input, listId) {
    const filter = input.value.toLowerCase();
    const list = document.getElementById(listId);
    if (!list) return;
    const items = list.getElementsByClassName('list-item');
    for (let i = 0; i < items.length; i++) {
        const text = items[i].innerText.toLowerCase();
        items[i].style.display = text.indexOf(filter) > -1 ? "" : "none";
    }
}

async function initializeDirectoryFilters() {
    const { classes, sections } = await getSchoolMetadata();
    const lvlSelect = document.getElementById('filter-level');
    
    if (lvlSelect) {
        classes.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c; opt.innerText = `Class ${c}`;
            lvlSelect.appendChild(opt);
        });
    }
    loadStudentsList();
}

async function loadAdminNotices() {
    const container = document.getElementById('admin-recent-notices');
    if (!container) return;
    try {
        const snap = await db.ref('school/notices').limitToLast(3).once('value');
        const notices = snap.val();
        if (!notices) {
            container.innerHTML = `<div class="text-center py-6 text-gray-300 text-xs italic">No announcements found.</div>`;
            return;
        }
        container.innerHTML = Object.values(notices).reverse().map(n => `
            <div class="mobile-card !p-4 border-l-4 border-teal-500 bg-white shadow-sm">
                <h4 class="text-xs font-black text-gray-800">${SafeResolvers.text(n.title)}</h4>
                <p class="text-[10px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">${SafeResolvers.text(n.body)}</p>
                <div class="flex justify-between items-center mt-3 pt-2 border-t border-gray-50">
                    <span class="text-[9px] font-bold text-teal-600 uppercase">${SafeResolvers.text(n.target)}</span>
                    <span class="text-[9px] text-gray-300 font-medium">${convertToNepaliDate(n.timestamp)}</span>
                </div>
        `).join('');
    } catch (e) { 
        console.error(e); 
    }
}

async function broadcastNotice() {
    const target = document.getElementById('notice-target').value;
    const title = document.getElementById('notice-title').value.trim();
    const body = document.getElementById('notice-body').value.trim();
    const targetClass = document.getElementById('notice-class').value.trim();

    if (!title || !body) {
        await alert("Please fill in title and message.");
        return;
    }

    const noticeData = {
        target,
        targetClass: target === 'specific' ? targetClass : null,
        title,
        body,
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        sender: currentUser.name || 'Admin'
    };

    try {
        await db.ref('school/notices').push(noticeData);
        await alert("Notice Broadcasted!");
        adminRouter('dashboard');
    } catch (e) {
        console.error(e);
        await alert("Failed to send notice.");
    }
}

async function loadAdminSuggestionsFeed() {
    const container = document.getElementById('admin-suggestions-list');
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
        container.innerHTML = `<div class="text-center py-10 text-red-400 text-xs">Error loading suggestions feed: ${e.message}</div>`;
    }
}

async function loadAdminReassignmentQueue() {
    const container = document.getElementById('admin-reassignment-list');
    if (!container) return;

    try {
        const snap = await db.ref('school/class_change_requests').once('value');
        const list = snap.val();

        if (!list) {
            container.innerHTML = `<div class="text-center py-10 text-gray-400 text-xs italic bg-white rounded-xl border border-gray-100 p-6">No reassignment requests submitted.</div>`;
            return;
        }

        const requests = Object.values(list);
        requests.sort((a, b) => b.timestamp - a.timestamp);

        container.innerHTML = requests.map(r => {
            const isPending = r.status === 'Pending';
            let statusColor = "bg-yellow-100 text-yellow-700";
            if (r.status === 'Approved') statusColor = "bg-green-100 text-green-700";
            else if (r.status === 'Denied') statusColor = "bg-red-100 text-red-700";

            let actionButtons = '';
            if (isPending) {
                actionButtons = `
                    <div class="grid grid-cols-2 gap-3 mt-4">
                        <button onclick="handleApproveRequest('${r.requestId}')" class="bg-green-600 text-white font-black py-2 rounded-xl text-[10px] uppercase shadow-sm active:scale-95 transition-all">
                            <i class="fas fa-check mr-1"></i> Approve
                        </button>
                        <button onclick="handleDenyRequest('${r.requestId}')" class="bg-red-600 text-white font-black py-2 rounded-xl text-[10px] uppercase shadow-sm active:scale-95 transition-all">
                            <i class="fas fa-times mr-1"></i> Deny
                        </button>
                    </div>
                `;
            }

            return `
                <div class="mobile-card bg-white p-4 shadow-sm relative overflow-hidden border-l-4 ${isPending ? 'border-yellow-500' : (r.status === 'Approved' ? 'border-green-500' : 'border-red-500')} text-left">
                    <div class="flex justify-between items-center mb-2">
                        <div class="flex items-center gap-1.5">
                            <span class="text-xs font-black text-gray-800">${r.teacherName}</span>
                            <span class="text-[9px] text-gray-400 font-bold">(ID: ${r.teacherId})</span>
                        </div>
                        <span class="px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${statusColor}">${r.status}</span>
                    </div>
                    <h4 class="font-bold text-gray-800 text-sm">Requested: Class ${r.requestedClass} | ${r.requestedSubject}</h4>
                    <p class="text-[9px] text-gray-400 font-bold mt-1 uppercase">Applied: ${convertToNepaliDate(r.timestamp)}</p>
                    ${actionButtons}
                </div>
            `;
        }).join('');
    } catch (e) {
        console.error(e);
        container.innerHTML = `<div class="text-center py-10 text-red-400 text-xs">Error loading request queue: ${e.message}</div>`;
    }
}

async function handleApproveRequest(requestId) {
    if (!confirm("Are you sure you want to APPROVE this workload change request? It will automatically update the teacher's profile and schedule node.")) return;
    try {
        const snap = await db.ref('school/class_change_requests/' + requestId).once('value');
        if (!snap.exists()) {
            await alert("Request not found!");
            return;
        }

        const req = snap.val();
        const teacherId = req.teacherId;

        // 1. Update request status to Approved
        await db.ref('school/class_change_requests/' + requestId).update({ status: 'Approved' });

        // 2. Fetch current teacher's profile to update assignedClasses and schedule
        const tchSnap = await db.ref('school/teachers/' + teacherId).once('value');
        if (tchSnap.exists()) {
            const t = tchSnap.val();
            let classes = t.assignedClasses || [ ];
            if (!classes.includes(req.requestedClass)) {
                classes.push(req.requestedClass);
            }

            let subjects = t.subjects || [ ];
            if (!subjects.includes(req.requestedSubject)) {
                subjects.push(req.requestedSubject);
            }

            // Let's create or update schedule node
            let schedule = t.schedule || [ ];
            // Find if there is a slot, otherwise add one
            const newPeriod = {
                period: (schedule.length + 1) + 'th',
                class: req.requestedClass,
                subject: req.requestedSubject,
                time: '12:00 PM' // default slot
            };
            schedule.push(newPeriod);

            await db.ref('school/teachers/' + teacherId).update({
                assignedClasses: classes,
                subjects: subjects,
                schedule: schedule
            });
        }

        await alert("Request approved and teacher profile updated automatically!");
        loadAdminReassignmentQueue();
    } catch (e) {
        console.error(e);
        await alert("Failed to approve request: " + e.message);
    }
}

async function handleDenyRequest(requestId) {
    if (!confirm("Are you sure you want to DENY this class reassignment request?")) return;
    try {
        await db.ref('school/class_change_requests/' + requestId).update({ status: 'Denied' });
        await alert("Request denied successfully.");
        loadAdminReassignmentQueue();
    } catch (e) {
        console.error(e);
        await alert("Failed to deny request: " + e.message);
    }
}
async function loadPeriodTimings() {
    const container = document.getElementById('admin-periods-list');
    if (!container) return;

    try {
        const snap = await db.ref('school/config/period_timings').once('value');
        const timings = snap.val();

        if (!timings) {
            container.innerHTML = '<div class="text-center py-10 text-gray-400 text-xs italic bg-white rounded-xl border border-gray-100">No period timings defined yet.</div>';
            return;
        }

        const sortedList = Object.values(timings).sort((a, b) => (a.sort || 0) - (b.sort || 0));

        container.innerHTML = sortedList.map(p => `
            <div class="mobile-card bg-white p-4 flex items-center justify-between border-l-4 border-pink-500">
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 bg-pink-50 text-pink-600 rounded-full flex items-center justify-center font-black text-xs">
                        ${p.id}
                    </div>
                    <div>
                        <h4 class="font-bold text-gray-800 text-sm">${p.id} Period</h4>
                        <p class="text-[10px] text-gray-400 font-bold uppercase">${p.startTime} - ${p.endTime}</p>
                    </div>
                </div>
                <button onclick="deletePeriodTiming('${p.id}')" class="text-gray-300 hover:text-red-500 p-2 transition-colors">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `).join('');
    } catch (e) {
        console.error(e);
        container.innerHTML = `<div class="text-center py-10 text-red-400 text-xs">Error: ${e.message}</div>`;
    }
}

async function savePeriodTiming() {
    const key = document.getElementById('period-key').value.trim();
    const sort = parseInt(document.getElementById('period-sort').value);
    const start = document.getElementById('period-start').value;
    const end = document.getElementById('period-end').value;

    if (!key || !start || !end) {
        await alert("Please fill in Period ID, Start Time, and End Time.");
        return;
    }

    // Helper to convert 24h to 12h for display
    const formatTime = (timeStr) => {
        const [h, m] = timeStr.split(':');
        const hour = parseInt(h);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const h12 = hour % 12 || 12;
        return `${h12}:${m} ${ampm}`;
    };

    const periodData = {
        id: key,
        sort: isNaN(sort) ? 1 : sort,
        startTime: formatTime(start),
        endTime: formatTime(end),
        rawStart: start,
        rawEnd: end
    };

    try {
        await db.ref('school/config/period_timings/' + key).set(periodData);
        showToast(`Period ${key} saved successfully!`);
        document.getElementById('period-key').value = '';
        loadPeriodTimings();
    } catch (e) {
        console.error(e);
        await alert("Failed to save timing: " + e.message);
    }
}

async function deletePeriodTiming(key) {
    if (!confirm(`Remove ${key} period from global timings?`)) return;
    try {
        await db.ref('school/config/period_timings/' + key).remove();
        loadPeriodTimings();
    } catch (e) {
        console.error(e);
        await alert("Failed to delete: " + e.message);
    }
}
