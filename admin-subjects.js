// Admin Subjects Management Module

async function loadClassSubjects() {
    const classId = document.getElementById('subj-class-select').value;
    const container = document.getElementById('class-subjects-display');
    if (!classId) {
        container.innerHTML = `<div class="text-center py-10 text-gray-300 text-xs italic">Select a class to view/manage subjects</div>`;
        return;
    }

    container.innerHTML = `<div class="text-center py-10 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Fetching Subject Configuration...</div>`;

    try {
        const snap = await db.ref(`school/class_configs/${classId}/subjects`).once('value');
        const config = snap.val() || { };
        
        const types = [
            { id: 'compulsory', label: 'Compulsory Subjects', color: 'blue' },
            { id: 'optional_1', label: 'Optional I Group', color: 'purple' },
            { id: 'optional_2', label: 'Optional II Group', color: 'indigo' },
            { id: 'optional_3', label: 'Optional III Group', color: 'pink' },
            { id: 'optional_4', label: 'Optional IV Group', color: 'teal' },
            { id: 'optional_5', label: 'Optional V Group', color: 'orange' }
        ];

        container.innerHTML = types.map(t => {
            const subjects = config[t.id] ? Object.entries(config[t.id]) : [ ];
            return `
                <div class="mobile-card !p-4">
                    <div class="flex justify-between items-center mb-3">
                        <h4 class="text-[10px] font-black uppercase text-${t.color}-600 tracking-wider">${t.label}</h4>
                        <span class="px-2 py-0.5 bg-${t.color}-50 text-${t.color}-600 rounded-full text-[8px] font-black">${subjects.length} Items</span>
                    </div>
                    <div class="space-y-2">
                        ${subjects.length === 0 ? `<p class="text-[10px] text-gray-300 italic">No subjects added</p>` : subjects.map(([sid, name]) => `
                            <div class="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                                <span class="text-xs font-bold text-gray-700">${name}</span>
                                <button onclick="removeSubjectFromClass('${classId}', '${t.id}', '${sid}')" class="text-red-400 active:scale-90 transition-transform">
                                    <i class="fas fa-times-circle text-xs"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');

    } catch (e) {
        container.innerHTML = `<div class="text-center py-10 text-red-400 text-xs">Failed to load subjects: ${e.message}</div>`;
    }
}

async function addSubjectToClass() {
    const classId = document.getElementById('subj-class-select').value;
    const type = document.getElementById('subj-type').value;
    const name = document.getElementById('subj-name-input').value.trim();

    if (!classId || !name) {
        showToast("Select Class and enter Subject Name!", "error");
        return;
    }

    try {
        await db.ref(`school/class_configs/${classId}/subjects/${type}`).push(name);
        document.getElementById('subj-name-input').value = '';
        showToast("Subject added successfully!", "success");
        loadClassSubjects();
    } catch (e) {
        showToast("Action failed: " + e.message, "error");
    }
}

async function removeSubjectFromClass(classId, type, sid) {
    if (!confirm("Remove this subject from the class configuration?")) return;
    try {
        await db.ref(`school/class_configs/${classId}/subjects/${type}/${sid}`).remove();
        loadClassSubjects();
    } catch (e) {
        showToast("Failed to remove subject", "error");
    }
}
    