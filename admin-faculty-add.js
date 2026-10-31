// admin-faculty-add.js - Dedicated Faculty Onboarding Controller (Single Responsibility)

let facultyAddEngine = null;
let selectedAddClassId = null;
let currentAddWorkload = {}; // { [classId]: string[] of subject names }
let currentTeacherPhotoUrl = '';
let currentVerificationDocs = []; // Array of { id, name, type, url, size, uploadedAt }

async function initFacultyAdd() {
    const container = document.getElementById('faculty-add-container') || document.getElementById('teacher-engine-container');
    if (!container) return;

    if (!facultyAddEngine) {
        let ModuleClass = window.FacultyAddModule || (typeof FacultyAddModule !== 'undefined' ? FacultyAddModule : null);
        if (!ModuleClass) {
            await new Promise(r => setTimeout(r, 60));
            ModuleClass = window.FacultyAddModule || (typeof FacultyAddModule !== 'undefined' ? FacultyAddModule : null);
        }
        if (ModuleClass) {
            facultyAddEngine = new ModuleClass();
        }

        container.innerHTML = `
            <div class="text-center py-16 text-gray-400">
                <i class="fas fa-spinner fa-spin text-3xl mb-3 text-blue-600"></i>
                <p class="text-xs font-bold uppercase tracking-wider">Loading Curriculum & School Database...</p>
            </div>
        `;

        if (facultyAddEngine && facultyAddEngine.loadFromDatabase) {
            await facultyAddEngine.loadFromDatabase();
        }
    }

    // Default selected class to first available class from database
    const classes = facultyAddEngine ? facultyAddEngine.getClasses() : [];
    if (classes.length > 0 && !selectedAddClassId) {
        selectedAddClassId = String(classes[0].id);
    }

    renderFacultyAddForm();
}

function renderFacultyAddForm() {
    const container = document.getElementById('faculty-add-container') || document.getElementById('teacher-engine-container');
    if (!container || !facultyAddEngine) return;

    const classes = facultyAddEngine.getClasses();

    container.innerHTML = `
        <div class="max-w-3xl mx-auto space-y-5">
            <!-- Title Header (back navigation handled by universal header arrow) -->
            <div class="flex items-center justify-between pb-3 border-b border-gray-200">
                <div class="flex items-center gap-3">
                    <div>
                        <h2 class="text-lg font-black text-gray-800 leading-tight">Onboard Faculty Member</h2>
                        <p class="text-[11px] text-gray-400">Register new teaching faculty and assign dynamic class workloads</p>
                    </div>
                </div>
            </div>

            <!-- Validation Error Alert Box -->
            <div id="form-error-alert" class="hidden bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs font-bold space-y-1"></div>

            <!-- Success Alert Banner -->
            <div id="form-success-banner" class="hidden bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs font-bold flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <i class="fas fa-check-circle text-emerald-600 text-base"></i>
                    <span id="form-success-message">Faculty member registered successfully!</span>
                </div>
                <button onclick="dismissSuccessBanner()" class="text-emerald-600 hover:text-emerald-800 text-xs">
                    <i class="fas fa-times"></i>
                </button>
            </div>

                        <!-- Section 1: Identity & Verification -->
            <div class="mobile-card space-y-3.5">
                <div class="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <span class="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-black">1</span>
                    <h3 class="text-xs font-black uppercase tracking-wider text-gray-700">Identity & Verification Details</h3>
                </div>

                                <!-- Faculty Photo Upload & Real-Time Preview -->
                <div class="flex flex-col sm:flex-row items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <div class="relative group">
                        <img id="preview-teacher-photo" src="${currentTeacherPhotoUrl || (window.DEFAULT_AVATAR || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2NiZDVlMSI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg==')}" 
                            class="w-20 h-20 rounded-full object-cover border-2 border-blue-600 shadow-sm bg-white" alt="Teacher Photo">
                        <button type="button" onclick="document.getElementById('upload-teacher-photo-input').click()" 
                            class="absolute bottom-0 right-0 w-7 h-7 bg-blue-700 text-white rounded-full flex items-center justify-center text-xs hover:bg-blue-800 shadow transition-transform active:scale-90" title="Upload Photo">
                            <i class="fas fa-camera"></i>
                        </button>
                    </div>
                    <div class="space-y-1 text-center sm:text-left flex-grow">
                        <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                            <h4 class="text-xs font-black text-gray-800">Teacher Photo</h4>
                            <span id="photo-status-badge" class="text-[9px] font-bold px-2 py-0.5 rounded-full ${currentTeacherPhotoUrl ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'}">
                                ${currentTeacherPhotoUrl ? 'Photo uploaded' : 'Default photo'}
                            </span>
                        </div>
                        <p class="text-[10px] text-gray-400">Accepted formats: JPG, PNG, WEBP</p>
                        <div class="flex items-center justify-center sm:justify-start gap-2 pt-1">
                            <input type="file" id="upload-teacher-photo-input" accept="image/jpeg,image/png,image/webp" class="hidden" onchange="handlePhotoUpload(event)">
                            <button type="button" onclick="document.getElementById('upload-teacher-photo-input').click()" 
                                class="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-[10px] font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors">
                                <i class="fas fa-upload text-blue-600"></i> Choose Photo
                            </button>
                            <button type="button" id="btn-remove-photo" onclick="removeTeacherPhoto()" 
                                class="px-2.5 py-1.5 text-gray-500 hover:text-red-600 text-[10px] font-bold rounded-lg transition-colors ${currentTeacherPhotoUrl ? '' : 'hidden'}">
                                <i class="fas fa-trash-alt mr-1"></i> Remove
                            </button>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                        <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1">First Name *</label>
                        <input type="text" id="add-fname" placeholder="e.g. Ramesh" 
                            class="w-full text-xs font-bold p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-600 focus:bg-white transition-all">
                    </div>
                    <div>
                        <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1">Middle Name</label>
                        <input type="text" id="add-mname" placeholder="e.g. Bahadur (optional)" 
                            class="w-full text-xs font-bold p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-600 focus:bg-white transition-all">
                    </div>
                    <div>
                        <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1">Last Name *</label>
                        <input type="text" id="add-lname" placeholder="e.g. Sharma" 
                            class="w-full text-xs font-bold p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-600 focus:bg-white transition-all">
                    </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1">Mobile Phone (SMS OTP Login) *</label>
                        <div class="relative">
                            <span class="absolute left-3 top-2.5 text-xs font-bold text-gray-400">+977</span>
                            <input type="tel" id="add-phone" placeholder="98XXXXXXXX" maxlength="10"
                                class="w-full text-xs font-bold pl-14 pr-3 p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-600 focus:bg-white transition-all">
                        </div>
                    </div>
                    <div>
                        <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1">Email Address</label>
                        <input type="email" id="add-email" placeholder="faculty@udayashree.edu" 
                            class="w-full text-xs font-bold p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-600 focus:bg-white transition-all">
                    </div>
                </div>

                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                        <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1">Gender</label>
                        <select id="add-gender" class="w-full text-xs font-bold p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-600 focus:bg-white transition-all">
                            <option value="unspecified">Unspecified</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1">Qualification</label>
                        <input type="text" id="add-qual" placeholder="e.g. M.Sc, B.Ed" 
                            class="w-full text-xs font-bold p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-600 focus:bg-white transition-all">
                    </div>
                    <div>
                        <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1">Experience (Years)</label>
                        <input type="number" id="add-exp" value="0" min="0" max="50" 
                            class="w-full text-xs font-bold p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-600 focus:bg-white transition-all">
                    </div>
                </div>

                                <!-- National ID & Verification Documents (Multiple Document Support) -->
                <div class="space-y-3 pt-2 border-t border-gray-100">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1">National ID / Citizenship No.</label>
                            <div class="relative">
                                <span class="absolute left-3 top-2.5 text-xs text-gray-400"><i class="fas fa-id-card"></i></span>
                                <input type="text" id="add-national-id" placeholder="e.g. 12-01-78-05432 (National ID / Citizenship)" 
                                    class="w-full text-xs font-bold pl-8 pr-3 p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-600 focus:bg-white transition-all">
                            </div>
                        </div>
                        <div>
                            <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1">Document Category to Attach</label>
                            <select id="doc-type-select" class="w-full text-xs font-bold p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-600 focus:bg-white transition-all">
                                <option value="National ID / Citizenship">National ID / Citizenship</option>
                                <option value="Academic Degree / Transcript">Academic Degree / Transcript</option>
                                <option value="Appointment Letter">Appointment Letter</option>
                                <option value="Teaching License">Teaching License</option>
                                <option value="Experience Certificate">Experience Certificate</option>
                                <option value="Other Document">Other Document</option>
                            </select>
                        </div>
                    </div>

                    <!-- Multiple File Upload Controls -->
                    <div>
                        <div class="flex items-center justify-between mb-1.5">
                            <label class="block text-[9px] font-bold text-gray-400 uppercase">Attached Verification Documents</label>
                            <span id="doc-count-badge" class="text-[9px] font-bold ${currentVerificationDocs.length > 0 ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-gray-100 text-gray-600'} px-2 py-0.5 rounded-full">
                                ${currentVerificationDocs.length} Documents Attached
                            </span>
                        </div>
                        
                        <input type="file" id="upload-doc-input" accept="image/*,application/pdf" multiple class="hidden" onchange="handleMultipleDocsUpload(event)">
                        
                        <div class="flex flex-wrap items-center gap-2">
                            <button type="button" onclick="document.getElementById('upload-doc-input').click()" 
                                class="p-2.5 px-3.5 bg-gray-50 border border-dashed border-gray-300 hover:bg-white hover:border-blue-600 text-gray-700 text-xs font-bold rounded-lg transition-all flex items-center gap-2 shadow-xs">
                                <i class="fas fa-file-circle-plus text-blue-600 text-sm"></i>
                                <span id="doc-upload-btn-text">Add / Upload Document(s)</span>
                            </button>
                            <span class="text-[10px] text-gray-400">Upload multiple ID scans, degree certificates, or PDFs.</span>
                        </div>

                        <!-- Dynamic List of Attached Documents -->
                        <div id="attached-docs-list" class="space-y-1.5 mt-2.5">
                            ${renderAttachedDocsList()}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Section 2: Professional Title & Class Teacher Assignment -->
            <div class="mobile-card space-y-3.5">
                <div class="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <span class="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-black">2</span>
                    <h3 class="text-xs font-black uppercase tracking-wider text-gray-700">Role & Class Teacher Authority</h3>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1">Professional Title</label>
                        <input type="text" id="add-title" value="Faculty Member" placeholder="e.g. Senior Math Teacher, HOD Science" 
                            class="w-full text-xs font-bold p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-600 focus:bg-white transition-all">
                    </div>
                    <div>
                        <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1">Class Teacher Assignment</label>
                        <select id="add-class-teacher-of" class="w-full text-xs font-bold p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-600 focus:bg-white transition-all">
                            <option value="unassigned">Unassigned (Pending Review)</option>
                            <option value="none">None (Subject Teacher Only)</option>
                            ${classes.map(c => `
                                <option value="${c.id}">${c.name || `Class ${c.id}`} Class Teacher</option>
                            `).join('')}
                        </select>
                    </div>
                </div>
            </div>

            <!-- Section 3: Dynamic Teaching Workload & Assigned Subjects -->
            <div class="mobile-card space-y-3.5">
                <div class="flex items-center justify-between pb-2 border-b border-gray-100">
                    <div class="flex items-center gap-2">
                        <span class="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-black">3</span>
                        <div>
                            <h3 class="text-xs font-black uppercase tracking-wider text-gray-700">Curriculum Workload & Teaching Authority</h3>
                            <p class="text-[10px] text-gray-400">Select a class from database to assign its configured subjects</p>
                        </div>
                    </div>
                    <span id="add-workload-count" class="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                        ${Object.keys(currentAddWorkload).length} Classes Assigned
                    </span>
                </div>

                ${classes.length === 0 ? `
                    <div class="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <i class="fas fa-layer-group text-2xl mb-2 text-gray-300"></i>
                        <p class="text-xs font-bold text-gray-600">No classes found in database</p>
                        <p class="text-[10px] text-gray-400 mt-0.5">Please add classes in the School Setup module first.</p>
                    </div>
                ` : `
                    <!-- Database Class Tabs -->
                    <div>
                        <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1.5">School Classes (from Database)</label>
                        <div class="grid grid-cols-4 sm:grid-cols-8 gap-1.5" id="add-class-tabs">
                            ${classes.map(c => {
                                const cid = String(c.id);
                                const isSelected = selectedAddClassId === cid;
                                const count = (currentAddWorkload[cid] && currentAddWorkload[cid].length) || 0;
                                return `
                                    <button type="button" onclick="selectAddClassTab('${cid}')" 
                                        class="p-2 rounded-lg border text-center transition-all flex flex-col items-center justify-center ${isSelected ? 'bg-blue-700 text-white border-blue-700 shadow-sm' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}">
                                        <span class="text-[11px] font-black">${c.name || `Cls ${c.id}`}</span>
                                        <span class="text-[9px] mt-0.5 ${isSelected ? 'text-blue-200' : 'text-gray-400'} font-bold">
                                            ${count > 0 ? `${count} subj` : 'none'}
                                        </span>
                                    </button>
                                `;
                            }).join('')}
                        </div>
                    </div>

                    <!-- Dynamic Subjects Workspace -->
                    <div id="add-subjects-workspace" class="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-2">
                        ${renderAddSubjectsWorkspace(selectedAddClassId)}
                    </div>

                    <!-- Live Workload Summary Chips -->
                    <div class="space-y-1.5 pt-1">
                        <label class="block text-[9px] font-bold text-gray-400 uppercase">Assigned Subjects Summary</label>
                        <div id="add-workload-chips" class="space-y-1.5 max-h-40 overflow-y-auto pr-0.5">
                            ${renderAddWorkloadChips()}
                        </div>
                    </div>
                `}
            </div>

            <!-- Submit Registration Actions -->
            <div class="flex items-center gap-3 pt-2">
                <button type="button" onclick="handleRegisterFaculty()" id="btn-submit-faculty" 
                    class="flex-grow bg-blue-700 hover:bg-blue-800 text-white font-black py-3 px-6 rounded-xl shadow-md transition-all text-xs flex items-center justify-center gap-2 active:scale-95">
                    <i class="fas fa-user-check"></i>
                    <span>Register & Onboard Faculty Member</span>
                </button>
                <button type="button" onclick="resetFacultyAddForm()" class="bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-3 px-5 rounded-xl transition-all text-xs">
                    Clear Form
                </button>
            </div>
        </div>
    `;
}

function renderAddSubjectsWorkspace(classId) {
    if (!facultyAddEngine || !classId) return '';
    const cid = String(classId);
    const subjects = facultyAddEngine.getSubjectsForClass(cid);
    const assignedForClass = currentAddWorkload[cid] || [];

    const classObj = facultyAddEngine.getClasses().find(c => String(c.id) === cid);
    const className = classObj ? (classObj.name || `Class ${cid}`) : `Class ${cid}`;

    if (!subjects || subjects.length === 0) {
        return `
            <div class="text-center py-6 text-gray-400">
                <i class="fas fa-book-open text-xl mb-1 text-gray-300"></i>
                <p class="text-xs font-bold text-gray-500">No curriculum subjects configured in database for ${className}</p>
                <p class="text-[10px] text-gray-400 mt-0.5">Subjects can be added via the School Setup module.</p>
            </div>
        `;
    }

    return `
        <div class="flex justify-between items-center pb-2 border-b border-gray-200">
            <div>
                <span class="text-[9px] font-black uppercase text-blue-700 tracking-wider">Database Curriculum</span>
                <h5 class="text-xs font-black text-gray-800">${className} Subjects</h5>
            </div>
            <span class="text-[10px] text-gray-400 font-bold">Tap subject to toggle assignment</span>
        </div>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            ${subjects.map(s => {
                const isAssigned = assignedForClass.includes(s);
                return `
                    <button type="button" onclick="toggleAddWorkloadSubject('${cid}', '${s.replace(/'/g, "\\'")}')" 
                        class="p-2.5 rounded-lg border text-left text-xs font-bold transition-all flex items-center justify-between ${isAssigned ? 'bg-blue-50 border-blue-600 text-blue-800 font-black' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'}">
                        <span><i class="fas ${isAssigned ? 'fa-check-circle text-blue-600' : 'fa-circle text-gray-300'} mr-2 text-[11px]"></i>${s}</span>
                        <span class="text-[9px] uppercase px-1.5 py-0.5 rounded ${isAssigned ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}">
                            ${isAssigned ? 'Assigned' : 'Add'}
                        </span>
                    </button>
                `;
            }).join('')}
        </div>
    `;
}

function renderAddWorkloadChips() {
    const classIds = Object.keys(currentAddWorkload).filter(cid => currentAddWorkload[cid] && currentAddWorkload[cid].length > 0);
    
    if (classIds.length === 0) {
        return `<p class="text-[11px] text-gray-400 italic">No classes or subjects assigned yet.</p>`;
    }

    return classIds.map(cid => {
        const classObj = facultyAddEngine ? facultyAddEngine.getClasses().find(c => String(c.id) === cid) : null;
        const className = classObj ? (classObj.name || `Class ${cid}`) : `Class ${cid}`;
        const subs = currentAddWorkload[cid];

        return `
            <div class="bg-gray-50 p-2.5 rounded-lg border border-gray-200 flex flex-wrap items-center gap-1.5">
                <span class="text-[10px] font-black bg-blue-700 text-white px-2 py-0.5 rounded-md mr-1">${className}</span>
                ${subs.map(s => `
                    <span class="inline-flex items-center gap-1 bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
                        <span>${s}</span>
                        <button type="button" onclick="toggleAddWorkloadSubject('${cid}', '${s.replace(/'/g, "\\'")}')" class="text-blue-500 hover:text-red-600 ml-0.5">
                            <i class="fas fa-times text-[9px]"></i>
                        </button>
                    </span>
                `).join('')}
            </div>
        `;
    }).join('');
}

function selectAddClassTab(classId) {
    selectedAddClassId = String(classId);
    
    // Update tabs UI
    const tabsContainer = document.getElementById('add-class-tabs');
    if (tabsContainer && facultyAddEngine) {
        const classes = facultyAddEngine.getClasses();
        tabsContainer.innerHTML = classes.map(c => {
            const cid = String(c.id);
            const isSelected = selectedAddClassId === cid;
            const count = (currentAddWorkload[cid] && currentAddWorkload[cid].length) || 0;
            return `
                <button type="button" onclick="selectAddClassTab('${cid}')" 
                    class="p-2 rounded-lg border text-center transition-all flex flex-col items-center justify-center ${isSelected ? 'bg-blue-700 text-white border-blue-700 shadow-sm' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}">
                    <span class="text-[11px] font-black">${c.name || `Cls ${c.id}`}</span>
                    <span class="text-[9px] mt-0.5 ${isSelected ? 'text-blue-200' : 'text-gray-400'} font-bold">
                        ${count > 0 ? `${count} subj` : 'none'}
                    </span>
                </button>
            `;
        }).join('') ;
    }

    // Update workspace UI
    const workspace = document.getElementById('add-subjects-workspace');
    if (workspace) {
        workspace.innerHTML = renderAddSubjectsWorkspace(selectedAddClassId);
    }
}

function toggleAddWorkloadSubject(classId, subjectName) {
    const cid = String(classId);
    if (!currentAddWorkload[cid]) {
        currentAddWorkload[cid] = [];
    }

    const idx = currentAddWorkload[cid].indexOf(subjectName);
    if (idx === -1) {
        currentAddWorkload[cid].push(subjectName);
    } else {
        currentAddWorkload[cid].splice(idx, 1);
        if (currentAddWorkload[cid].length === 0) {
            delete currentAddWorkload[cid];
        }
    }

    // Update workspace
    const workspace = document.getElementById('add-subjects-workspace');
    if (workspace) {
        workspace.innerHTML = renderAddSubjectsWorkspace(selectedAddClassId);
    }

    // Update chips
    const chipsContainer = document.getElementById('add-workload-chips');
    if (chipsContainer) {
        chipsContainer.innerHTML = renderAddWorkloadChips();
    }

    // Update tabs badge
    selectAddClassTab(selectedAddClassId);

    // Update summary count
    const countEl = document.getElementById('add-workload-count');
    if (countEl) {
        countEl.innerText = `${Object.keys(currentAddWorkload).length} Classes Assigned`;
    }
}

// Profile Picture Compression Service (Canvas-based)
async function compressProfileImage(file, maxDimension = 400, quality = 0.8) {
    if (!file || !file.type.startsWith('image/')) return file;
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxDimension) {
                        height = Math.round((height * maxDimension) / width);
                        width = maxDimension;
                    }
                } else {
                    if (height > maxDimension) {
                        width = Math.round((width * maxDimension) / height);
                        height = maxDimension;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    if (blob) {
                        const cleanName = (file.name.replace(/\.[^/.]+$/, "") || "portrait") + ".jpg";
                        resolve(new File([blob], cleanName, { type: 'image/jpeg' }));
                    } else {
                        resolve(file);
                    }
                }, 'image/jpeg', quality);
            };
            img.onerror = () => resolve(file);
            img.src = e.target.result;
        };
        reader.onerror = () => resolve(file);
        reader.readAsDataURL(file);
    });
}

// File & Document Upload Services
async function uploadFileViaApi(file) {
    const formData = new FormData();
    formData.append('file', file);
    const resp = await fetch('/api/upload', {
        method: 'POST',
        body: formData
    });
    if (!resp.ok) {
        throw new Error(`Upload failed (${resp.status}): ${resp.statusText}`);
    }
    const data = await resp.json();
    if (!data.success || !data.url) {
        throw new Error(data.error || 'Server upload failed');
    }
    return data.url;
}

async function handlePhotoUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    // Immediate zero-latency local image preview
    const previewEl = document.getElementById('preview-teacher-photo');
    if (previewEl) {
        previewEl.src = URL.createObjectURL(file);
    }
        const badge = document.getElementById('photo-status-badge');
    if (badge) {
        badge.className = 'text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800';
        badge.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Uploading...';
    }

    try {
        // Transparent client compression (max 400x400 at 0.8 quality)
        const compressedFile = await compressProfileImage(file, 400, 0.8);
        const url = await uploadFileViaApi(compressedFile);
        currentTeacherPhotoUrl = url;
        if (badge) {
            badge.className = 'text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800';
            badge.innerHTML = `<i class="fas fa-check-circle mr-1"></i> Photo uploaded`;
        }
        const removeBtn = document.getElementById('btn-remove-photo');
        if (removeBtn) removeBtn.classList.remove('hidden');
        if (typeof showToast === 'function') showToast("Photo uploaded", "success");
    } catch (e) {
        console.error("Photo upload error:", e);
        if (typeof showToast === 'function') showToast("Photo upload failed: " + e.message, "error");
        if (badge) {
            badge.className = 'text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800';
            badge.innerText = 'Upload failed';
        }
    }
}

function removeTeacherPhoto() {
    currentTeacherPhotoUrl = '';
    const def = window.DEFAULT_AVATAR || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2NiZDVlMSI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg==';
    const previewEl = document.getElementById('preview-teacher-photo');
    if (previewEl) previewEl.src = def;
    const badge = document.getElementById('photo-status-badge');
    if (badge) {
        badge.className = 'text-[9px] font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600';
        badge.innerText = 'Default photo';
    }
    const removeBtn = document.getElementById('btn-remove-photo');
    if (removeBtn) removeBtn.classList.add('hidden');
    const input = document.getElementById('upload-teacher-photo-input');
    if (input) input.value = '';
}

// Multiple Documents Management
function renderAttachedDocsList() {
    if (!currentVerificationDocs || currentVerificationDocs.length === 0) {
        return `
            <div class="text-center py-4 bg-gray-50/70 border border-dashed border-gray-200 rounded-lg text-gray-400">
                <p class="text-[11px] font-bold text-gray-500">No documents attached yet</p>
                <p class="text-[9px] text-gray-400 mt-0.5">Attach citizenship scans, transcripts, licenses, or certificates.</p>
            </div>
        `;
    }

    return currentVerificationDocs.map((doc) => {
        const isPdf = doc.name && doc.name.toLowerCase().endsWith('.pdf');
        const iconClass = isPdf ? 'fa-file-pdf text-red-500' : 'fa-file-image text-blue-500';
        const formattedSize = doc.size ? `${Math.round(doc.size / 1024)} KB` : '';

        return `
            <div class="flex items-center justify-between p-2.5 bg-white border border-gray-200 rounded-lg shadow-xs hover:border-gray-300 transition-colors">
                <div class="flex items-center gap-2.5 min-w-0 pr-2">
                    <div class="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-sm flex-shrink-0">
                        <i class="fas ${iconClass}"></i>
                    </div>
                    <div class="min-w-0">
                        <div class="flex items-center gap-1.5 flex-wrap">
                            <span class="text-xs font-black text-gray-800 truncate">${doc.name}</span>
                            <span class="text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.2 rounded-md">${doc.type}</span>
                        </div>
                        <p class="text-[10px] text-gray-400">
                            ${formattedSize ? `${formattedSize} • ` : ''}Attached
                        </p>
                    </div>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                    <a href="${doc.url}" target="_blank" class="px-2.5 py-1 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 text-gray-600 text-[10px] font-bold rounded border border-gray-200 transition-colors flex items-center gap-1" title="View Document">
                        <i class="fas fa-external-link-alt text-[9px]"></i>
                        <span>View</span>
                    </a>
                    <button type="button" onclick="removeAttachedDocument('${doc.id}')" class="text-gray-400 hover:text-red-600 p-1.5 rounded transition-colors text-xs" title="Remove Document">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

async function handleMultipleDocsUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const btnText = document.getElementById('doc-upload-btn-text');
    const selectedType = document.getElementById('doc-type-select')?.value || 'General Document';

    if (btnText) btnText.innerHTML = `<i class="fas fa-spinner fa-spin text-blue-600 mr-1"></i> Uploading...`;

    let uploadCount = 0;
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
            const url = await uploadFileViaApi(file);
            currentVerificationDocs.push({
                id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                name: file.name,
                type: selectedType,
                url: url,
                size: file.size,
                uploadedAt: Date.now()
            });
            uploadCount++;
        } catch (e) {
            console.error("Document upload failed for " + file.name, e);
            if (typeof showToast === 'function') showToast(`Failed to upload ${file.name}: ${e.message}`, "error");
        }
    }

    if (btnText) btnText.innerText = 'Attach Document';
    
    // Clear input so same file can be selected again
    event.target.value = '';

    // Re-render UI list and badge
    updateAttachedDocsUI();

    if (uploadCount > 0 && typeof showToast === 'function') {
        showToast(uploadCount === 1 ? "Document attached" : `${uploadCount} documents attached`, "success");
    }
}

function removeAttachedDocument(docId) {
    currentVerificationDocs = currentVerificationDocs.filter(d => d.id !== docId);
    updateAttachedDocsUI();
}

function updateAttachedDocsUI() {
    const listEl = document.getElementById('attached-docs-list');
    if (listEl) {
        listEl.innerHTML = renderAttachedDocsList();
    }
    const badge = document.getElementById('doc-count-badge');
    if (badge) {
        badge.innerText = `${currentVerificationDocs.length} Documents Attached`;
        badge.className = `text-[9px] font-bold px-2 py-0.5 rounded-full ${currentVerificationDocs.length > 0 ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-gray-100 text-gray-600'}`;
    }
}

async function handleRegisterFaculty() {
    if (!facultyAddEngine) return;

    const fname = document.getElementById('add-fname')?.value.trim() || '';
    const mname = document.getElementById('add-mname')?.value.trim() || '';
    const lname = document.getElementById('add-lname')?.value.trim() || '';
    const phone = document.getElementById('add-phone')?.value.trim() || '';
    const email = document.getElementById('add-email')?.value.trim() || '';
    const gender = document.getElementById('add-gender')?.value || 'unspecified';
    const qual = document.getElementById('add-qual')?.value.trim() || '';
    const exp = document.getElementById('add-exp')?.value.trim() || '0';
    const title = document.getElementById('add-title')?.value.trim() || 'Faculty Member';
    const classTeacherOf = document.getElementById('add-class-teacher-of')?.value || 'unassigned';
    const nationalId = document.getElementById('add-national-id')?.value.trim() || '';
    const photo = currentTeacherPhotoUrl || (window.DEFAULT_AVATAR || undefined);
    const verificationDoc = currentVerificationDocs.length > 0 ? currentVerificationDocs[0].url : null;

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
        nationalId,
        documents: currentVerificationDocs,
        verificationDoc,
        photo,
        classTeacherOf,
        workload: currentAddWorkload
    };

    const alertBox = document.getElementById('form-error-alert');
    const submitBtn = document.getElementById('btn-submit-faculty');
    if (alertBox) alertBox.classList.add('hidden');

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin mr-1"></i> Registering Faculty...`;
    }

    const result = await facultyAddEngine.registerTeacher(formData);

    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="fas fa-user-check mr-1"></i> Register & Onboard Faculty Member`;
    }

    if (!result.success) {
        if (alertBox) {
            alertBox.innerHTML = result.errors.map(e => `<div><i class="fas fa-exclamation-circle mr-1"></i>${e}</div>`).join('');
            alertBox.classList.remove('hidden');
        }
        return;
    }

        // Success
    showToast(`Teacher registered: ${result.teacher.name.first} ${result.teacher.name.last}`, "success");

    const successBanner = document.getElementById('form-success-banner');
    const successMsg = document.getElementById('form-success-message');
    if (successBanner && successMsg) {
        successMsg.innerText = `Teacher ${result.teacher.name.first} ${result.teacher.name.last} registered successfully (ID: ${result.teacher.id})`;
        successBanner.classList.remove('hidden');
    }

    // Clear form inputs
    resetFacultyAddForm(false);
}

function resetFacultyAddForm(clearBanner = true) {
    if (document.getElementById('add-fname')) document.getElementById('add-fname').value = '';
    if (document.getElementById('add-mname')) document.getElementById('add-mname').value = '';
    if (document.getElementById('add-lname')) document.getElementById('add-lname').value = '';
    if (document.getElementById('add-phone')) document.getElementById('add-phone').value = '';
    if (document.getElementById('add-email')) document.getElementById('add-email').value = '';
    if (document.getElementById('add-qual')) document.getElementById('add-qual').value = '';
    if (document.getElementById('add-exp')) document.getElementById('add-exp').value = '0';
    if (document.getElementById('add-title')) document.getElementById('add-title').value = 'Faculty Member';
    if (document.getElementById('add-class-teacher-of')) document.getElementById('add-class-teacher-of').value = 'unassigned';
    if (document.getElementById('add-national-id')) document.getElementById('add-national-id').value = '';

    removeTeacherPhoto();
    currentVerificationDocs = [];
    updateAttachedDocsUI();

    currentAddWorkload = {};
    if (clearBanner) {
        dismissSuccessBanner();
    }
    const alertBox = document.getElementById('form-error-alert');
    if (alertBox) alertBox.classList.add('hidden');

    // Re-render workload workspace and chips
    if (selectedAddClassId) {
        selectAddClassTab(selectedAddClassId);
    }
    const chipsContainer = document.getElementById('add-workload-chips');
    if (chipsContainer) {
        chipsContainer.innerHTML = renderAddWorkloadChips();
    }
    const countEl = document.getElementById('add-workload-count');
    if (countEl) {
        countEl.innerText = `0 Classes Assigned`;
    }
}

function dismissSuccessBanner() {
    const successBanner = document.getElementById('form-success-banner');
    if (successBanner) successBanner.classList.add('hidden');
}

function handleBackNavigation() {
    if (typeof adminRouter === 'function') {
        adminRouter('dashboard');
    } else {
        window.location.href = 'admin.html';
    }
}

window.initFacultyAdd = initFacultyAdd;
window.selectAddClassTab = selectAddClassTab;
window.toggleAddWorkloadSubject = toggleAddWorkloadSubject;
window.handleRegisterFaculty = handleRegisterFaculty;
window.resetFacultyAddForm = resetFacultyAddForm;
window.dismissSuccessBanner = dismissSuccessBanner;
window.handlePhotoUpload = handlePhotoUpload;
window.removeTeacherPhoto = removeTeacherPhoto;
window.handleMultipleDocsUpload = handleMultipleDocsUpload;
window.removeAttachedDocument = removeAttachedDocument;
window.compressProfileImage = compressProfileImage;