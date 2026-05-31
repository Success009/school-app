// Parent Sub-Application Logic (Core Router & Views)

// Check authorization on load
if (checkAuth([ROLES.PARENT])) {
    document.addEventListener('DOMContentLoaded', () => {
        parentRouter('dashboard');
        listenToRecentNotices();
    });
}

function getStudentFullName(nameObj) {
    if (!nameObj) return 'Student';
    if (typeof nameObj === 'object') {
        return `${nameObj.first || ''} ${nameObj.middle || ''} ${nameObj.last || ''}`.replace(/\s+/g, ' ').trim();
    }
    return nameObj;
}

const parentViews = {
    dashboard: {
        title: 'Parent Dashboard',
        render: () => `
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h2 class="text-2xl font-extrabold text-gray-800 tracking-tight">Namaste, ${currentUser ? currentUser.name.split(' ')[0] : 'Parent'}</h2>
                    <p class="text-gray-500 text-sm flex items-center mt-1">
                        <i class="fas fa-map-marker-alt mr-1 text-blue-500"></i> Udayashree English School
                    </p>
                </div>
                <div class="w-12 h-12">
                    <img src="logo.png" class="w-full h-full object-contain" alt="Logo">
                </div>
            </div>
            
            <div class="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-6 text-white shadow-xl mb-8 relative overflow-hidden">
                <div class="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                <div class="flex items-center justify-between mb-6 relative z-10">
                    <div>
                        <p class="text-xs text-blue-100 uppercase font-bold tracking-widest mb-1">Student Profile</p>
                        <h3 class="text-2xl font-black">${getStudentFullName(currentUser?.student.name)}</h3>
                    </div>
                    <div class="w-16 h-16 bg-white rounded-2xl overflow-hidden border-2 border-white/50 shadow-lg ring-4 ring-white/10">
                        <img src="${currentUser?.student.photo}" class="w-full h-full object-cover" alt="Student">
                    </div>
                </div>
                <div class="flex justify-between items-end relative z-10">
                    <div class="space-y-1">
                        <div class="flex items-center text-sm">
                            <span class="text-blue-200 mr-2">Grade:</span>
                            <span class="font-bold">Class ${currentUser?.student.grade}</span>
                        </div>
                        <div class="flex items-center text-sm">
                            <span class="text-blue-200 mr-2">Blood:</span>
                            <span class="font-bold">${currentUser?.student.bloodGroup || 'N/A'}</span>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-[10px] text-blue-200 uppercase font-bold">Roll No: ${currentUser?.student.roll || '01'}</p>
                        <p class="text-[10px] text-blue-100 uppercase font-bold">ID: ${currentUser?.student.id || 'N/A'}</p>
                        <p class="text-sm font-bold mt-1">Father: ${currentUser?.student.fatherName || 'N/A'}</p>
                    </div>
                </div>
            </div>

            <h3 class="font-bold text-gray-800 mb-4 px-1">Academic & School Services</h3>
            <div class="grid grid-cols-2 gap-4 mb-4">
                <!-- 1. Attendance -->
                <div class="mobile-card flex flex-col items-center justify-center text-center p-5 active:bg-blue-50 transition-colors cursor-pointer group relative" onclick="parentRouter('attendance')">
                    <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 mb-3 group-active:scale-90 transition-transform">
                        <i class="fas fa-calendar-check text-lg"></i>
                    </div>
                    <span id="dash-attendance-pct" class="text-xl font-black text-gray-800">...</span>
                    <span class="text-[10px] text-gray-400 uppercase font-bold mt-1 tracking-wider">Attendance</span>
                </div>
                <!-- 2. Teachers -->
                <div class="mobile-card flex flex-col items-center justify-center text-center p-5 active:bg-blue-50 transition-colors cursor-pointer group relative" onclick="parentRouter('childTeachers')">
                    <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-3 group-active:scale-90 transition-transform">
                        <i class="fas fa-chalkboard-teacher text-lg"></i>
                    </div>
                    <span class="text-sm font-bold text-gray-800 leading-tight">Teachers</span>
                    <span class="text-[10px] text-gray-400 uppercase font-bold mt-2 tracking-wider">Instructors</span>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-4 mb-4">
                <!-- 3. Class Routine -->
                <div class="mobile-card flex flex-col items-center justify-center text-center p-5 active:bg-blue-50 transition-colors cursor-pointer group relative" onclick="parentRouter('routine')">
                    <div class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mb-3 group-active:scale-90 transition-transform">
                        <i class="fas fa-user-graduate text-lg"></i>
                    </div>
                    <span class="text-sm font-bold text-gray-800 leading-tight">Class<br>Routine</span>
                    <span class="text-[10px] text-gray-400 uppercase font-bold mt-2 tracking-wider">Routine</span>
                </div>
                <!-- 4. Exam Results -->
                <div class="mobile-card flex flex-col items-center justify-center text-center p-5 active:bg-blue-50 transition-colors cursor-pointer group relative" onclick="parentRouter('results')">
                    <div class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mb-3 group-active:scale-90 transition-transform">
                        <i class="fas fa-file-signature text-lg"></i>
                    </div>
                    <span class="text-sm font-bold text-gray-800 leading-tight">Exam<br>Results</span>
                    <span class="text-[10px] text-gray-400 uppercase font-bold mt-2 tracking-wider">Academics</span>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-4 mb-4">
                <!-- 5. School Notices -->
                <div class="mobile-card flex flex-col items-center justify-center text-center p-5 active:bg-blue-50 transition-colors cursor-pointer group relative" onclick="parentRouter('notices')">
                    <span id="dash-notices-badge" class="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full animate-ping hidden"></span>
                    <div class="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 mb-3 group-active:scale-90 transition-transform">
                        <i class="fas fa-bullhorn text-lg"></i>
                    </div>
                    <span class="text-sm font-bold text-gray-800 leading-tight">School<br>Notices</span>
                    <span class="text-[10px] text-gray-400 uppercase font-bold mt-2 tracking-wider">Updates</span>
                </div>
                <!-- 6. Support Tickets -->
                <div class="mobile-card flex flex-col items-center justify-center text-center p-5 active:bg-blue-50 transition-colors cursor-pointer group relative" onclick="parentRouter('tickets')">
                    <div class="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mb-3 group-active:scale-90 transition-transform">
                        <i class="fas fa-ticket-alt text-lg"></i>
                    </div>
                    <span class="text-sm font-bold text-gray-800 leading-tight">Support<br>Tickets</span>
                    <span class="text-[10px] text-gray-400 uppercase font-bold mt-2 tracking-wider">Helpdesk</span>
                </div>
            </div>

            <!-- Least Priority / Faculty Directory at the bottom -->
            <div onclick="parentRouter('teachers')" class="mobile-card flex items-center p-4 bg-gray-50 hover:bg-gray-100 border border-gray-100 shadow-none mt-4 cursor-pointer active:scale-98 transition-all">
                <div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 mr-4">
                    <i class="fas fa-chalkboard-teacher text-sm"></i>
                </div>
                <div class="flex-grow text-left">
                    <h4 class="text-sm font-bold text-gray-800">Complete Faculty Directory</h4>
                    <p class="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Contact and view availability of all school teachers</p>
                </div>
                <i class="fas fa-chevron-right text-gray-400 text-xs"></i>
            </div>
        `
    },
    attendance: {
        render: () => `
            <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6 flex items-center justify-between">
                <div>
                    <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Attendance Score</p>
                    <h3 id="parent-attendance-score" class="text-3xl font-black text-gray-800">...</h3>
                </div>
                <div class="w-16 h-16 relative">
                    <svg class="w-full h-full" viewBox="0 0 36 36">
                        <path class="text-gray-100" stroke-width="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path id="parent-attendance-gauge" class="text-green-500" stroke-width="3" stroke-dasharray="0, 100" stroke-linecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    </svg>
                    <div class="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-green-600">GOOD</div>
                </div>
            </div>

            <div class="flex justify-between items-center mb-4 px-1">
                <h2 class="text-lg font-black text-gray-800 tracking-tight">Recent History</h2>
            </div>
            
            <div id="parent-attendance-history" class="space-y-3">
                <div class="text-center py-10 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Compiling attendance history...</div>
            </div>
        `
    },
    suggestions: {
        title: 'Parent Suggestions Feed',
        render: () => {
            setTimeout(() => {
                loadParentSuggestionsList();
            }, 50);

            return `
                <div class="mb-6">
                    <h2 class="text-xl font-black text-gray-800 tracking-tight">Parent Suggestions</h2>
                    <p class="text-xs text-gray-500">Submit suggestions or feedback directly to our faculty members</p>
                </div>

                <div class="mobile-card space-y-4 mb-6">
                    <h3 class="text-xs font-black uppercase text-blue-600 tracking-wider">Submit New Suggestion</h3>
                    <div>
                        <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Your Suggestion / Message</label>
                        <textarea id="sug-message" rows="3" class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-xs font-bold" placeholder="Write your constructive suggestion here..."></textarea>
                    </div>
                    <button onclick="submitParentSuggestion()" class="w-full bg-blue-700 text-white font-black py-3 rounded-xl shadow-md active:scale-95 transition-all text-xs">
                        <i class="fas fa-paper-plane mr-2"></i> Send to Faculty
                    </button>
                </div>

                <h3 class="font-bold text-gray-400 uppercase text-[10px] tracking-widest px-1 mb-4">My Suggestions Feed</h3>
                <div id="parent-suggestions-list" class="space-y-3 pb-10">
                    <div class="text-center py-10 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Loading suggestions feed...</div>
                </div>
            `;
        }
    },
    notices: {
        title: 'Notice Board',
        render: () => `
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-bold">School Updates</h2>
            </div>
            <div id="parent-notices-container" class="space-y-4">
                <div class="text-center py-10 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Syncing notices...</div>
            </div>
        `
    },
    routine: {
        title: 'Class Routine',
        render: () => `
            <div class="mb-6">
                <h2 class="text-xl font-black text-gray-800 tracking-tight">Weekly Schedule</h2>
                <p class="text-xs text-gray-500">View subject periods and teacher contacts</p>
            </div>
            
            <div class="space-y-4">
                ${(currentUser?.student.schedule || [ ]).map(item => `
                    <div class="mobile-card !p-0 overflow-hidden border-l-4 ${item.subject === 'Lunch Break' ? 'border-gray-300 bg-gray-50' : 'border-blue-600'}">
                        <div class="p-4 flex items-center justify-between">
                            <div class="flex items-center">
                                <div class="mr-4 text-center">
                                    <span class="block text-[10px] font-bold text-blue-600 uppercase tracking-tighter">${item.period}</span>
                                    <span class="block text-xs font-black text-gray-800">${item.time.split(' ')[0]}</span>
                                </div>
                                <div>
                                    <h4 class="font-bold text-gray-800 text-sm">${item.subject}</h4>
                                    <p class="text-[10px] text-gray-400 font-medium">${item.teacher !== '-' ? 'Teacher: ' + item.teacher : 'Relaxation Time'}</p>
                                </div>
                            </div>
                            ${item.teacher !== '-' ? `
                                <div class="flex gap-2">
                                    <a href="tel:+9779800000000" class="w-8 h-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center active:scale-90 transition-transform">
                                        <i class="fas fa-phone-alt text-xs"></i>
                                    </a>
                                </div>
                            ` : ''}
                        </div>
                        <div class="bg-gray-50 px-4 py-1.5 flex items-center border-t border-gray-100">
                            <i class="fas fa-calendar-day text-[10px] text-gray-400 mr-2"></i>
                            <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest">${item.days}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="mt-8 mb-4">
                <h3 class="text-sm font-bold text-gray-400 uppercase tracking-widest px-1">Other Contacts</h3>
            </div>
            <div class="mobile-card flex items-center p-4">
                <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 mr-3">
                    <i class="fas fa-bus text-sm"></i>
                </div>
                <div class="flex-grow">
                    <h4 class="text-sm font-bold text-gray-800">Bus Driver (Route 4)</h4>
                    <p class="text-[10px] text-gray-500">Mr. Ram Bahadur</p>
                </div>
                <a href="tel:+9779800000004" class="w-9 h-9 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
                    <i class="fas fa-phone-alt text-sm"></i>
                </a>
            </div>
        `
    },
    results: {
        title: 'Report Card',
        render: () => {
            setTimeout(() => { 
                const selector = document.getElementById('results-term-select');
                if (selector) loadParentResults(selector.value); 
            }, 50);

            return `
                <div class="mb-4 space-y-3">
                    <div class="mobile-card flex items-center justify-between !py-2.5 bg-white shadow-sm border border-gray-100">
                        <label class="text-[10px] font-black text-gray-400 uppercase pl-1 tracking-wider">Select Exam Term</label>
                        <select id="results-term-select" onchange="loadParentResults(this.value)" class="p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold outline-none">
                            <option value="Term 1" selected>First Terminal Exam</option>
                            <option value="Term 2">Second Terminal Exam</option>
                            <option value="Term 3">Third Terminal Exam</option>
                            <option value="Finals">Final Examination</option>
                        </select>
                    </div>
                </div>

                <div id="results-display-container" class="space-y-4">
                    <div class="text-center py-10 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Loading results...</div>
                </div>
            `;
        }
    },
    profile: {
        title: 'My Profile',
        render: () => `
            <div class="flex flex-col items-center my-6">
                <div class="w-24 h-24 bg-white rounded-full flex items-center justify-center text-blue-700 mb-3 border-4 border-white shadow-xl relative overflow-hidden">
                    <img src="${SafeResolvers.photo(currentUser?.student.photo)}" class="w-full h-full object-cover" alt="Student Profile">
                </div>
                <h2 class="text-xl font-bold">${SafeResolvers.text(currentUser ? currentUser.name : 'Parent')}</h2>
                <span class="text-xs text-gray-500 font-bold uppercase tracking-widest">Parent / Guardian</span>
                <p class="text-[10px] text-gray-400 mt-1">ID: ${SafeResolvers.text(currentUser ? currentUser.id : 'N/A')}</p>
            </div>
            <div class="mobile-card !p-0 overflow-hidden divide-y divide-gray-50">
                <div onclick="parentRouter('results')" class="p-4 flex items-center active:bg-gray-50 cursor-pointer">
                    <i class="fas fa-child text-gray-400 mr-4 w-5"></i>
                    <span class="text-sm font-medium">Student Info: ${getStudentFullName(currentUser?.student.name)}</span>
                    <i class="fas fa-chevron-right ml-auto text-gray-300 text-xs"></i>
                </div>
                <div onclick="parentRouter('routine')" class="p-4 flex items-center active:bg-gray-50 cursor-pointer">
                    <i class="fas fa-calendar-alt text-gray-400 mr-4 w-5"></i>
                    <span class="text-sm font-medium">Class Routine & Details</span>
                    <i class="fas fa-chevron-right ml-auto text-gray-300 text-xs"></i>
                </div>
                <div onclick="parentRouter('teachers')" class="p-4 flex items-center active:bg-gray-50 cursor-pointer">
                    <i class="fas fa-chalkboard-teacher text-gray-400 mr-4 w-5"></i>
                    <span class="text-sm font-medium">Faculty Directory</span>
                    <i class="fas fa-chevron-right ml-auto text-gray-300 text-xs"></i>
                </div>
                <div onclick="handleLogout()" class="p-4 flex items-center active:bg-gray-50 text-red-500 cursor-pointer">
                    <i class="fas fa-power-off mr-4 w-5"></i>
                    <span class="text-sm font-bold">Logout</span>
                </div>
            </div>
            <div class="mt-8 text-center">
                <p class="text-[10px] text-gray-300 uppercase tracking-widest font-bold">Udayashree Parent App v1.3.0</p>
            </div>
        `
    },
    teachers: {
        title: 'Faculty Directory',
        render: () => `
            <div id="parent-teachers-container" class="space-y-3 pb-10">
                <div class="text-center py-10 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Loading Directory...</div>
            </div>
        `
    },
    childTeachers: {
        title: 'Teachers',
        render: () => {
            setTimeout(() => {
                loadMyTeachersList();
            }, 50);

            return `
                <div class="mb-6 animate-fade-in text-left">
                    <h2 class="text-xl font-black text-gray-800 tracking-tight">Assigned Instructors</h2>
                    <p class="text-xs text-gray-500">Teachers assigned to Class ${currentUser?.student.grade}</p>
                </div>

                <div class="space-y-6 pb-16">
                    <!-- Class Teacher Card Section -->
                    <div>
                        <h3 class="font-bold text-gray-400 uppercase text-[9px] tracking-widest px-1 mb-3 text-left">Class Advisor / Teacher</h3>
                        <div id="class-teacher-container" class="space-y-3">
                            <div class="text-center py-4 text-gray-400 text-xs italic">Resolving Class Teacher...</div>
                        </div>
                    </div>

                    <!-- Subject Teachers Section -->
                    <div>
                        <h3 class="font-bold text-gray-400 uppercase text-[9px] tracking-widest px-1 mb-3 text-left">Subject Instructors</h3>
                        <div id="subject-teachers-container" class="space-y-3">
                            <div class="text-center py-4 text-gray-400 text-xs italic">Loading assigned instructors...</div>
                        </div>
                    </div>
                </div>
            `;
        }
    },
    tickets: {
        title: 'Support Tickets',
        render: () => `
            <div class="mb-4 flex justify-between items-center">
                <p class="text-xs text-gray-500">File a query and trace its resolution</p>
                <button onclick="parentRouter('createTicket')" class="bg-blue-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase active:scale-95 transition-all">
                    <i class="fas fa-plus mr-1"></i> New Ticket
                </button>
            </div>
            <div id="parent-tickets-list" class="space-y-3 pb-10">
                <div class="text-center py-10 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Syncing tickets...</div>
            </div>
        `
    },
    createTicket: {
        title: 'Raise Support Ticket',
        render: () => `
            <div class="mb-4">
                <h3 class="font-bold text-gray-800 text-lg">New Support Query</h3>
                <p class="text-xs text-gray-500 mt-1">Submit your billing, academic, or transport issue directly to the administration</p>
            </div>

            <div class="space-y-4 pb-16">
                <div class="mobile-card">
                    <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Category</label>
                    <select id="tkt-category" class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-xs font-bold">
                        <option value="Accounts & Billing">Accounts & Billing</option>
                        <option value="School Bus / Transport">School Bus / Transport</option>
                        <option value="Academics">Academics</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                <div class="mobile-card">
                    <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Priority</label>
                    <select id="tkt-priority" class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-xs font-bold">
                        <option value="Low">Low (General Inquiry)</option>
                        <option value="Medium" selected>Medium (Action Needed)</option>
                        <option value="High">High (Urgent Disruption)</option>
                    </select>
                </div>

                <div class="mobile-card">
                    <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Subject / Title</label>
                    <input type="text" id="tkt-title" class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm font-bold" placeholder="e.g. May Tuition fee charged twice">
                </div>

                <div class="mobile-card">
                    <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Detailed Description</label>
                    <textarea id="tkt-desc" rows="4" class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-xs font-bold" placeholder="Please provide specific names, dates, bus routes, or fee ledger info..."></textarea>
                </div>

                <button onclick="submitParentTicket()" class="w-full bg-blue-700 text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all">
                    <i class="fas fa-paper-plane mr-2"></i> Submit Support Ticket
                </button>
                <button onclick="parentRouter('tickets')" class="w-full text-gray-400 font-bold py-2 text-xs">
                    Cancel
                </button>
            </div>
        `
    }
};

function parentRouter(viewName) {
    const view = parentViews[viewName] || parentViews.dashboard;
    const backAction = (viewName !== 'dashboard') ? () => parentRouter('dashboard') : null;

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

    // Sub-view functional bindings
    if (viewName === 'dashboard') {
        loadDashboardAttendancePercent();
    }
    if (viewName === 'attendance') {
        loadAttendanceHistoryAndStats();
    }
    if (viewName === 'childTeachers') {
        loadMyTeachersList();
    }
    if (viewName === 'suggestions') {
        loadParentSuggestionsList();
    }
    if (viewName === 'notices') {
        loadParentNotices();
    }
    if (viewName === 'results') {
        loadParentResults();
    }
    if (viewName === 'teachers') {
        renderSharedTeacherDirectory('parent-teachers-container', { canClickToCall: true });
    }
    if (viewName === 'tickets') {
        loadParentTicketsList();
    }
    document.getElementById('main-content').scrollTop = 0;
}

function toggleHomework(checkbox, subject) {
    const label = document.getElementById('label-' + subject);
    if (checkbox.checked) {
        label.innerText = 'Completed';
        label.classList.add('line-through', 'text-green-600');
        label.classList.remove('text-gray-500');
    } else {
        label.innerText = 'Mark as done';
        label.classList.remove('line-through', 'text-green-600');
        label.classList.add('text-gray-500');
    }
}

async function loadParentNotices() {
    const container = document.getElementById('parent-notices-container');
    if (!container) return;
    try {
        const snap = await db.ref('school/notices').once('value');
        const notices = snap.val();
        if (!notices) {
            container.innerHTML = `<div class="text-center py-10 text-gray-400">No announcements found on the notice board.</div>`;
            return;
        }
        
        const studentClass = currentUser?.student.grade;
        const studentSection = currentUser?.student.section;
        const fullClass = `${studentClass}-${studentSection}`;

        const filtered = Object.values(notices).filter(n => {
            return n.target === 'all' || 
                   n.target === 'parents' || 
                   (n.target === 'specific' && (n.targetClass === fullClass || n.targetClass === studentClass));
        }).reverse();

        if (filtered.length === 0) {
            container.innerHTML = `<div class="text-center py-10 text-gray-400">No relevant notices found for your class.</div>`;
            return;
        }

        container.innerHTML = filtered.map(n => `
            <div class="mobile-card border-l-4 border-blue-600 bg-white p-4 shadow-sm">
                <h4 class="font-bold text-blue-800">${SafeResolvers.text(n.title)}</h4>
                <p class="text-[10px] text-gray-400 mb-2">Posted: ${convertToNepaliDate(n.timestamp)}</p>
                <p class="text-sm text-gray-700 leading-relaxed">${SafeResolvers.text(n.body)}</p>
            </div>
        `).join('');
    } catch (e) {
        console.error(e);
        container.innerHTML = `<div class="text-center py-10 text-red-400">Error loading database announcements.</div>`;
    }
}

async function loadMyTeachersList() {
    const classTeacherContainer = document.getElementById('class-teacher-container');
    const subjectTeachersContainer = document.getElementById('subject-teachers-container');
    if (!classTeacherContainer || !subjectTeachersContainer) return;

    try {
        const snap = await db.ref('school/teachers').once('value');
        const teachers = snap.val();

        if (!teachers) {
            classTeacherContainer.innerHTML = `<div class="text-center py-4 text-gray-400 text-xs italic">No faculty members found.</div>`;
            subjectTeachersContainer.innerHTML = `<div class="text-center py-4 text-gray-400 text-xs italic">No faculty members found.</div>`;
            return;
        }

        const studentClass = currentUser?.student.grade; // e.g. "3"
        const classTeacherName = currentUser?.student.classTeacher || "Ms. Sunita Rai"; // default name

        // Find teachers teaching this class
        const assignedTeachers = Object.values(teachers).filter(t => {
            const classes = t.assignedClasses ? (Array.isArray(t.assignedClasses) ? t.assignedClasses : [t.assignedClasses]) : [ ];
            return classes.map(String).includes(String(studentClass));
        });

        if (assignedTeachers.length === 0) {
            classTeacherContainer.innerHTML = `<div class="text-center py-4 text-gray-400 text-xs italic bg-white rounded-2xl p-4 border border-gray-100">No teachers found explicitly assigned to Class ${studentClass} in the database.</div>`;
            subjectTeachersContainer.innerHTML = `<div class="text-center py-4 text-gray-400 text-xs italic bg-white rounded-2xl p-4 border border-gray-100">No teachers found explicitly assigned to Class ${studentClass}.</div>`;
            return;
        }

        // Identify Class Teacher
        let classTeacher = assignedTeachers.find(t => {
            const title = (t.professionalTitle || '').toLowerCase();
            return title.includes('class') || title.includes('adviser') || title.includes('advisor');
        });

        if (!classTeacher) {
            // Match by name
            classTeacher = assignedTeachers.find(t => {
                const fullName = `${t.name?.first || ''} ${t.name?.middle || ''} ${t.name?.last || ''}`.replace(/\s+/g, ' ').trim();
                return fullName.toLowerCase().includes(classTeacherName.toLowerCase()) || classTeacherName.toLowerCase().includes(fullName.toLowerCase());
            });
        }

        // If still not found, fallback to first teacher
        if (!classTeacher) {
            classTeacher = assignedTeachers[0];
        }

        // Subject teachers are everyone else
        const subjectTeachers = assignedTeachers.filter(t => t.id !== classTeacher.id);

        const renderTeacherCard = (t, isClassTeacherBadge = false) => {
            const fullName = `${t.name?.first || ''} ${t.name?.middle || ''} ${t.name?.last || ''}`.replace(/\s+/g, ' ').trim() || t.name || 'Faculty Member';
            const profTitle = t.professionalTitle || 'Subject Teacher';
            const phone = t.phone || '';
            const photo = t.photo || 'https://via.placeholder.com/150';

            // Resolve which subjects this teacher teaches the child (intersect of student's schedule and teacher's subjects)
            const scheduleItems = (currentUser?.student?.schedule || [ ]).filter(s => {
                return (s.teacher || '').toLowerCase().includes(fullName.toLowerCase()) || fullName.toLowerCase().includes((s.teacher || '').toLowerCase());
            });

            const subjectsList = scheduleItems.map(s => s.subject);
            const resolvedSubjects = subjectsList.length > 0 ? subjectsList.join(', ') : (t.subjects ? (Array.isArray(t.subjects) ? t.subjects.join(', ') : t.subjects) : 'Instructor');

            // Resolve timing from schedule
            const timingsList = scheduleItems.map(s => `${s.period} (${s.time})`);
            const resolvedTiming = timingsList.length > 0 ? timingsList.join(' | ') : 'Works Daily';

            const badgeHtml = isClassTeacherBadge 
                ? `<span class="px-2 py-0.5 rounded-full text-[8px] font-black uppercase bg-indigo-100 text-indigo-700 border border-indigo-200">Class Teacher</span>` 
                : `<span class="px-2 py-0.5 rounded-full text-[8px] font-black uppercase bg-green-100 text-green-700 border border-green-200">Subject Instructor</span>`;

            return `
                <div class="mobile-card flex items-center p-4 bg-white border border-gray-100 shadow-sm relative overflow-hidden transition-all text-left">
                    <img src="${SafeResolvers.photo(photo)}" class="w-14 h-14 rounded-2xl object-cover mr-4 border border-gray-50 shadow-sm">
                    <div class="flex-grow">
                        <div class="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 class="font-black text-gray-800 text-sm">${fullName}</h4>
                            ${badgeHtml}
                        </div>
                        <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">${profTitle} | ${resolvedSubjects}</p>
                        <p class="text-[9px] text-blue-600 font-bold mt-1 uppercase flex items-center gap-1">
                            <i class="far fa-clock text-[10px]"></i> ${resolvedTiming}
                        </p>
                    </div>
                    ${phone ? `
                        <a href="tel:${phone}" class="w-10 h-10 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-md active:scale-90 transition-transform ml-2">
                            <i class="fas fa-phone-alt text-sm"></i>
                        </a>
                    ` : ''}
                </div>
            `;
        };

        classTeacherContainer.innerHTML = renderTeacherCard(classTeacher, true);

        if (subjectTeachers.length === 0) {
            subjectTeachersContainer.innerHTML = `<div class="text-center py-6 text-gray-400 text-xs italic bg-white rounded-2xl p-4 border border-gray-100">No other subject teachers explicitly assigned to Class ${studentClass} in the database.</div>`;
        } else {
            subjectTeachersContainer.innerHTML = subjectTeachers.map(t => renderTeacherCard(t, false)).join('');
        }

    } catch (e) {
        console.error(e);
        classTeacherContainer.innerHTML = `<div class="text-center py-4 text-red-400 text-xs">Error resolving: ${e.message}</div>`;
        subjectTeachersContainer.innerHTML = `<div class="text-center py-4 text-red-400 text-xs">Error resolving: ${e.message}</div>`;
    }
}

function listenToRecentNotices() {
    db.ref('school/notices').on('value', snap => {
        const notices = snap.val();
        const badge = document.getElementById('header-bell-badge');
        const dashBadge = document.getElementById('dash-notices-badge');

        if (notices) {
            if (badge) badge.classList.remove('hidden');
            if (dashBadge) dashBadge.classList.remove('hidden');
        } else {
            if (badge) badge.classList.add('hidden');
            if (dashBadge) dashBadge.classList.add('hidden');
        }
    });
}
    