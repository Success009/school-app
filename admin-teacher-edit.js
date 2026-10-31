// admin-teacher-edit.js - Faculty Record Editor UI Controller
// High-density, professional faculty record editor with dynamic curriculum workload management,
// class teacher authority assignment, parent/teacher login sync, and document inspector.

let teacherEditEngine = null;
let currentEditingTeacherId = null;
let editTeacherWorkload = {};
let editTeacherDocs = [];

/**
 * Initializes the Faculty Record Editor in the target container.
 * 
 * @param {string} targetContainerId DOM container ID
 * @param {string} [teacherId] Optional target teacher ID (defaults to URL param 'id' or first teacher)
 */
async function initTeacherEdit(targetContainerId = 'teacher-edit-container', teacherId = null) {
    let container = document.getElementById(targetContainerId);
    if (!container) {
        container = document.getElementById('teacher-edit-container') || document.getElementById('main-content');
    }
    if (!container) return;

    // Determine target Teacher ID from arguments or URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const activeId = teacherId || urlParams.get('id') || 'TEA-0218';
    currentEditingTeacherId = activeId;

    // Loading State
    container.innerHTML = `
        <div class="flex flex-col items-center justify-center py-16 text-gray-400">
            <i class="fas fa-spinner fa-spin text-3xl text-blue-700 mb-3"></i>
            <p class="text-xs font-bold uppercase tracking-wider text-gray-500">Loading Faculty Profile for Editing...</p>
        </div>
    `;

    try {
        if (typeof window.TeacherEditModule !== 'undefined') {
            teacherEditEngine = new window.TeacherEditModule();
            await teacherEditEngine.loadFromDatabase(activeId);
        } else {
            console.error('TeacherEditModule not loaded.');
            container.innerHTML = `
                <div class="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs">
                    <i class="fas fa-exclamation-circle mr-2"></i> TeacherEditModule is missing from runtime.
                </div>
            `;
            return;
        }

        // If active teacher wasn't found by activeId, pick the first teacher in database
        let teacher = teacherEditEngine.getActiveTeacher();
        if (!teacher && teacherEditEngine.existingTeachers.length > 0) {
            teacher = teacherEditEngine.existingTeachers[0];
            currentEditingTeacherId = teacher.id;
            await teacherEditEngine.loadTeacher(teacher.id);
        }

        if (!teacher) {
            container.innerHTML = `
                <div class="p-8 text-center bg-white rounded-2xl border border-gray-200">
                    <i class="fas fa-user-slash text-3xl text-gray-300 mb-2"></i>
                    <p class="text-xs font-bold text-gray-600">No faculty record found with ID "${activeId}".</p>
                    <button onclick="handleTeacherEditBack()" class="mt-4 px-4 py-2 bg-blue-700 text-white rounded-xl text-xs font-bold hover:bg-blue-800">
                        Back to Faculty Directory
                    </button>
                </div>
            `;
            return;
        }

        // Initialize state working sets
        editTeacherWorkload = teacher.workload ? JSON.parse(JSON.stringify(teacher.workload)) : {};
        editTeacherDocs = Array.isArray(teacher.documents) ? JSON.parse(JSON.stringify(teacher.documents)) : [];

        renderTeacherEditForm(container, teacher);
    } catch (err) {
        console.error('[admin-teacher-edit] Init error:', err);
        container.innerHTML = `
            <div class="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs">
                <i class="fas fa-exclamation-triangle mr-2"></i> Error initializing editor: ${err.message}
            </div>
        `;
    }
}

/**
 * Renders the faculty profile editing form.
 */
function renderTeacherEditForm(container, t) {
    const classes = teacherEditEngine.getClasses();
    const allTeachers = teacherEditEngine.existingTeachers;
    const nameObj = t.name || {};
    const firstName = nameObj.first || '';
    const middleName = nameObj.middle || '';
    const lastName = nameObj.last || '';
    const classTeacherVal = t.classTeacherOf || 'unassigned';

    container.innerHTML = `
        <div class="max-w-4xl mx-auto space-y-4 pb-20">
            <!-- Header Bar -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200">
                <div class="flex items-center gap-3">
                    
                    <div>
                        <div class="flex items-center gap-2">
                            <h2 class="text-lg font-black text-gray-800 leading-tight">Edit Faculty Profile</h2>
                            <span class="text-[11px] font-mono font-black px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200/80">${t.id}</span>
                        </div>
                        <p class="text-[11px] text-gray-400">Update curriculum workload, class teacher assignments, and staff credentials</p>
                    </div>
                </div>

                <!-- Fast Faculty Selector Switcher (Harness Preview Mode) -->
                <div class="flex items-center gap-2">
                    <span class="text-[10px] font-bold text-gray-400 uppercase">Switch:</span>
                    <select id="edit-teacher-switcher" onchange="initTeacherEdit('${container.id}', this.value)" class="p-1.5 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-700 outline-none">
                        ${allTeachers.map(tch => {
                            const nm = tch.name ? `${tch.name.first} ${tch.name.last}` : tch.id;
                            return `<option value="${tch.id}" ${tch.id === t.id ? 'selected' : ''}>${tch.id} - ${nm}</option>`;
                        }).join('')}
                    </select>
                </div>
            </div>

            <!-- Form Error Notification Banner -->
            <div id="teacher-edit-error-box" class="hidden p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700"></div>

            <!-- Main Edit Form -->
            <form id="teacher-edit-form" onsubmit="handleSaveTeacherEdit(event)" class="space-y-4">
                
                <!-- Section 1: Basic Identity & Role -->
                <div class="mobile-card !p-4 bg-white space-y-4">
                    <div class="flex items-center gap-2 pb-2 border-b border-gray-100 text-blue-700">
                        <i class="fas fa-chalkboard-teacher text-sm"></i>
                        <h3 class="text-xs font-black uppercase tracking-wider">1. Basic Identification & Contact</h3>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">First Name *</label>
                            <input type="text" id="teacher-first-name" value="${firstName}" required class="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500">
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Middle Name</label>
                            <input type="text" id="teacher-middle-name" value="${middleName}" class="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500">
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Last Name *</label>
                            <input type="text" id="teacher-last-name" value="${lastName}" required class="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500">
                        </div>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Mobile Phone * (SMS Login Verified)</label>
                            <div class="relative">
                                <i class="fas fa-phone-alt absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                                <input type="text" id="teacher-phone" value="${t.phone || ''}" required placeholder="9842686121" class="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-blue-800 outline-none focus:ring-2 focus:ring-blue-500">
                            </div>
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Professional Title</label>
                            <input type="text" id="teacher-title" value="${t.professionalTitle || 'Faculty Member'}" placeholder="Senior Math Teacher" class="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500">
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Class Teacher Assignment</label>
                            <select id="teacher-class-teacher-of" class="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="unassigned" ${classTeacherVal === 'unassigned' ? 'selected' : ''}>Unassigned (Pending Review)</option>
                                <option value="none" ${classTeacherVal === 'none' ? 'selected' : ''}>None (Subject Teacher Only)</option>
                                ${classes.map(c => `
                                    <option value="${c.id}" ${String(c.id) === classTeacherVal ? 'selected' : ''}>Class ${c.id} Class Teacher</option>
                                `).join('')}
                            </select>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                            <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Gender</label>
                            <select id="teacher-gender" class="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="male" ${t.gender === 'male' ? 'selected' : ''}>Male</option>
                                <option value="female" ${t.gender === 'female' ? 'selected' : ''}>Female</option>
                                <option value="other" ${t.gender === 'other' ? 'selected' : ''}>Other</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Qualification</label>
                            <input type="text" id="teacher-qualification" value="${t.qualification || ''}" placeholder="M.Sc. Mathematics" class="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500">
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Experience (Years)</label>
                            <input type="text" id="teacher-experience" value="${t.experienceYears || t.experience || '0'}" placeholder="5" class="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500">
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">National ID / Citizenship</label>
                            <input type="text" id="teacher-national-id" value="${t.nationalId || ''}" placeholder="12-01-78-05432" class="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500">
                        </div>
                    </div>

                    <!-- Profile Photo URL / Avatar -->
                    <div>
                        <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Profile Photo URL</label>
                        <div class="flex items-center gap-3">
                            <img id="teacher-photo-preview" src="${t.photo || ''}" alt="Faculty Photo" class="w-10 h-10 rounded-xl object-cover border border-gray-200 bg-gray-50" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2NiZDVlMSI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg=='">
                            <input type="text" id="teacher-photo-url" value="${t.photo || ''}" oninput="document.getElementById('teacher-photo-preview').src = this.value" placeholder="/uploads/teacher.jpg" class="flex-grow p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500">
                        </div>
                    </div>
                </div>

                <!-- Section 2: Dynamic Curriculum Workload Assignment Matrix -->
                <div class="mobile-card !p-4 bg-white space-y-3">
                    <div class="flex items-center justify-between pb-2 border-b border-gray-100">
                        <div class="flex items-center gap-2 text-blue-700">
                            <i class="fas fa-layer-group text-sm"></i>
                            <h3 class="text-xs font-black uppercase tracking-wider">2. Curriculum Workload & Subject Assignment</h3>
                        </div>
                        <div class="flex items-center gap-1.5">
                            <select id="workload-add-class-select" class="p-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 outline-none">
                                ${classes.map(c => `
                                    <option value="${c.id}">Class ${c.id}</option>
                                `).join('')}
                            </select>
                            <button type="button" onclick="handleAddClassWorkload()" class="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1">
                                <i class="fas fa-plus text-[10px]"></i> Assign Class
                            </button>
                        </div>
                    </div>

                    <div id="teacher-workload-container" class="space-y-3">
                        ${renderTeacherWorkloadHtml(classes)}
                    </div>
                </div>

                <!-- Section 3: Verification Documents Roster -->
                <div class="mobile-card !p-4 bg-white space-y-3">
                    <div class="flex items-center justify-between pb-2 border-b border-gray-100">
                        <div class="flex items-center gap-2 text-blue-700">
                            <i class="fas fa-file-contract text-sm"></i>
                            <h3 class="text-xs font-black uppercase tracking-wider">3. Attached Certificates & Verification Documents</h3>
                        </div>
                        <button type="button" onclick="handleAddTeacherDocRow()" class="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1">
                            <i class="fas fa-plus text-[9px]"></i> Add Document
                        </button>
                    </div>

                    <div id="teacher-docs-list" class="space-y-2">
                        ${renderTeacherDocsHtml()}
                    </div>
                </div>

                <!-- Action Toolbar -->
                <div class="flex items-center justify-between pt-2">
                    <button type="button" onclick="handleTeacherEditBack()" class="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-xl transition-colors">
                        Cancel
                    </button>
                    <button type="submit" id="teacher-edit-save-btn" class="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2">
                        <i class="fas fa-save text-xs"></i>
                        <span>Save Faculty Changes</span>
                    </button>
                </div>
                        </form>
        </div>
    `;
}

/**
 * Renders the workload breakdown matrix showing assigned classes and toggleable subject checkboxes.
 */
function renderTeacherWorkloadHtml(classes) {
    const assignedClassIds = Object.keys(editTeacherWorkload);

    if (assignedClassIds.length === 0) {
        return `
            <div class="p-6 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-gray-400 text-xs">
                <i class="fas fa-book-open text-2xl text-gray-300 mb-1"></i>
                <p class="font-bold">No teaching workload assigned yet.</p>
                <p class="text-[10px] mt-0.5">Use "Assign Class" above to configure subjects for this faculty member.</p>
            </div>
        `;
    }

    return assignedClassIds.map(cid => {
        const classObj = classes.find(c => String(c.id) === cid);
        const className = classObj ? (classObj.name || `Class ${cid}`) : `Class ${cid}`;
        const availableSubjects = teacherEditEngine ? teacherEditEngine.getSubjectsForClass(cid) : [];
        const currentSubs = editTeacherWorkload[cid] || [];

        return `
            <div class="p-3 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <span class="px-2.5 py-0.5 rounded-lg bg-blue-100 text-blue-800 text-xs font-black">${className}</span>
                        <span class="text-[10px] font-bold text-gray-400">${currentSubs.length} Subjects Assigned</span>
                    </div>
                    <button type="button" onclick="handleRemoveClassWorkload('${cid}')" class="text-red-500 hover:text-red-700 text-xs font-bold px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">
                        <i class="fas fa-times mr-1"></i> Remove Class
                    </button>
                </div>

                <div class="flex flex-wrap gap-2 pt-1 border-t border-gray-200/50">
                    ${availableSubjects.length > 0 ? availableSubjects.map(sub => {
                        const isChecked = currentSubs.includes(sub);
                        return `
                            <label class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${isChecked ? 'bg-blue-700 text-white shadow-xs' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'}">
                                <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="toggleSubjectAssignment('${cid}', '${sub}', this.checked)" class="hidden">
                                <i class="fas ${isChecked ? 'fa-check-circle' : 'fa-circle text-gray-300'} text-[10px]"></i>
                                <span>${sub}</span>
                            </label>
                        `;
                    }).join('') : '<span class="text-xs text-gray-400 italic">No curriculum subjects registered in database for this class</span>'}
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Renders teacher verification documents list.
 */
function renderTeacherDocsHtml() {
    if (!editTeacherDocs || editTeacherDocs.length === 0) {
        return `
            <div class="text-center py-4 bg-gray-50 rounded-xl text-xs text-gray-400 italic">
                No verification documents attached yet. Click "+ Add Document" above to attach certificates.
            </div>
        `;
    }

    return editTeacherDocs.map((doc, idx) => `
        <div class="p-3 bg-gray-50 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-center gap-2 text-xs">
            <div class="w-full sm:w-1/3">
                <input type="text" placeholder="Document Title" value="${doc.name || ''}" onchange="updateTeacherDocItem(${idx}, 'name', this.value)" class="w-full p-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800 outline-none">
            </div>
            <div class="w-full sm:w-1/4">
                <select onchange="updateTeacherDocItem(${idx}, 'type', this.value)" class="w-full p-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 outline-none">
                    <option value="Academic Degree / Transcript" ${doc.type === 'Academic Degree / Transcript' ? 'selected' : ''}>Academic Degree</option>
                    <option value="National ID / Citizenship" ${doc.type === 'National ID / Citizenship' ? 'selected' : ''}>National ID</option>
                    <option value="Teaching License" ${doc.type === 'Teaching License' ? 'selected' : ''}>Teaching License</option>
                    <option value="Appointment Letter" ${doc.type === 'Appointment Letter' ? 'selected' : ''}>Appointment Letter</option>
                    <option value="Experience Certificate" ${doc.type === 'Experience Certificate' ? 'selected' : ''}>Experience Certificate</option>
                    <option value="General" ${doc.type === 'General' ? 'selected' : ''}>Other Document</option>
                </select>
            </div>
            <div class="w-full sm:flex-grow">
                <input type="text" placeholder="File URL (e.g. /uploads/cert.pdf)" value="${doc.url || ''}" onchange="updateTeacherDocItem(${idx}, 'url', this.value)" class="w-full p-1.5 bg-white border border-gray-200 rounded-lg text-xs text-blue-700 font-mono outline-none">
            </div>
            <div class="flex items-center gap-1 flex-shrink-0">
                ${doc.url ? `
                    <a href="${doc.url}" target="_blank" class="p-1.5 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors" title="Preview File">
                        <i class="fas fa-eye text-xs"></i>
                    </a>
                ` : ''}
                <button type="button" onclick="handleRemoveTeacherDocRow(${idx})" class="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Delete Document">
                    <i class="fas fa-trash-alt text-xs"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Workload Handlers
function handleAddClassWorkload() {
    const select = document.getElementById('workload-add-class-select');
    if (!select) return;
    const cid = select.value;

    if (!editTeacherWorkload[cid]) {
        // Pre-select first available subject if present
        const subs = teacherEditEngine ? teacherEditEngine.getSubjectsForClass(cid) : [];
        editTeacherWorkload[cid] = subs.length > 0 ? [subs[0]] : [];
    }

    const container = document.getElementById('teacher-workload-container');
    if (container && teacherEditEngine) {
        container.innerHTML = renderTeacherWorkloadHtml(teacherEditEngine.getClasses());
    }
}

function handleRemoveClassWorkload(cid) {
    delete editTeacherWorkload[cid];
    const container = document.getElementById('teacher-workload-container');
    if (container && teacherEditEngine) {
        container.innerHTML = renderTeacherWorkloadHtml(teacherEditEngine.getClasses());
    }
}

function toggleSubjectAssignment(cid, subject, isChecked) {
    if (!editTeacherWorkload[cid]) editTeacherWorkload[cid] = [];
    if (isChecked) {
        if (!editTeacherWorkload[cid].includes(subject)) {
            editTeacherWorkload[cid].push(subject);
        }
    } else {
        editTeacherWorkload[cid] = editTeacherWorkload[cid].filter(s => s !== subject);
    }
    const container = document.getElementById('teacher-workload-container');
    if (container && teacherEditEngine) {
        container.innerHTML = renderTeacherWorkloadHtml(teacherEditEngine.getClasses());
    }
}

// Document Handlers
function handleAddTeacherDocRow() {
    editTeacherDocs.push({
        id: `doc_${Date.now()}`,
        name: 'New Certificate',
        type: 'Academic Degree / Transcript',
        url: '',
        uploadedAt: Date.now()
    });
    const list = document.getElementById('teacher-docs-list');
    if (list) list.innerHTML = renderTeacherDocsHtml();
}

function handleRemoveTeacherDocRow(idx) {
    editTeacherDocs.splice(idx, 1);
    const list = document.getElementById('teacher-docs-list');
    if (list) list.innerHTML = renderTeacherDocsHtml();
}

function updateTeacherDocItem(idx, key, val) {
    if (editTeacherDocs[idx]) {
        editTeacherDocs[idx][key] = val;
    }
}

/**
 * Handles Form Submission and commits updates atomically.
 */
async function handleSaveTeacherEdit(e) {
    e.preventDefault();
    const errorBox = document.getElementById('teacher-edit-error-box');
    const saveBtn = document.getElementById('teacher-edit-save-btn');

    if (errorBox) {
        errorBox.classList.add('hidden');
        errorBox.innerHTML = '';
    }

    if (!teacherEditEngine || !currentEditingTeacherId) {
        alert('Teacher editor is not properly initialized.');
        return;
    }

    // Collect Form Data
    const payload = {
        firstName: document.getElementById('teacher-first-name')?.value || '',
        middleName: document.getElementById('teacher-middle-name')?.value || '',
        lastName: document.getElementById('teacher-last-name')?.value || '',
        phone: document.getElementById('teacher-phone')?.value || '',
        professionalTitle: document.getElementById('teacher-title')?.value || 'Faculty Member',
        classTeacherOf: document.getElementById('teacher-class-teacher-of')?.value || 'unassigned',
        gender: document.getElementById('teacher-gender')?.value || 'unspecified',
        qualification: document.getElementById('teacher-qualification')?.value || '',
        experienceYears: document.getElementById('teacher-experience')?.value || '0',
        nationalId: document.getElementById('teacher-national-id')?.value || '',
        photo: document.getElementById('teacher-photo-url')?.value || '',
        workload: editTeacherWorkload,
        documents: editTeacherDocs.filter(d => d.url && d.url.trim())
    };

    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin text-xs"></i> Saving...';
    }

    try {
        const result = await teacherEditEngine.updateTeacher(currentEditingTeacherId, payload);

        if (!result.success) {
            if (errorBox) {
                errorBox.innerHTML = `<ul class="list-disc pl-4 space-y-1">${result.errors.map(err => `<li>${err}</li>`).join('')}</ul>`;
                errorBox.classList.remove('hidden');
            }
            if (typeof showToast === 'function') showToast('Validation errors prevented saving.', 'error');
            return;
        }

        // Success Feedback
        let toastMsg = `Profile for ${result.teacher.name.first} updated successfully!`;
        if (result.loginMappingChanged) {
            toastMsg += ' (Teacher login credentials synchronized)';
        }

        if (typeof showToast === 'function') {
            showToast(toastMsg, 'success');
        } else {
            alert(toastMsg);
        }

        // Re-render form with committed state
        initTeacherEdit(document.getElementById('teacher-edit-container') ? 'teacher-edit-container' : 'main-content', currentEditingTeacherId);

    } catch (err) {
        console.error('Save failed:', err);
        if (errorBox) {
            errorBox.textContent = `Server update failed: ${err.message}`;
            errorBox.classList.remove('hidden');
        }
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fas fa-save text-xs"></i> <span>Save Faculty Changes</span>';
        }
    }
}

function handleTeacherEditBack() {
    if (typeof adminRouter === 'function') {
        adminRouter('viewTeachers');
    } else {
        window.location.href = 'teacher-view.html';
    }
}

// Global Exports
if (typeof window !== 'undefined') {
    window.initTeacherEdit = initTeacherEdit;
    window.renderTeacherEditForm = renderTeacherEditForm;
    window.handleAddClassWorkload = handleAddClassWorkload;
    window.handleRemoveClassWorkload = handleRemoveClassWorkload;
    window.toggleSubjectAssignment = toggleSubjectAssignment;
    window.handleAddTeacherDocRow = handleAddTeacherDocRow;
    window.handleRemoveTeacherDocRow = handleRemoveTeacherDocRow;
    window.updateTeacherDocItem = updateTeacherDocItem;
    window.handleSaveTeacherEdit = handleSaveTeacherEdit;
    window.handleTeacherEditBack = handleTeacherEditBack;
}
