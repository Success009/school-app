// admin-setup.js - High-Density, Modular School Setup Interface (Desktop & Mobile Responsive)

let setupEngine = null;

async function initAdminSetup() {
    const container = document.getElementById('setup-engine-container');
    if (!container) return;

        // Initialize or load existing setup data
    if (!setupEngine) {
        const ModuleClass = window.SetupModule || SetupModule;
        setupEngine = new ModuleClass();
        container.innerHTML = `<div class="p-12 text-center text-gray-400"><i class="fas fa-spinner fa-spin text-2xl mb-3"></i><p class="text-xs font-bold uppercase">Loading School Structure...</p></div>`;
        await setupEngine.loadFromDatabase();
    }

    renderSetupUI();
}

function renderSetupUI() {
    const container = document.getElementById('setup-engine-container');
    if (!container || !setupEngine) return;

    const currentClass = setupEngine.classes.find(c => c.id === setupEngine.activeClassId) || setupEngine.classes[0];
    if (currentClass && !setupEngine.activeClassId) setupEngine.activeClassId = currentClass.id;

    const subjects = setupEngine.activeClassId ? setupEngine.getSubjectsForClass(setupEngine.activeClassId) : [];

    container.innerHTML = `
        <div class="space-y-6 animate-fade-in max-w-5xl mx-auto">
            <!-- Header Summary Card -->
            <div class="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <span class="px-2.5 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest text-blue-100">Step 1 of 4: School Foundations</span>
                    <h2 class="text-xl md:text-2xl font-black mt-2">Classes & Compulsory Subjects</h2>
                    <p class="text-xs text-blue-100 opacity-80 mt-0.5">Define your school's classes and compulsory curriculum.</p>
                </div>
                <div class="flex items-center gap-3">
                    <button onclick="saveSetupConfig()" class="bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs px-5 py-3 rounded-xl shadow-lg active:scale-95 transition-all flex items-center gap-2">
                        <i class="fas fa-save"></i>
                        <span>SAVE SETUP</span>
                    </button>
                </div>
            </div>

            <!-- Two-Column Layout (Desktop Grid: 1/3 Classes, 2/3 Subjects) -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Column 1: Classes Master List -->
                <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-xs font-black uppercase tracking-wider text-gray-700">Active Classes (${setupEngine.classes.length})</h3>
                        <span class="text-[10px] text-gray-400 font-bold">1-Click Select</span>
                    </div>

                    <!-- Add New Class Input -->
                    <div class="flex gap-2 mb-4">
                        <input type="text" id="new-class-input" placeholder="e.g. Nursery, Class 9" class="w-full text-xs font-bold p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 transition-colors">
                        <button onclick="handleAddNewClass()" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-xl text-xs font-bold active:scale-95 transition-all">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>

                    <!-- Classes List -->
                    <div class="space-y-2 flex-grow overflow-y-auto max-h-[380px] pr-1">
                        ${setupEngine.classes.map(c => `
                            <div onclick="selectSetupClass('${c.id}')" class="p-3 rounded-xl cursor-pointer border transition-all flex items-center justify-between ${setupEngine.activeClassId === c.id ? 'bg-blue-50 border-blue-400 text-blue-700 font-black shadow-sm' : 'bg-gray-50 border-gray-100 text-gray-700 font-bold hover:bg-gray-100/70'}">
                                <div class="flex items-center gap-2.5">
                                    <div class="w-2 h-2 rounded-full ${setupEngine.activeClassId === c.id ? 'bg-blue-600' : 'bg-gray-300'}"></div>
                                    <span class="text-xs">${c.name}</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="text-[10px] px-2 py-0.5 rounded-full ${setupEngine.activeClassId === c.id ? 'bg-blue-200/60 text-blue-800' : 'bg-gray-200/60 text-gray-600'}">
                                        ${(setupEngine.getSubjectsForClass(c.id) || []).length} subs
                                    </span>
                                    <button onclick="event.stopPropagation(); handleRemoveClass('${c.id}')" class="text-gray-300 hover:text-red-500 text-xs transition-colors p-1" title="Remove Class">
                                        <i class="fas fa-trash-alt"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Column 2: Subjects & Publication Configuration for Active Class -->
                <div class="md:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col">
                    ${currentClass ? `
                        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-gray-100 gap-2 mb-4">
                            <div>
                                <span class="text-[10px] font-black uppercase text-blue-600 tracking-wider">Curriculum Setup</span>
                                <h3 class="text-lg font-black text-gray-800">${currentClass.name} Subjects</h3>
                            </div>
                            
                            <!-- Clone Subjects Dropdown -->
                            <div class="flex items-center gap-2 w-full sm:w-auto">
                                <select id="clone-source-select" class="text-[11px] font-bold p-2 bg-gray-50 border border-gray-200 rounded-xl outline-none">
                                    <option value="">- Copy subjects from -</option>
                                    ${setupEngine.classes.filter(c => c.id !== currentClass.id).map(c => `
                                        <option value="${c.id}">${c.name} (${(setupEngine.getSubjectsForClass(c.id) || []).length} subs)</option>
                                    `).join('')}
                                </select>
                                <button onclick="handleCloneSubjects('${currentClass.id}')" class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-xl text-xs font-bold active:scale-95 transition-all" title="Copy subjects from another class">
                                    <i class="fas fa-copy mr-1"></i> Copy
                                </button>
                            </div>
                        </div>

                        <!-- Add Subject Form -->
                        <div class="bg-blue-50/50 border border-blue-100/80 rounded-xl p-3 mb-4">
                            <span class="block text-[10px] font-bold uppercase tracking-wider text-blue-800 mb-2">Add Compulsory Subject & Book</span>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                                <input type="text" id="new-sub-name" placeholder="Subject Name (e.g. Mathematics)" class="text-xs font-bold p-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500">
                                <input type="text" id="new-sub-pub" placeholder="Book / Publisher (e.g. Oxford Book 4)" class="text-xs font-bold p-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500">
                            </div>
                            <button onclick="handleAddNewSubject('${currentClass.id}')" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-xs font-black uppercase tracking-wider active:scale-95 transition-all">
                                <i class="fas fa-plus mr-1"></i> Add Subject to ${currentClass.name}
                            </button>
                        </div>

                        <!-- List of Compulsory Subjects in Active Class -->
                        <div class="space-y-2 flex-grow overflow-y-auto max-h-[300px]">
                            ${subjects.length === 0 ? `
                                <div class="text-center py-12 text-gray-300">
                                    <i class="fas fa-book-open text-3xl mb-2 text-gray-200"></i>
                                    <p class="text-xs font-bold">No compulsory subjects configured for ${currentClass.name} yet.</p>
                                    <p class="text-[10px] text-gray-400 mt-1">Add subjects above or copy from another class.</p>
                                </div>
                            ` : subjects.map(s => `
                                <div class="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100/60 rounded-xl border border-gray-100 transition-colors">
                                    <div>
                                        <div class="flex items-center gap-2">
                                            <span class="text-xs font-black text-gray-800">${s.name}</span>
                                            <span class="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 uppercase">Compulsory</span>
                                        </div>
                                        <p class="text-[10px] text-gray-500 font-medium mt-0.5">
                                            <i class="fas fa-book mr-1 text-gray-400"></i>${s.publisher ? s.publisher : 'No publisher specified'}
                                        </p>
                                    </div>
                                    <button onclick="handleRemoveSubject('${currentClass.id}', '${s.id}')" class="text-gray-300 hover:text-red-500 p-1.5 transition-colors" title="Delete Subject">
                                        <i class="fas fa-times-circle text-sm"></i>
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <div class="text-center py-20 text-gray-300 text-xs">Select or add a class first.</div>
                    `}
                </div>
            </div>
        </div>
    `;
}

function selectSetupClass(classId) {
    if (!setupEngine) return;
    setupEngine.activeClassId = classId;
    renderSetupUI();
}

function handleAddNewClass() {
    const input = document.getElementById('new-class-input');
    if (!input || !setupEngine) return;
    const name = input.value.trim();
    if (!name) {
        showToast("Enter a class name (e.g. Class 9)", "error");
        return;
    }
    const added = setupEngine.addClass(name);
    if (!added) {
        showToast("Class already exists or invalid", "error");
        return;
    }
    input.value = '';
    setupEngine.activeClassId = added.id;
    showToast(`Added ${name}!`, "success");
    renderSetupUI();
}

function handleRemoveClass(classId) {
    if (!setupEngine) return;
    if (!confirm("Are you sure you want to remove this class and its subjects?")) return;
    setupEngine.removeClass(classId);
    showToast("Class removed", "info");
    renderSetupUI();
}

function handleAddNewSubject(classId) {
    const nameInput = document.getElementById('new-sub-name');
    const pubInput = document.getElementById('new-sub-pub');
    if (!nameInput || !setupEngine) return;

    const name = nameInput.value.trim();
    const pub = pubInput ? pubInput.value.trim() : '';

    if (!name) {
        showToast("Subject name is required!", "error");
        return;
    }

    const added = setupEngine.addSubject(classId, name, pub);
    if (!added) {
        showToast("Subject already exists in this class!", "error");
        return;
    }

    nameInput.value = '';
    if (pubInput) pubInput.value = '';
    showToast(`Added ${name}!`, "success");
    renderSetupUI();
}

function handleRemoveSubject(classId, subjectId) {
    if (!setupEngine) return;
    setupEngine.removeSubject(classId, subjectId);
    showToast("Subject removed", "info");
    renderSetupUI();
}

function handleCloneSubjects(targetClassId) {
    const select = document.getElementById('clone-source-select');
    if (!select || !setupEngine) return;
    const sourceClassId = select.value;
    if (!sourceClassId) {
        showToast("Select a class to copy from", "error");
        return;
    }
    const count = setupEngine.cloneSubjects(sourceClassId, targetClassId);
    showToast(`Copied ${count} subjects!`, "success");
    renderSetupUI();
}

async function saveSetupConfig() {
    if (!setupEngine) return;
    try {
        await setupEngine.saveToDatabase();
        showToast("School classes & curriculum saved successfully!", "success");
    } catch (e) {
        showToast("Failed to save: " + e.message, "error");
    }
}
