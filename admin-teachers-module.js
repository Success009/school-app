// admin-teachers-module.js - Modern Faculty Directory & Onboarding UI (Desktop + Mobile Responsive)

let teacherEngine = null;
let currentMobileTeacherView = 'roster'; // 'roster' | 'editor'
let editingTeacherId = null;
let selectedWorkloadClassId = '1'; // Currently selected class in workload tab

// In-memory active workload being edited in the form: { [classId]: string[] of subject names }
let currentFormWorkload = {};

async function initAdminTeachers() {
    const container = document.getElementById('teacher-engine-container');
    if (!container) return;

    if (!teacherEngine) {
        let ModuleClass = window.TeacherModule || (typeof TeacherModule !== 'undefined' ? TeacherModule : null);
        if (!ModuleClass) {
            await new Promise(r => setTimeout(r, 60));
            ModuleClass = window.TeacherModule || (typeof TeacherModule !== 'undefined' ? TeacherModule : null);
        }
        if (ModuleClass) {
            teacherEngine = new ModuleClass();
        }

        container.innerHTML = `
            <div class="text-center py-12 text-gray-400">
                <i class="fas fa-spinner fa-spin text-2xl mb-2 text-blue-600"></i>
                <p class="text-xs font-bold uppercase tracking-wider">Loading Faculty Directory...</p>
            </div>
        `;

        if (teacherEngine && teacherEngine.loadFromDatabase) {
            await teacherEngine.loadFromDatabase();
        }
    }

    // Default workload class to first available class
    if (teacherEngine && teacherEngine.classes && teacherEngine.classes.length > 0) {
        selectedWorkloadClassId = String(teacherEngine.classes[0].id);
    }

    renderTeacherLayout();
}

function renderTeacherLayout() {
    const container = document.getElementById('teacher-engine-container');
    if (!container || !teacherEngine) return;

    const teachers = teacherEngine.getFilteredTeachers();
    const activeTeacher = editingTeacherId ? teacherEngine.getTeacher(editingTeacherId) : null;

    container.innerHTML = `
        <div class="space-y-4 max-w-6xl mx-auto">
            <!-- Top Action Header -->
            <div class="flex justify-between items-center pb-3 border-b border-gray-200 gap-3">
                <div class="flex items-center gap-2.5">
                    <button onclick="handleBackNavigation()" class="text-gray-600 hover:text-blue-700 p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center text-sm font-bold" title="Back to Dashboard">
                        <i class="fas fa-arrow-left"></i>
                        <span class="hidden sm:inline ml-1.5 text-xs">Dashboard</span>
                    </button>
                    <div>
                        <h2 class="text-base font-black text-gray-800 leading-tight">Faculty Directory & Onboarding</h2>
                        <p class="text-[11px] text-gray-400 hidden sm:block">Manage teachers, class teacher assignments, and academic workloads</p>
                    </div>
                </div>

                <div class="flex items-center gap-2">
                    <button onclick="handleOpenNewTeacherForm()" class="bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-sm transition-all flex items-center gap-1.5 active:scale-95 shrink-0">
                        <i class="fas fa-user-plus"></i>
                        <span>New Faculty</span>
                    </button>
                    <button onclick="saveAllTeachers()" id="btn-save-all-teachers" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-sm transition-all flex items-center gap-1.5 active:scale-95 shrink-0">
                        <i class="fas fa-cloud-upload-alt"></i>
                        <span class="hidden sm:inline">Sync All</span>
                    </button>
                </div>
            </div>

            <!-- Responsive Master-Detail Layout -->
            <div class="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                
                <!-- Panel 1: Faculty Roster (Desktop Left / Mobile View 1) -->
                <div id="panel-faculty-roster" class="md:col-span-5 mobile-card !p-4 !m-0 ${currentMobileTeacherView === 'editor' ? 'hidden md:block' : 'block'}">
                    <!-- Search & Count -->
                    <div class="space-y-2 mb-3">
                        <div class="flex justify-between items-center">
                            <h3 class="text-xs font-black uppercase tracking-wider text-gray-700">
                                Faculty Roster (<span id="faculty-count">${teachers.length}</span>)
                            </h3>
                            <span class="text-[10px] font-bold text-gray-400">Classes 1-8</span>
                        </div>
                        <div class="relative">
                            <i class="fas fa-search absolute left-3 top-2.5 text-gray-400 text-xs"></i>
                            <input type="text" id="teacher-search-input" placeholder="Search by name, phone, subject..." 
                                value="${teacherEngine.filterQuery || ''}"
                                oninput="handleTeacherSearch(this.value)" 
                                class="w-full text-xs font-bold pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-600 focus:bg-white transition-all">
                        </div>
                    </div>

                    <!-- Faculty List -->
                    <div id="faculty-list-container" class="space-y-2 overflow-y-auto max-h-[580px] pr-0.5">
                        ${renderFacultyCards(teachers)}
                    </div>
                </div>

                <!-- Panel 2: Teacher Editor / Onboarding Workspace (Desktop Right / Mobile View 2) -->
                <div id="panel-faculty-editor" class="md:col-span-7 mobile-card !p-4 !m-0 ${currentMobileTeacherView === 'roster' ? 'hidden md:block' : 'block'}">
                    <!-- Mobile Back Navigation -->
                    <div class="md:hidden flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
                        <button onclick="switchMobileTeacherView('roster')" class="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1.5 py-1 px-2.5 bg-blue-50 rounded-lg transition-colors">
                            <i class="fas fa-chevron-left text-[10px]"></i>
                            <span>All Faculty</span>
                        </button>
                        <span class="text-xs font-black text-gray-700">${activeTeacher ? 'Edit Profile' : 'New Onboarding'}</span>
                    </div>

                    <!-- Editor Form Container -->
                    <div id="teacher-form-container">
                        ${renderTeacherForm(activeTeacher)}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderFacultyCards(teachers) {
    if (!teachers || teachers.length === 0) {
        return `
            <div class="text-center py-10 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <i class="fas fa-chalkboard-teacher text-3xl mb-2 text-gray-300"></i>
                <p class="text-xs font-bold text-gray-500">No faculty members found</p>
                <p class="text-[10px] text-gray-400 mt-0.5">Click "+ New Faculty" above to onboard</p>
            </div>
        `;
    }

    return teachers.map(t => {
        const isSelected = editingTeacherId === t.id;
        const fullName = `${t.name?.first || ''} ${t.name?.middle || ''} ${t.name?.last || ''}`.replace(/\s+/g, ' ').trim() || 'Faculty Member';
        const photoUrl = t.photo || window.DEFAULT_AVATAR || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2NiZDVlMSI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg==';
        
        let classTeacherBadge = '';
        if (t.classTeacherOf === 'unassigned') {
            classTeacherBadge = `<span class="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-black text-[9px]"><i class="fas fa-clock mr-1"></i>Class Teacher: Pending</span>`;
        } else if (t.classTeacherOf && t.classTeacherOf !== 'none') {
            classTeacherBadge = `<span class="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-black text-[9px]"><i class="fas fa-chalkboard-teacher mr-1"></i>Class ${t.classTeacherOf} Teacher</span>`;
        }

        const classes = Array.isArray(t.assignedClasses) ? t.assignedClasses : [];

        return `
            <div onclick="selectTeacherForEdit('${t.id}')" 
                class="p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${isSelected ? 'bg-blue-50 border-blue-500 shadow-sm' : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-xs'}">
                <div class="w-11 h-11 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                    <img src="${photoUrl}" alt="${fullName}" class="w-full h-full object-cover">
                </div>
                <div class="flex-grow min-w-0">
                    <div class="flex items-center justify-between gap-1">
                        <h4 class="text-xs font-black text-gray-800 truncate">${fullName}</h4>
                        <span class="text-[9px] px-1.5 py-0.5 rounded font-black uppercase bg-emerald-50 text-emerald-700">
                            Active
                        </span>
                    </div>
                    <p class="text-[11px] font-bold text-gray-500 truncate">${t.professionalTitle || 'Faculty Member'}</p>
                    <div class="flex flex-wrap items-center gap-1.5 text-[10px] text-gray-400 mt-1">
                        <span><i class="fas fa-phone-alt mr-1 text-gray-300"></i>${t.phone || 'N/A'}</span>
                        ${classTeacherBadge}
                    </div>
                    ${classes.length > 0 ? `
                        <div class="flex flex-wrap gap-1 mt-1.5">
                            ${classes.map(c => `<span class="text-[8px] bg-gray-100 text-gray-600 font-bold px-1.5 py-0.5 rounded">Cls ${c}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function renderTeacherForm(teacher = null) {
    const isEditing = !!teacher;
    const t = teacher || {
        name: { first: '', middle: '', last: '' },
        phone: '',
        email: '',
        gender: 'unspecified',
        professionalTitle: 'Faculty Member',
        qualification: '',
        experienceYears: '0',
        classTeacherOf: 'unassigned',
        workload: {},
        assignedClasses: [],
        subjects: [],
        photo: ''
    };

    // Initialize in-memory workload from teacher being edited
    if (isEditing && t.workload && Object.keys(t.workload).length > 0) {
        currentFormWorkload = JSON.parse(JSON.stringify(t.workload));
    } else if (isEditing && Array.isArray(t.assignedClasses) && t.assignedClasses.length > 0) {
        currentFormWorkload = {};
        const defaultSubs = Array.isArray(t.subjects) ? t.subjects : [];
        t.assignedClasses.forEach(c => {
            currentFormWorkload[String(c)] = [...defaultSubs];
        });
    } else if (!isEditing && Object.keys(currentFormWorkload).length === 0) {
        currentFormWorkload = {};
    }

    const availableClasses = teacherEngine.classes || [
        { id: '1', name: 'Class 1' },
        { id: '2', name: 'Class 2' },
        { id: '3', name: 'Class 3' },
        { id: '4', name: 'Class 4' },
        { id: '5', name: 'Class 5' },
        { id: '6', name: 'Class 6' },
        { id: '7', name: 'Class 7' },
        { id: '8', name: 'Class 8' }
    ];

    return `
        <div class="space-y-4">
            <!-- Form Title Banner -->
            <div class="flex justify-between items-center pb-2.5 border-b border-gray-100">
                <div>
                    <span class="text-[10px] font-black uppercase text-blue-700 tracking-wider">
                        ${isEditing ? 'Update Faculty Details' : 'Onboard New Faculty'}
                    </span>
                    <h3 class="text-sm font-black text-gray-800">
                        ${isEditing ? `${t.name?.first || ''} ${t.name?.last || ''} (${t.id})` : 'New Faculty Profile'}
                    </h3>
                </div>
                ${isEditing ? `
                    <button onclick="handleDeleteTeacher('${t.id}')" class="text-red-600 hover:text-red-700 text-xs font-bold flex items-center gap-1 p-1 hover:bg-red-50 rounded-lg transition-colors">
                        <i class="fas fa-trash-alt"></i>
                        <span class="hidden sm:inline">Delete</span>
                    </button>
                ` : ''}
            </div>

            <!-- Validation Error Alert Box -->
            <div id="form-error-alert" class="hidden bg-red-50 border border-red-200 text-red-700 p-2.5 rounded-xl text-xs font-bold space-y-1"></div>

            <!-- Section 1: Identity & Contact Information -->
            <div class="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-3">
                <h4 class="text-[10px] font-black uppercase tracking-wider text-gray-600">1. Identity & Contact Information</h4>
                
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                        <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1">First Name *</label>
                        <input type="text" id="t-form-fname" value="${t.name?.first || ''}" placeholder="e.g. Ramesh" 
                            class="w-full text-xs font-bold p-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-600">
                    </div>
                    <div>
                        <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1">Middle Name</label>
                        <input type="text" id="t-form-mname" value="${t.name?.middle || ''}" placeholder="e.g. Bahadur" 
                            class="w-full text-xs font-bold p-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-600">
                    </div>
                    <div>
                        <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1">Last Name *</label>
                        <input type="text" id="t-form-lname" value="${t.name?.last || ''}" placeholder="e.g. Sharma" 
                            class="w-full text-xs font-bold p-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-600">
                    </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                        <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1">Mobile Phone (OTP Login) *</label>
                        <div class="relative">
                            <span class="absolute left-2.5 top-2 text-[10px] font-bold text-gray-400">+977</span>
                            <input type="tel" id="t-form-phone" value="${t.phone || ''}" placeholder="98XXXXXXXX" maxlength="10"
                                class="w-full text-xs font-bold pl-12 pr-2 p-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-600">
                        </div>
                    </div>
                    <div>
                        <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1">Email Address</label>
                        <input type="email" id="t-form-email" value="${t.email && t.email !== 'N/A' ? t.email : ''}" placeholder="faculty@udayashree.edu" 
                            class="w-full text-xs font-bold p-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-600">
                    </div>
                </div>

                <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    <div>
                        <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1">Gender</label>
                        <select id="t-form-gender" class="w-full text-xs font-bold p-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-600">
                            <option value="unspecified" ${t.gender === 'unspecified' ? 'selected' : ''}>Unspecified</option>
                            <option value="male" ${t.gender === 'male' ? 'selected' : ''}>Male</option>
                            <option value="female" ${t.gender === 'female' ? 'selected' : ''}>Female</option>
                            <option value="other" ${t.gender === 'other' ? 'selected' : ''}>Other</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1">Qualification</label>
                        <input type="text" id="t-form-qual" value="${t.qualification || ''}" placeholder="e.g. M.Sc, B.Ed" 
                            class="w-full text-xs font-bold p-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-600">
                    </div>
                    <div>
                        <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1">Experience (Years)</label>
                        <input type="number" id="t-form-exp" value="${t.experienceYears || '0'}" min="0" max="50" 
                            class="w-full text-xs font-bold p-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-600">
                    </div>
                </div>
            </div>

            <!-- Section 2: Professional Role & Class Teacher Assignment -->
            <div class="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-3">
                <h4 class="text-[10px] font-black uppercase tracking-wider text-gray-600">2. Professional Title & Class Teacher Assignment</h4>
                
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                        <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1">Professional Title</label>
                        <input type="text" id="t-form-title" value="${t.professionalTitle || 'Faculty Member'}" placeholder="e.g. Senior Math Teacher, HOD Science" 
                            class="w-full text-xs font-bold p-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-600">
                    </div>
                    <div>
                        <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1">Class Teacher Assignment</label>
                        <select id="t-form-class-teacher-of" class="w-full text-xs font-bold p-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-600">
                            <option value="unassigned" ${t.classTeacherOf === 'unassigned' ? 'selected' : ''}>Unassigned (Pending Review)</option>
                            <option value="none" ${t.classTeacherOf === 'none' ? 'selected' : ''}>None (Subject Teacher Only)</option>
                            ${availableClasses.map(c => `
                                <option value="${c.id}" ${String(t.classTeacherOf) === String(c.id) ? 'selected' : ''}>
                                    ${c.name || `Class ${c.id}`} Class Teacher
                                </option>
                            `).join('')}
                        </select>
                    </div>
                </div>
            </div>

            <!-- Section 3: Teaching Workload & Assigned Subjects (Hierarchical by Class) -->
            <div class="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-3">
                <div class="flex justify-between items-center">
                    <div>
                        <h4 class="text-[10px] font-black uppercase tracking-wider text-gray-600">3. Teaching Workload & Assigned Subjects</h4>
                        <p class="text-[10px] text-gray-400">Select a class to assign its curriculum subjects to this teacher</p>
                    </div>
                    <span id="workload-summary-count" class="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        ${Object.keys(currentFormWorkload).length} Classes Assigned
                    </span>
                </div>

                <!-- Class Selector Tabs -->
                <div>
                    <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1.5">Select Class to Manage Subjects</label>
                    <div class="grid grid-cols-4 sm:grid-cols-8 gap-1.5" id="workload-class-tabs">
                        ${availableClasses.map(c => {
                            const cid = String(c.id);
                            const isSelectedTab = selectedWorkloadClassId === cid;
                            const count = (currentFormWorkload[cid] && currentFormWorkload[cid].length) || 0;
                            return `
                                <button type="button" onclick="selectWorkloadClassTab('${cid}')" 
                                    class="p-2 rounded-lg border text-center transition-all flex flex-col items-center justify-center ${isSelectedTab ? 'bg-blue-700 text-white border-blue-700 shadow-sm' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'}">
                                    <span class="text-[11px] font-black">${c.name || `Cls ${c.id}`}</span>
                                    <span class="text-[9px] mt-0.5 ${isSelectedTab ? 'text-blue-200' : 'text-gray-400'} font-bold">
                                        ${count > 0 ? `${count} subj` : 'none'}
                                    </span>
                                </button>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- Selected Class Subjects Workspace -->
                <div id="class-subjects-workspace" class="bg-white p-3 rounded-xl border border-gray-200 space-y-2">
                    ${renderClassSubjectsWorkspace(selectedWorkloadClassId)}
                </div>

                <!-- Assigned Workload Summary -->
                <div class="space-y-1.5 pt-1">
                    <label class="block text-[9px] font-bold text-gray-400 uppercase">Current Workload Summary</label>
                    <div id="workload-chips-container" class="space-y-1.5 max-h-36 overflow-y-auto pr-0.5">
                        ${renderWorkloadChips()}
                    </div>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center gap-2 pt-2">
                <button onclick="handleSaveTeacher('${isEditing ? t.id : ''}')" class="flex-grow bg-blue-700 hover:bg-blue-800 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all text-xs flex items-center justify-center gap-1.5 active:scale-95">
                    <i class="fas fa-check-circle"></i>
                    <span>${isEditing ? 'Update Faculty Member' : 'Register & Save Faculty'}</span>
                </button>
                <button onclick="handleCancelEdit()" class="bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-2.5 px-4 rounded-xl transition-all text-xs">
                    Reset
                </button>
            </div>
        </div>
    `;
}

// Workload Workspace Rendering
function renderClassSubjectsWorkspace(classId) {
    if (!teacherEngine) return '';
    const cid = String(classId);
    const subjects = teacherEngine.getSubjectsForClass(cid);
    const assignedForClass = currentFormWorkload[cid] || [];

    const classObj = teacherEngine.classes.find(c => String(c.id) === cid);
    const className = classObj ? (classObj.name || `Class ${cid}`) : `Class ${cid}`;

    return `
        <div class="flex justify-between items-center pb-2 border-b border-gray-100">
            <div>
                <span class="text-[9px] font-black uppercase text-blue-700 tracking-wider">Curriculum Subjects</span>
                <h5 class="text-xs font-black text-gray-800">${className}</h5>
            </div>
            <span class="text-[10px] text-gray-400 font-bold">Click subject to toggle assignment</span>
        </div>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            ${subjects.map(s => {
                const isAssigned = assignedForClass.includes(s);
                return `
                    <button type="button" onclick="toggleWorkloadSubject('${cid}', '${s.replace(/'/g, "\\'")}')" 
                        class="p-2 rounded-lg border text-left text-xs font-bold transition-all flex items-center justify-between ${isAssigned ? 'bg-blue-50 border-blue-600 text-blue-800 font-black' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}">
                        <span><i class="fas ${isAssigned ? 'fa-check-circle text-blue-600' : 'fa-circle text-gray-300'} mr-1.5 text-[10px]"></i>${s}</span>
                        <span class="text-[9px] uppercase px-1.5 py-0.5 rounded ${isAssigned ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}">
                            ${isAssigned ? 'Assigned' : 'Add'}
                        </span>
                    </button>
                `;
            }).join('')}
        </div>
    `;
}

function renderWorkloadChips() {
    const classIds = Object.keys(currentFormWorkload).filter(cid => currentFormWorkload[cid] && currentFormWorkload[cid].length > 0);
    
    if (classIds.length === 0) {
        return `<p class="text-[11px] text-gray-400 italic">No classes or subjects assigned yet.</p>`;
    }

    return classIds.map(cid => {
        const classObj = teacherEngine ? teacherEngine.classes.find(c => String(c.id) === cid) : null;
        const className = classObj ? (classObj.name || `Class ${cid}`) : `Class ${cid}`;
        const subs = currentFormWorkload[cid];

        return `
            <div class="bg-white p-2 rounded-lg border border-gray-200 flex flex-wrap items-center gap-1.5">
                <span class="text-[10px] font-black bg-blue-700 text-white px-2 py-0.5 rounded-md mr-1">${className}</span>
                ${subs.map(s => `
                    <span class="inline-flex items-center gap-1 bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
                        <span>${s}</span>
                        <button type="button" onclick="toggleWorkloadSubject('${cid}', '${s.replace(/'/g, "\\'")}')" class="text-blue-500 hover:text-red-600 ml-0.5">
                            <i class="fas fa-times text-[9px]"></i>
                        </button>
                    </span>
                `).join('')}
            </div>
        `;
    }).join('');
}

function selectWorkloadClassTab(classId) {
    selectedWorkloadClassId = String(classId);
    
    // Update tabs UI
    const tabsContainer = document.getElementById('workload-class-tabs');
    if (tabsContainer && teacherEngine) {
        const availableClasses = teacherEngine.classes || [];
        tabsContainer.innerHTML = availableClasses.map(c => {
            const cid = String(c.id);
            const isSelectedTab = selectedWorkloadClassId === cid;
            const count = (currentFormWorkload[cid] && currentFormWorkload[cid].length) || 0;
            return `
                <button type="button" onclick="selectWorkloadClassTab('${cid}')" 
                    class="p-2 rounded-lg border text-center transition-all flex flex-col items-center justify-center ${isSelectedTab ? 'bg-blue-700 text-white border-blue-700 shadow-sm' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'}">
                    <span class="text-[11px] font-black">${c.name || `Cls ${c.id}`}</span>
                    <span class="text-[9px] mt-0.5 ${isSelectedTab ? 'text-blue-200' : 'text-gray-400'} font-bold">
                        ${count > 0 ? `${count} subj` : 'none'}
                    </span>
                </button>
            `;
        }).join('');
    }

    // Update workspace UI
    const workspace = document.getElementById('class-subjects-workspace');
    if (workspace) {
        workspace.innerHTML = renderClassSubjectsWorkspace(selectedWorkloadClassId);
    }
}

function toggleWorkloadSubject(classId, subjectName) {
    const cid = String(classId);
    if (!currentFormWorkload[cid]) {
        currentFormWorkload[cid] = [];
    }

    const idx = currentFormWorkload[cid].indexOf(subjectName);
    if (idx === -1) {
        currentFormWorkload[cid].push(subjectName);
    } else {
        currentFormWorkload[cid].splice(idx, 1);
        if (currentFormWorkload[cid].length === 0) {
            delete currentFormWorkload[cid];
        }
    }

    // Update workspace
    const workspace = document.getElementById('class-subjects-workspace');
    if (workspace) {
        workspace.innerHTML = renderClassSubjectsWorkspace(selectedWorkloadClassId);
    }

    // Update chips
    const chipsContainer = document.getElementById('workload-chips-container');
    if (chipsContainer) {
        chipsContainer.innerHTML = renderWorkloadChips();
    }

    // Update tabs badge
    selectWorkloadClassTab(selectedWorkloadClassId);

    // Update summary count
    const countEl = document.getElementById('workload-summary-count');
    if (countEl) {
        countEl.innerText = `${Object.keys(currentFormWorkload).length} Classes Assigned`;
    }
}

// Event Handlers
function handleTeacherSearch(query) {
    if (!teacherEngine) return;
    teacherEngine.filterQuery = query;
    const teachers = teacherEngine.getFilteredTeachers(query);
    const listEl = document.getElementById('faculty-list-container');
    const countEl = document.getElementById('faculty-count');
    if (listEl) listEl.innerHTML = renderFacultyCards(teachers);
    if (countEl) countEl.innerText = teachers.length;
}

function selectTeacherForEdit(teacherId) {
    editingTeacherId = teacherId;
    currentFormWorkload = {};
    if (window.innerWidth < 768) {
        switchMobileTeacherView('editor');
    } else {
        renderTeacherLayout();
    }
}

function handleOpenNewTeacherForm() {
    editingTeacherId = null;
    currentFormWorkload = {};
    if (window.innerWidth < 768) {
        switchMobileTeacherView('editor');
    } else {
        renderTeacherLayout();
    }
}

function handleCancelEdit() {
    editingTeacherId = null;
    currentFormWorkload = {};
    if (window.innerWidth < 768) {
        switchMobileTeacherView('roster');
    } else {
        renderTeacherLayout();
    }
}

function switchMobileTeacherView(view) {
    currentMobileTeacherView = view;
    renderTeacherLayout();
}

function handleSaveTeacher(teacherId = '') {
    if (!teacherEngine) return;

    const fname = document.getElementById('t-form-fname')?.value.trim() || '';
    const mname = document.getElementById('t-form-mname')?.value.trim() || '';
    const lname = document.getElementById('t-form-lname')?.value.trim() || '';
    const phone = document.getElementById('t-form-phone')?.value.trim() || '';
    const email = document.getElementById('t-form-email')?.value.trim() || '';
    const gender = document.getElementById('t-form-gender')?.value || 'unspecified';
    const qual = document.getElementById('t-form-qual')?.value.trim() || '';
    const exp = document.getElementById('t-form-exp')?.value.trim() || '0';
    const title = document.getElementById('t-form-title')?.value.trim() || 'Faculty Member';
    const classTeacherOf = document.getElementById('t-form-class-teacher-of')?.value || 'unassigned';

    const formData = {
        firstName: fname,
        middleName: mname,
        lastName: lname,
        phone,
        email,
        gender,
        qualification: qual,
        experienceYears: exp,
        professionalTitle: title,
        classTeacherOf,
        workload: currentFormWorkload
    };

    const alertBox = document.getElementById('form-error-alert');

    if (teacherId) {
        // Update existing teacher
        const result = teacherEngine.updateTeacher(teacherId, formData);
        if (!result.success) {
            if (alertBox) {
                alertBox.innerHTML = result.errors.map(e => `<div><i class="fas fa-exclamation-circle mr-1"></i>${e}</div>`).join('');
                alertBox.classList.remove('hidden');
            }
            return;
        }
        showToast("Faculty profile updated successfully", "success");
    } else {
        // Add new teacher
        const result = teacherEngine.addTeacher(formData);
        if (!result.success) {
            if (alertBox) {
                alertBox.innerHTML = result.errors.map(e => `<div><i class="fas fa-exclamation-circle mr-1"></i>${e}</div>`).join('');
                alertBox.classList.remove('hidden');
            }
            return;
        }
        editingTeacherId = result.teacher.id;
        showToast("New faculty member registered successfully", "success");
    }

    if (window.innerWidth < 768) {
        currentMobileTeacherView = 'roster';
    }
    renderTeacherLayout();
}

function handleDeleteTeacher(teacherId) {
    if (!teacherEngine || !teacherId) return;
    const teacher = teacherEngine.getTeacher(teacherId);
    const teacherName = teacher ? `${teacher.name?.first || ''} ${teacher.name?.last || ''}`.trim() : 'this faculty member';

    if (confirm(`Are you sure you want to remove ${teacherName}?`)) {
        teacherEngine.removeTeacher(teacherId);
        editingTeacherId = null;
        currentFormWorkload = {};
        if (window.innerWidth < 768) {
            currentMobileTeacherView = 'roster';
        }
        showToast(`${teacherName} removed`, "info");
        renderTeacherLayout();
    }
}

async function saveAllTeachers() {
    if (!teacherEngine) return;
    const btn = document.getElementById('btn-save-all-teachers');
    if (btn) btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> <span class="hidden sm:inline">Saving...</span>`;

    const res = await teacherEngine.saveToDatabase();
    if (btn) btn.innerHTML = `<i class="fas fa-cloud-upload-alt"></i> <span class="hidden sm:inline">Sync All</span>`;

    if (res && res.success) {
        showToast("All faculty records synchronized and saved", "success");
    } else {
        showToast("Failed to sync faculty records", "error");
    }
}

function handleBackNavigation() {
    if (typeof adminRouter === 'function') {
        adminRouter('dashboard');
    } else {
        window.location.href = 'admin.html';
    }
}

window.initAdminTeachers = initAdminTeachers;
window.selectWorkloadClassTab = selectWorkloadClassTab;
window.toggleWorkloadSubject = toggleWorkloadSubject;