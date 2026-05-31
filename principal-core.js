// Principal Sub-Application Logic (Core Router & Views)

// Check authorization on load
if (checkAuth([ROLES.PRINCIPAL])) {
    document.addEventListener('DOMContentLoaded', () => {
        principalRouter('dashboard');
    });
}

const principalViews = {
    dashboard: {
        title: "Principal Dashboard",
        render: () => `
            <div class="mb-6">
                <h2 class="text-2xl font-black text-gray-800 tracking-tight">Principal's Office</h2>
                <p class="text-xs text-blue-800 font-bold uppercase tracking-widest mt-1">School Performance Analytics</p>
            </div>

            <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div class="mobile-card bg-blue-50 border-none shadow-none">
                        <i class="fas fa-users text-blue-600 text-lg mb-1"></i>
                        <span id="p-total-students" class="block text-2xl font-black text-gray-800">...</span>
                        <span class="text-[10px] text-gray-400 font-bold uppercase">Total Pupils</span>
                    </div>
                    <div class="mobile-card bg-purple-50 border-none shadow-none">
                        <i class="fas fa-chalkboard-teacher text-purple-600 text-lg mb-1"></i>
                        <span id="p-total-teachers" class="block text-2xl font-black text-gray-800">...</span>
                        <span class="text-[10px] text-gray-400 font-bold uppercase">Faculty Strength</span>
                    </div>
                </div>

                <div class="mobile-card !p-0 overflow-hidden bg-white shadow-sm">
                    <div class="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                        <h4 class="text-xs font-black uppercase text-gray-500">Student Attendance</h4>
                        <span class="text-green-600 font-bold text-xs">92% Average</span>
                    </div>
                    <div class="p-6 flex justify-around">
                        <div class="text-center">
                            <p class="text-2xl font-black text-gray-800">414</p>
                            <p class="text-[9px] text-gray-400 font-bold uppercase mt-1">Present</p>
                        </div>
                        <div class="text-center">
                            <p class="text-2xl font-black text-red-500">36</p>
                            <p class="text-[9px] text-gray-400 font-bold uppercase mt-1">Absent</p>
                        </div>
                    </div>
                </div>

                <div class="mobile-card !p-0 overflow-hidden bg-white shadow-sm">
                    <div class="p-4 bg-gray-50 border-b border-gray-100">
                        <h4 class="text-xs font-black uppercase text-gray-500">Academic Progress</h4>
                    </div>
                    <div class="p-4 space-y-3">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-bold text-gray-600">Grade 10 Passes</span>
                            <div class="w-24 bg-gray-100 h-2 rounded-full overflow-hidden">
                                <div class="bg-blue-600 h-full w-[95%]"></div>
                            </div>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-bold text-gray-600">Homework Sync</span>
                            <div class="w-24 bg-gray-100 h-2 rounded-full overflow-hidden">
                                <div class="bg-yellow-500 h-full w-[60%]"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <button onclick="await alert('Compiling school metrics report...')" class="w-full bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg mt-6 active:scale-95 transition-all">
                <i class="fas fa-file-export mr-2"></i> Export Monthly Report
            </button>
        `
    },
    students: {
        title: "Students Directory",
        render: () => {
            setTimeout(async () => {
                const { classes, sections } = await getSchoolMetadata();
                const lvlSel = document.getElementById('filter-lvl');
                if (lvlSel) classes.forEach(c => lvlSel.add(new Option(`Class ${c}`, c)));
                loadPrincipalStudents();
            }, 50);
            return `
            <div class="mb-4 space-y-3">
                <div class="relative">
                    <input type="text" id="p-std-search" onkeyup="filterStudentList()" class="w-full p-4 bg-white border border-gray-100 rounded-xl shadow-sm outline-none pl-12 text-sm" placeholder="Search pupils by name...">
                    <i class="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"></i>
                </div>
                <div class="mobile-card flex items-center justify-between !py-2 bg-white">
                    <label class="text-[10px] font-black text-gray-400 uppercase tracking-tight">Level</label>
                    <select id="filter-lvl" onchange="loadPrincipalStudents()" class="p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-black outline-none w-48 text-right">
                        <option value="all">ALL CLASSES</option>
                    </select>
                    <select id="filter-sec" class="hidden">
                        <option value="all" selected>all</option>
                    </select>
                </div>
            </div>
            <div id="p-student-list" class="space-y-3">
                <div class="text-center py-10 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Loading Students...</div>
            </div>
            `;
        }
    },
    teachers: {
        title: "Faculty Directory",
        render: () => `
                <p class="text-xs text-gray-500">Real-time status check of all instructional departments</p>
            </div>
            
            <div id="principal-teachers-container" class="space-y-3 pb-10">
                <div class="text-center py-10 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Loading Directory...</div>
            </div>
        `
    }
};

function principalRouter(viewName) {
    const view = principalViews[viewName] || principalViews.dashboard;
    const backAction = (viewName !== 'dashboard') ? () => principalRouter('dashboard') : null;

    renderHeader(view.title, backAction);
    triggerViewTransition();

    document.getElementById('main-content').innerHTML = view.render();

    db.ref('school/students').off();
    db.ref('school/teachers').off();

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
        db.ref('school/students').on('value', snap => {
            const el = document.getElementById('p-total-students');
            if (el) el.innerText = SafeResolvers.count(snap.numChildren());
        });
        db.ref('school/teachers').on('value', snap => {
            const el = document.getElementById('p-total-teachers');
            if (el) el.innerText = SafeResolvers.count(snap.numChildren());
        });
    }

    if (viewName === 'students') {
        loadPrincipalStudents();
    }

    if (viewName === 'teachers') {
        renderSharedTeacherDirectory('principal-teachers-container', { canClickToCall: true });
    }

    document.getElementById('main-content').scrollTop = 0;
}
    