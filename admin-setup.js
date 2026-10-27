// admin-setup.js - Core School Setup & Curriculum Module (Desktop Administration)

let setupEngine = null;

async function initAdminSetup() {
    const container = document.getElementById('setup-engine-container');
    if (!container) return;

    if (!setupEngine) {
        let ModuleClass = window.SetupModule || (typeof SetupModule !== 'undefined' ? SetupModule : null);
        if (!ModuleClass) {
            await new Promise(r => setTimeout(r, 60));
            ModuleClass = window.SetupModule || (typeof SetupModule !== 'undefined' ? SetupModule : null);
        }
        if (ModuleClass) {
            setupEngine = new ModuleClass();
        }
        container.innerHTML = `
            <div class="text-center py-12 text-gray-400">
                <i class="fas fa-spinner fa-spin text-2xl mb-2 text-blue-600"></i>
                <p class="text-xs font-bold uppercase tracking-wider">Loading Configuration...</p>
            </div>
        `;
        if (setupEngine && setupEngine.loadFromDatabase) {
            await setupEngine.loadFromDatabase();
        }
    }

    renderInitialLayout();
}

function renderInitialLayout() {
    const container = document.getElementById('setup-engine-container');
    if (!container || !setupEngine) return;

    container.innerHTML = `
        <div class="space-y-4 max-w-6xl mx-auto">
            <!-- Top Action Header (Inside App View) -->
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-gray-200 gap-3">
                <div class="flex items-center gap-3">
                    <button onclick="handleBackNavigation()" class="text-xs font-bold text-gray-600 hover:text-blue-700 bg-white border border-gray-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm">
                        <i class="fas fa-arrow-left"></i>
                        <span>Back to Dashboard</span>
                    </button>
                    <div>
                        <h2 class="text-base font-black text-gray-800">Classes & Curriculum Setup</h2>
                        <p class="text-[11px] text-gray-400">Manage school grades and compulsory subjects</p>
                    </div>
                </div>

                <button onclick="saveSetupConfig()" id="btn-save-setup" class="bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-sm transition-all flex items-center gap-2 active:scale-95">
                    <i class="fas fa-check-circle"></i>
                    <span>Save Changes</span>
                </button>
            </div>

            <!-- Two-Column Desktop Layout -->
            <div class="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                <!-- Left Column: Classes Master List (4 Cols) -->
                <div class="md:col-span-4 mobile-card !p-4 !m-0">
                    <div class="flex justify-between items-center mb-3">
                        <h3 class="text-xs font-black uppercase tracking-wider text-gray-700">
                            Active Classes (<span id="classes-count">${setupEngine.classes.length}</span>)
                        </h3>
                    </div>

                    <!-- Inline Add Class Form -->
                    <div class="flex gap-2 mb-3">
                        <input type="text" id="new-class-input" placeholder="e.g. Nursery, Class 9" class="w-full text-xs font-bold p-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-600 focus:bg-white transition-all">
                        <button onclick="handleAddNewClass()" class="bg-blue-700 hover:bg-blue-800 text-white px-3 py-2 rounded-lg text-xs font-bold transition-all shrink-0">
                            <i class="fas fa-plus"></i> Add
                        </button>
                    </div>

                    <!-- Classes List -->
                    <div id="classes-list-container" class="space-y-1.5 overflow-y-auto max-h-[500px] pr-0.5"></div>
                </div>

                <!-- Right Column: Subjects & Publications for Active Class (8 Cols) -->
                <div class="md:col-span-8 mobile-card !p-4 !m-0">
                    <div class="flex justify-between items-center pb-3 border-b border-gray-100 mb-4">
                        <div>
                            <span class="text-[10px] font-black uppercase text-blue-700 tracking-wider">Curriculum Manager</span>
                            <h3 id="active-class-title" class="text-base font-black text-gray-800">Class Subjects</h3>
                        </div>
                    </div>

                    <!-- Inline Add Subject Form -->
                    <div class="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4">
                        <div class="text-[10px] font-black uppercase tracking-wider text-gray-600 mb-2">Add Compulsory Subject</div>
                        <div class="grid grid-cols-1 sm:grid-cols-12 gap-2 mb-2">
                            <div class="sm:col-span-7">
                                <input type="text" id="new-sub-name" placeholder="Subject Name (e.g. Mathematics)" class="w-full text-xs font-bold p-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-600">
                            </div>
                            <div class="sm:col-span-5">
                                <input type="text" id="new-sub-pub" placeholder="Book / Publisher (optional)" class="w-full text-xs font-bold p-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-blue-600">
                            </div>
                        </div>
                        <button onclick="handleAddNewSubject()" class="w-full bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-lg text-xs font-bold transition-all">
                            <i class="fas fa-plus mr-1"></i> Add Subject
                        </button>
                    </div>

                    <!-- Subjects List -->
                    <div id="subjects-list-container" class="space-y-2 overflow-y-auto max-h-[420px] pr-0.5"></div>
                </div>
            </div>
        </div>
    `;

    renderClassesList();
    renderSubjectsList();
}

function renderClassesList() {
    const listContainer = document.getElementById('classes-list-container');
    const countEl = document.getElementById('classes-count');
    if (!listContainer || !setupEngine) return;

    if (countEl) countEl.textContent = setupEngine.classes.length;

    if (setupEngine.classes.length === 0) {
        listContainer.innerHTML = `<div class="text-center py-8 text-gray-400 text-xs italic">No classes configured.</div>`;
        return;
    }

    listContainer.innerHTML = setupEngine.classes.map(c => {
        const isActive = setupEngine.activeClassId === c.id;
        const subCount = setupEngine.getSubjectsForClass(c.id).length;
        return `
            <div onclick="selectSetupClass('${c.id}')" class="p-2.5 rounded-lg cursor-pointer border transition-all flex items-center justify-between ${isActive ? 'bg-blue-50 border-blue-600 text-blue-800 font-bold' : 'bg-gray-50 border-gray-100 text-gray-700 hover:bg-gray-100'}">
                <div class="flex items-center gap-2">
                    <span class="w-1.5 h-1.5 rounded-full ${isActive ? 'bg-blue-700' : 'bg-gray-300'}"></span>
                    <span class="text-xs">${c.name}</span>
                </div>
                <div class="flex items-center gap-1.5">
                    <span class="text-[10px] px-2 py-0.5 rounded-full ${isActive ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-600'} font-bold">
                        ${subCount} subs
                    </span>
                    <button onclick="event.stopPropagation(); handleRemoveClass('${c.id}')" class="text-gray-400 hover:text-red-600 p-1 text-xs transition-colors" title="Delete Class">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function renderSubjectsList() {
    const subjectsContainer = document.getElementById('subjects-list-container');
    const titleEl = document.getElementById('active-class-title');
    if (!subjectsContainer || !setupEngine) return;

    const currentClass = setupEngine.classes.find(c => c.id === setupEngine.activeClassId);
    if (!currentClass) {
        if (titleEl) titleEl.textContent = "Class Subjects";
        subjectsContainer.innerHTML = `<div class="text-center py-10 text-gray-400 text-xs italic">Select or add a class first.</div>`;
        return;
    }

    if (titleEl) {
        titleEl.textContent = `${currentClass.name} - Compulsory Subjects`;
    }

    const subjects = setupEngine.getSubjectsForClass(currentClass.id);
    if (subjects.length === 0) {
        subjectsContainer.innerHTML = `
            <div class="text-center py-12 text-gray-400 border border-dashed border-gray-200 rounded-xl p-6">
                <i class="fas fa-book-open text-2xl text-gray-300 mb-2"></i>
                <p class="text-xs font-bold text-gray-600">No compulsory subjects configured for ${currentClass.name}</p>
                <p class="text-[11px] text-gray-400 mt-0.5">Use the form above to add subjects for this class.</p>
            </div>
        `;
        return;
    }

    subjectsContainer.innerHTML = subjects.map(s => `
        <div class="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
            <div>
                <div class="flex items-center gap-2">
                    <span class="text-xs font-bold text-gray-800">${s.name}</span>
                    <span class="text-[9px] font-black px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 uppercase">Compulsory</span>
                </div>
                ${s.publisher ? `<p class="text-[10px] text-gray-500 mt-0.5"><i class="fas fa-book text-gray-400 mr-1"></i>${s.publisher}</p>` : ''}
            </div>
            <button onclick="handleRemoveSubject('${currentClass.id}', '${s.id}')" class="text-gray-400 hover:text-red-600 p-1.5 transition-colors text-xs" title="Remove Subject">
                <i class="fas fa-times-circle"></i>
            </button>
        </div>
    `).join('');
}

function selectSetupClass(classId) {
    if (!setupEngine || setupEngine.activeClassId === classId) return;
    setupEngine.activeClassId = classId;
    renderClassesList();
    renderSubjectsList();
}

function handleAddNewClass() {
    const input = document.getElementById('new-class-input');
    if (!input || !setupEngine) return;
    const name = input.value.trim();
    if (!name) {
        notifyUser("Please enter a class name (e.g. Nursery, Class 9)", "error");
        return;
    }
    const added = setupEngine.addClass(name);
    if (!added) {
        notifyUser("Class name is invalid or already exists", "error");
        return;
    }
    input.value = '';
    setupEngine.activeClassId = added.id;
    renderClassesList();
    renderSubjectsList();
    notifyUser(`Class ${name} added!`, "success");
}

function handleRemoveClass(classId) {
    if (!setupEngine) return;
    const target = setupEngine.classes.find(c => c.id === classId);
    const label = target ? target.name : 'this class';
    if (!confirm(`Are you sure you want to delete ${label} and its subject curriculum?`)) return;

    setupEngine.removeClass(classId);
    renderClassesList();
    renderSubjectsList();
    notifyUser(`${label} removed`, "info");
}

function handleAddNewSubject() {
    if (!setupEngine || !setupEngine.activeClassId) {
        notifyUser("Select a class first", "error");
        return;
    }
    const nameInput = document.getElementById('new-sub-name');
    const pubInput = document.getElementById('new-sub-pub');
    if (!nameInput) return;

    const name = nameInput.value.trim();
    const pub = pubInput ? pubInput.value.trim() : '';

    if (!name) {
        notifyUser("Subject name is required!", "error");
        return;
    }

    const added = setupEngine.addSubject(setupEngine.activeClassId, name, pub);
    if (!added) {
        notifyUser(`Subject "${name}" already exists in this class`, "error");
        return;
    }

    nameInput.value = '';
    if (pubInput) pubInput.value = '';
    nameInput.focus();

    renderClassesList();
    renderSubjectsList();
    notifyUser(`Subject "${name}" added!`, "success");
}

function handleRemoveSubject(classId, subjectId) {
    if (!setupEngine) return;
    setupEngine.removeSubject(classId, subjectId);
    renderClassesList();
    renderSubjectsList();
    notifyUser("Subject removed", "info");
}

async function saveSetupConfig() {
    if (!setupEngine) return;
    const btn = document.getElementById('btn-save-setup');
    const originalText = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<i class="fas fa-spinner fa-spin mr-1"></i> Saving...`;
    }

    try {
        await setupEngine.saveToDatabase();
        notifyUser("School classes and subjects saved successfully!", "success");
    } catch (e) {
        notifyUser("Failed to save: " + e.message, "error");
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }
}

function handleBackNavigation() {
    if (typeof adminRouter === 'function') {
        adminRouter('dashboard');
    } else {
        window.location.href = 'admin.html';
    }
}

function notifyUser(msg, type = 'info') {
    if (typeof showToast === 'function') {
        showToast(msg, type);
    } else {
        alert(msg);
    }
}
