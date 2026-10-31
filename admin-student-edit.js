// admin-student-edit.js - Student Record Editor UI Controller
// High-density, professional student record editor with dynamic class subjects,
// parent login mapping reconciliation, and attached document management.

let studentEditEngine = null;
let currentEditingStudentId = null;
let editFormDocuments = [];

/**
 * Initializes the Student Record Editor in the target container.
 * 
 * @param {string} targetContainerId DOM container ID
 * @param {string} [studentId] Optional target student ID (defaults to URL param 'id' or first student)
 */
async function initStudentEdit(targetContainerId = 'student-edit-container', studentId = null) {
    let container = document.getElementById(targetContainerId);
    if (!container) {
        container = document.getElementById('student-edit-container') || document.getElementById('main-content');
    }
    if (!container) return;

    // Determine target Student ID from arguments or URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const activeId = studentId || urlParams.get('id') || 'US-2083-0001';
    currentEditingStudentId = activeId;

    // Loading State
    container.innerHTML = `
        <div class="flex flex-col items-center justify-center py-16 text-gray-400">
            <i class="fas fa-spinner fa-spin text-3xl text-blue-700 mb-3"></i>
            <p class="text-xs font-bold uppercase tracking-wider text-gray-500">Loading Student Profile for Editing...</p>
        </div>
    `;

    try {
        if (typeof window.StudentEditModule !== 'undefined') {
            studentEditEngine = new window.StudentEditModule();
            await studentEditEngine.loadFromDatabase(activeId);
        } else {
            console.error('StudentEditModule not loaded.');
            container.innerHTML = `
                <div class="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs">
                    <i class="fas fa-exclamation-circle mr-2"></i> StudentEditModule is missing from runtime.
                </div>
            `;
            return;
        }

        // If active student wasn't found by activeId, pick the first student in database
        let student = studentEditEngine.getActiveStudent();
        if (!student && studentEditEngine.existingStudents.length > 0) {
            student = studentEditEngine.existingStudents[0];
            currentEditingStudentId = student.id;
            await studentEditEngine.loadStudent(student.id);
        }

        if (!student) {
            container.innerHTML = `
                <div class="p-8 text-center bg-white rounded-2xl border border-gray-200">
                    <i class="fas fa-user-slash text-3xl text-gray-300 mb-2"></i>
                    <p class="text-xs font-bold text-gray-600">No student record found with ID "${activeId}".</p>
                    <button onclick="handleStudentEditBack()" class="mt-4 px-4 py-2 bg-blue-700 text-white rounded-xl text-xs font-bold hover:bg-blue-800">
                        Back to Student Directory
                    </button>
                </div>
            `;
            return;
        }

        // Initialize document working set
        editFormDocuments = Array.isArray(student.documents) ? JSON.parse(JSON.stringify(student.documents)) : [];

        renderStudentEditForm(container, student);
    } catch (err) {
        console.error('[admin-student-edit] Init error:', err);
        container.innerHTML = `
            <div class="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs">
                <i class="fas fa-exclamation-triangle mr-2"></i> Error initializing editor: ${err.message}
            </div>
        `;
    }
}

/**
 * Renders the complete, high-density student editing form.
 */
function renderStudentEditForm(container, s) {
    const classes = studentEditEngine.getClasses();
    const allStudents = studentEditEngine.existingStudents;
    const nameObj = s.name || {};
    const firstName = nameObj.first || '';
    const middleName = nameObj.middle || '';
    const lastName = nameObj.last || '';
    const currentClass = String(s.class || '1');
    const assignedSubjects = studentEditEngine.getSubjectsForClass(currentClass);
    const currAddr = (s.address && s.address.current) || {};
    const permAddr = (s.address && s.address.permanent) || {};

    container.innerHTML = `
        <div class="max-w-4xl mx-auto space-y-4 pb-20">
            <!-- Header Bar -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200">
                <div class="flex items-center gap-3">
                    <button type="button" onclick="handleStudentEditBack()" class="text-gray-600 hover:text-blue-700 p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center text-sm font-bold" title="Back">
                        <i class="fas fa-arrow-left"></i>
                        <span class="ml-1.5 text-xs">Directory</span>
                    </button>
                    <div>
                        <div class="flex items-center gap-2">
                            <h2 class="text-lg font-black text-gray-800 leading-tight">Edit Student Profile</h2>
                            <span class="text-[11px] font-mono font-black px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200/80">${s.id}</span>
                        </div>
                        <p class="text-[11px] text-gray-400">Update academic allocation, parent login permissions, and student records</p>
                    </div>
                </div>

                <!-- Fast Student Selector Switcher (Harness Preview Mode) -->
                <div class="flex items-center gap-2">
                    <span class="text-[10px] font-bold text-gray-400 uppercase">Switch:</span>
                    <select id="edit-student-switcher" onchange="initStudentEdit('${container.id}', this.value)" class="p-1.5 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-700 outline-none">
                        ${allStudents.map(std => {
                            const nm = std.name ? `${std.name.first} ${std.name.last}` : std.id;
                            return `<option value="${std.id}" ${std.id === s.id ? 'selected' : ''}>${std.id} - ${nm}</option>`;
                        }).join('')}
                    </select>
                </div>
            </div>

            <!-- Form Error Notification Banner -->
            <div id="student-edit-error-box" class="hidden p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700"></div>

            <!-- Main Edit Form -->
            <form id="student-edit-form" onsubmit="handleSaveStudentEdit(event)" class="space-y-4">
                
                <!-- Section 1: Basic Identity & Demographics -->
                <div class="mobile-card !p-4 bg-white space-y-4">
                    <div class="flex items-center gap-2 pb-2 border-b border-gray-100 text-blue-700">
                        <i class="fas fa-id-card text-sm"></i>
                        <h3 class="text-xs font-black uppercase tracking-wider">1. Basic Identification</h3>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">First Name *</label>
                            <input type="text" id="edit-first-name" value="${firstName}" required class="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500">
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Middle Name</label>
                            <input type="text" id="edit-middle-name" value="${middleName}" class="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500">
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Last Name *</label>
                            <input type="text" id="edit-last-name" value="${lastName}" required class="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500">
                        </div>
                    </div>

                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                            <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Gender</label>
                            <select id="edit-gender" class="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="male" ${s.gender === 'male' ? 'selected' : ''}>Male</option>
                                <option value="female" ${s.gender === 'female' ? 'selected' : ''}>Female</option>
                                <option value="other" ${s.gender === 'other' ? 'selected' : ''}>Other</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Birthdate (BS) YYYY-MM-DD</label>
                            <input type="text" id="edit-dob" value="${s.dob || ''}" oninput="handleDobChange(this.value)" placeholder="2074-05-12" class="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500">
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Computed Age</label>
                            <input type="text" id="edit-age" value="${s.age || ''}" class="w-full p-2 bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none">
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Blood Group</label>
                            <select id="edit-blood-group" class="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500">
                                ${['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'].map(bg => `
                                    <option value="${bg}" ${s.bloodGroup === bg ? 'selected' : ''}>${bg}</option>
                                `).join('')}
                            </select>
                        </div>
                    </div>

                    <!-- Profile Photo URL / Avatar -->
                    <div>
                        <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Profile Photo URL</label>
                        <div class="flex items-center gap-3">
                            <img id="edit-photo-preview" src="${s.photo || ''}" alt="Student Photo" class="w-10 h-10 rounded-xl object-cover border border-gray-200 bg-gray-50" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2NiZDVlMSI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg=='">
                            <input type="text" id="edit-photo-url" value="${s.photo || ''}" oninput="document.getElementById('edit-photo-preview').src = this.value" placeholder="/uploads/student.jpg" class="flex-grow p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500">
                        </div>
                    </div>
                </div>

                <!-- Section 2: Academic Class & Curriculum Alignment -->
                <div class="mobile-card !p-4 bg-white space-y-3">
                    <div class="flex items-center gap-2 pb-2 border-b border-gray-100 text-blue-700">
                        <i class="fas fa-graduation-cap text-sm"></i>
                        <h3 class="text-xs font-black uppercase tracking-wider">2. Class Allocation & Curriculum</h3>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Enrolled Class *</label>
                            <select id="edit-class" onchange="handleClassChange(this.value)" class="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                                ${classes.map(c => `
                                    <option value="${c.id}" ${String(c.id) === currentClass ? 'selected' : ''}>Class ${c.id}</option>
                                `).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Internal Roll Number</label>
                            <input type="text" id="edit-roll" value="${s.roll || '01'}" class="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none">
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Enrolled Session</label>
                            <input type="text" id="edit-join-year" value="${s.joinYear || '2083'}" class="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none">
                        </div>
                    </div>

                    <!-- Live Dynamic Curriculum Subjects Preview -->
                    <div>
                        <span class="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Assigned Class Subjects (Auto-Aligned)</span>
                        <div id="edit-subjects-container" class="flex flex-wrap gap-1.5 p-2.5 bg-gray-50 rounded-xl border border-gray-200">
                            ${assignedSubjects.map(sub => `
                                <span class="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-md">
                                    <i class="fas fa-book text-[8px] mr-1"></i>${sub}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <!-- Section 3: Parent Contact & SMS Login Sync -->
                <div class="mobile-card !p-4 bg-white space-y-3">
                    <div class="flex items-center justify-between pb-2 border-b border-gray-100">
                        <div class="flex items-center gap-2 text-blue-700">
                            <i class="fas fa-users-cog text-sm"></i>
                            <h3 class="text-xs font-black uppercase tracking-wider">3. Family & Parent Login Synchronization</h3>
                        </div>
                        <span class="text-[9px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                            <i class="fas fa-shield-alt mr-1"></i> Auto-Synced Login Mappings
                        </span>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Father's Name</label>
                            <input type="text" id="edit-father-name" value="${s.fatherName || ''}" class="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500">
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Mother's Name</label>
                            <input type="text" id="edit-mother-name" value="${s.motherName || ''}" class="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500">
                        </div>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Parent Mobile(s) * (Comma-separated for multiple)</label>
                            <div class="relative">
                                <i class="fas fa-phone-alt absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                                <input type="text" id="edit-phone" value="${s.phone || ''}" required placeholder="9845212500, 9801234567" class="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-blue-800 outline-none focus:ring-2 focus:ring-blue-500">
                            </div>
                            <span class="block text-[9px] text-gray-400 mt-1">Changes automatically update SMS OTP credentials for the parent portal.</span>
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Parent Email</label>
                            <div class="relative">
                                <i class="fas fa-envelope absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                                <input type="email" id="edit-parent-email" value="${s.parentEmail || ''}" placeholder="parent@example.com" class="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Section 4: Residential Address -->
                <div class="mobile-card !p-4 bg-white space-y-3">
                    <div class="flex items-center gap-2 pb-2 border-b border-gray-100 text-blue-700">
                        <i class="fas fa-map-marker-alt text-sm"></i>
                        <h3 class="text-xs font-black uppercase tracking-wider">4. Residential Address</h3>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Street / Ward</label>
                            <input type="text" id="edit-curr-street" value="${currAddr.street || ''}" placeholder="Ward 4, Tole Marg" class="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500">
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">City / Municipality</label>
                            <input type="text" id="edit-curr-city" value="${currAddr.city || ''}" placeholder="Damak" class="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500">
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">District</label>
                            <input type="text" id="edit-curr-district" value="${currAddr.district || ''}" placeholder="Jhapa" class="w-full p-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500">
                        </div>
                    </div>
                </div>

                <!-- Section 5: Verification Documents Roster -->
                <div class="mobile-card !p-4 bg-white space-y-3">
                    <div class="flex items-center justify-between pb-2 border-b border-gray-100">
                        <div class="flex items-center gap-2 text-blue-700">
                            <i class="fas fa-file-contract text-sm"></i>
                            <h3 class="text-xs font-black uppercase tracking-wider">5. Verification Documents Roster</h3>
                        </div>
                        <button type="button" onclick="handleAddDocumentRow()" class="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1">
                            <i class="fas fa-plus text-[9px]"></i> Add Document
                        </button>
                    </div>

                    <div id="edit-documents-list" class="space-y-2">
                        ${renderDocumentsEditorRowsHtml()}
                    </div>
                </div>

                <!-- Action Toolbar -->
                <div class="flex items-center justify-between pt-2">
                    <button type="button" onclick="handleStudentEditBack()" class="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-xl transition-colors">
                        Cancel
                    </button>
                    <button type="submit" id="student-edit-save-btn" class="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2">
                        <i class="fas fa-save text-xs"></i>
                        <span>Save Profile Changes</span>
                    </button>
                </div>
            </form>
        </div>
    `;
}

/**
 * Renders document rows for editing, adding, or deleting files.
 */
function renderDocumentsEditorRowsHtml() {
    if (!editFormDocuments || editFormDocuments.length === 0) {
        return `
            <div class="text-center py-4 bg-gray-50 rounded-xl text-xs text-gray-400 italic">
                No verification documents attached yet. Click "+ Add Document" above to attach a record.
            </div>
        `;
    }

    return editFormDocuments.map((doc, idx) => `
        <div class="p-3 bg-gray-50 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-center gap-2 text-xs">
            <div class="w-full sm:w-1/3">
                <input type="text" placeholder="Document Name" value="${doc.name || ''}" onchange="updateDocumentItem(${idx}, 'name', this.value)" class="w-full p-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800 outline-none">
            </div>
            <div class="w-full sm:w-1/4">
                <select onchange="updateDocumentItem(${idx}, 'type', this.value)" class="w-full p-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 outline-none">
                    <option value="Birth Certificate" ${doc.type === 'Birth Certificate' ? 'selected' : ''}>Birth Certificate</option>
                    <option value="Previous Marksheet" ${doc.type === 'Previous Marksheet' ? 'selected' : ''}>Previous Marksheet</option>
                    <option value="Parent Citizenship" ${doc.type === 'Parent Citizenship' ? 'selected' : ''}>Parent Citizenship</option>
                    <option value="Medical Record" ${doc.type === 'Medical Record' ? 'selected' : ''}>Medical Record</option>
                    <option value="Transfer Certificate" ${doc.type === 'Transfer Certificate' ? 'selected' : ''}>Transfer Certificate</option>
                    <option value="General" ${doc.type === 'General' ? 'selected' : ''}>Other / General</option>
                </select>
            </div>
            <div class="w-full sm:flex-grow">
                <input type="text" placeholder="File URL (e.g. /uploads/file.pdf)" value="${doc.url || ''}" onchange="updateDocumentItem(${idx}, 'url', this.value)" class="w-full p-1.5 bg-white border border-gray-200 rounded-lg text-xs text-blue-700 font-mono outline-none">
            </div>
            <div class="flex items-center gap-1 flex-shrink-0">
                ${doc.url ? `
                    <a href="${doc.url}" target="_blank" class="p-1.5 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors" title="Preview File">
                        <i class="fas fa-eye text-xs"></i>
                    </a>
                ` : ''}
                <button type="button" onclick="handleRemoveDocumentRow(${idx})" class="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Delete Document">
                    <i class="fas fa-trash-alt text-xs"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Handlers
function handleDobChange(val) {
    if (typeof StudentEditModule !== 'undefined') {
        const age = StudentEditModule.calculateAgeFromBS(val);
        const ageInput = document.getElementById('edit-age');
        if (ageInput && age) ageInput.value = age + ' yrs';
    }
}

function handleClassChange(newClass) {
    if (!studentEditEngine) return;
    const subjects = studentEditEngine.getSubjectsForClass(newClass);
    const container = document.getElementById('edit-subjects-container');
    if (container) {
        container.innerHTML = subjects.length > 0 ? subjects.map(sub => `
            <span class="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-md">
                <i class="fas fa-book text-[8px] mr-1"></i>${sub}
            </span>
        `).join('') : '<span class="text-xs text-gray-400 italic">No curriculum subjects registered</span>';
    }
}

function handleAddDocumentRow() {
    editFormDocuments.push({
        id: `doc_${Date.now()}`,
        name: 'New Document',
        type: 'General',
        url: '',
        uploadedAt: Date.now()
    });
    const list = document.getElementById('edit-documents-list');
    if (list) list.innerHTML = renderDocumentsEditorRowsHtml();
}

function handleRemoveDocumentRow(idx) {
    editFormDocuments.splice(idx, 1);
    const list = document.getElementById('edit-documents-list');
    if (list) list.innerHTML = renderDocumentsEditorRowsHtml();
}

function updateDocumentItem(idx, key, val) {
    if (editFormDocuments[idx]) {
        editFormDocuments[idx][key] = val;
    }
}

/**
 * Handles Form Submission and commits updates atomically.
 */
async function handleSaveStudentEdit(e) {
    e.preventDefault();
    const errorBox = document.getElementById('student-edit-error-box');
    const saveBtn = document.getElementById('student-edit-save-btn');

    if (errorBox) {
        errorBox.classList.add('hidden');
        errorBox.innerHTML = '';
    }

    if (!studentEditEngine || !currentEditingStudentId) {
        alert('Editor is not properly initialized.');
        return;
    }

    // Collect Form Data
    const payload = {
        firstName: document.getElementById('edit-first-name')?.value || '',
        middleName: document.getElementById('edit-middle-name')?.value || '',
        lastName: document.getElementById('edit-last-name')?.value || '',
        gender: document.getElementById('edit-gender')?.value || 'unspecified',
        dob: document.getElementById('edit-dob')?.value || '',
        age: document.getElementById('edit-age')?.value || '',
        bloodGroup: document.getElementById('edit-blood-group')?.value || 'Unknown',
        photo: document.getElementById('edit-photo-url')?.value || '',
        class: document.getElementById('edit-class')?.value || '1',
        roll: document.getElementById('edit-roll')?.value || '01',
        joinYear: document.getElementById('edit-join-year')?.value || '2083',
        fatherName: document.getElementById('edit-father-name')?.value || '',
        motherName: document.getElementById('edit-mother-name')?.value || '',
        phone: document.getElementById('edit-phone')?.value || '',
        parentEmail: document.getElementById('edit-parent-email')?.value || '',
        address: {
            current: {
                street: document.getElementById('edit-curr-street')?.value || '',
                city: document.getElementById('edit-curr-city')?.value || '',
                district: document.getElementById('edit-curr-district')?.value || ''
            },
            permanent: {
                street: document.getElementById('edit-curr-street')?.value || '',
                city: document.getElementById('edit-curr-city')?.value || '',
                district: document.getElementById('edit-curr-district')?.value || ''
            }
        },
        documents: editFormDocuments.filter(d => d.url && d.url.trim())
    };

    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin text-xs"></i> Saving...';
    }

    try {
        const result = await studentEditEngine.updateStudent(currentEditingStudentId, payload);

        if (!result.success) {
            if (errorBox) {
                errorBox.innerHTML = `<ul class="list-disc pl-4 space-y-1">${result.errors.map(err => `<li>${err}</li>`).join('')}</ul>`;
                errorBox.classList.remove('hidden');
            }
            if (typeof showToast === 'function') showToast('Validation errors prevented saving.', 'error');
            return;
        }

        // Success Feedback
        let toastMsg = `Profile for ${result.student.name.first} updated successfully!`;
        if (result.loginMappingsChanged) {
            toastMsg += ' (Parent login credentials synchronized)';
        }

        if (typeof showToast === 'function') {
            showToast(toastMsg, 'success');
        } else {
            alert(toastMsg);
        }

        // Re-render form with committed state
        initStudentEdit(document.getElementById('student-edit-container') ? 'student-edit-container' : 'main-content', currentEditingStudentId);

    } catch (err) {
        console.error('Save failed:', err);
        if (errorBox) {
            errorBox.textContent = `Server update failed: ${err.message}`;
            errorBox.classList.remove('hidden');
        }
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fas fa-save text-xs"></i> <span>Save Profile Changes</span>';
        }
    }
}

function handleStudentEditBack() {
    if (typeof adminRouter === 'function') {
        adminRouter('viewStudents');
    } else {
        window.location.href = 'student-view.html';
    }
}

// Global Exports
if (typeof window !== 'undefined') {
    window.initStudentEdit = initStudentEdit;
    window.renderStudentEditForm = renderStudentEditForm;
    window.handleDobChange = handleDobChange;
    window.handleClassChange = handleClassChange;
    window.handleAddDocumentRow = handleAddDocumentRow;
    window.handleRemoveDocumentRow = handleRemoveDocumentRow;
    window.updateDocumentItem = updateDocumentItem;
    window.handleSaveStudentEdit = handleSaveStudentEdit;
    window.handleStudentEditBack = handleStudentEditBack;
}
