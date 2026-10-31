// admin-teacher-view.js - Faculty Directory & Workload Inspector UI Controller
// Refined, high-density, uncluttered layout matching the Student Directory architecture.
(function() {
    let teacherViewEngine = null;
    let currentContainerId = 'teacher-view-container';

    // Entrypoint: Initialize and Mount
    window.initTeacherView = async function(containerId = 'teacher-view-container') {
        currentContainerId = containerId;
        const container = document.getElementById(containerId);
        if (!container) return;

        // Render initial loading state
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-16 space-y-3">
                <i class="fas fa-spinner fa-spin text-3xl text-blue-700"></i>
                <p class="text-xs font-bold text-gray-500">Loading faculty directory...</p>
            </div>
        `;

        try {
            // Instantiate module
            if (typeof TeacherViewModule !== 'undefined') {
                teacherViewEngine = new TeacherViewModule();
            } else if (window.TeacherViewModule) {
                teacherViewEngine = new window.TeacherViewModule();
            } else {
                throw new Error("TeacherViewModule ES class is not available in global scope.");
            }

            // Load classes and teachers dynamically
            await teacherViewEngine.loadFromDatabase();

            // Render complete interface
            renderTeacherViewUI();
        } catch (err) {
            console.error("Failed to initialize Faculty Directory:", err);
            container.innerHTML = `
                <div class="p-6 bg-red-50 border border-red-200 rounded-2xl text-center space-y-2">
                    <i class="fas fa-exclamation-triangle text-2xl text-red-600"></i>
                    <p class="text-xs font-bold text-red-800">Could not load faculty directory</p>
                    <p class="text-[11px] text-red-600">${err.message}</p>
                    <button onclick="initTeacherView('${containerId}')" class="mt-2 px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-xl active:scale-95 transition-transform">
                        <i class="fas fa-redo mr-1"></i> Retry
                    </button>
                </div>
            `;
        }
    };

    // Render Master UI Layout
    function renderTeacherViewUI() {
        const container = document.getElementById(currentContainerId);
        if (!container || !teacherViewEngine) return;

        const stats = teacherViewEngine.getStatistics();
        const counts = teacherViewEngine.getFilterCounts();
        const activeFilter = teacherViewEngine.getSelectedFilter();
        const teachers = teacherViewEngine.getFilteredTeachers();
        const classes = teacherViewEngine.getClasses();

        container.innerHTML = `
            <div class="max-w-5xl mx-auto space-y-4 pb-16">
                <!-- Header Bar -->
                <!-- Header Bar -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200">
                    <div class="flex items-center gap-3">
                        <button onclick="handleTeacherViewBack()" class="text-gray-600 hover:text-blue-700 p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center text-sm font-bold" title="Back">
                            <i class="fas fa-arrow-left"></i>
                            <span class="ml-1.5 text-xs">Dashboard</span>
                        </button>
                        <div>
                            <div class="flex items-center gap-2">
                                <h2 class="text-lg font-black text-gray-800 leading-tight">Faculty Directory</h2>
                                <span class="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">${teachers.length} Active</span>
                            </div>
                            <p class="text-[11px] text-gray-400">Search and inspect teaching staff, class assignments, and workloads</p>
                        </div>
                    </div>

                    <div class="flex items-center gap-2">
                        <button onclick="handleTeacherViewAddFaculty()" class="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 active:scale-95 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5">
                            <i class="fas fa-user-plus text-xs"></i>
                            <span>Add Faculty</span>
                        </button>
                    </div>
                </div>

                <!-- Streamlined Controls Bar: Search & Category/Class Dropdown (No Tab Row, No Sort Clutter) -->
                <div class="mobile-card !p-3 bg-white">
                    <div class="flex flex-col sm:flex-row items-center gap-2.5">
                        <!-- Search Input -->
                        <div class="relative flex-grow w-full">
                            <i class="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                            <input
                                type="text"
                                id="teacher-search-input"
                                value="${escapeHtml(teacherViewEngine.searchQuery)}"
                                oninput="handleTeacherSearch(this.value)"
                                placeholder="Search by Faculty ID, name, phone, title, or subject..."
                                class="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
                            >
                            <button
                                type="button"
                                id="teacher-search-clear"
                                onclick="clearTeacherSearch()"
                                class="${teacherViewEngine.searchQuery ? '' : 'hidden'} absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                            >
                                <i class="fas fa-times"></i>
                            </button>
                        </div>

                        <!-- Clean Category / Class Filter Dropdown -->
                        <div class="w-full sm:w-64 flex-shrink-0">
                            <div class="relative">
                                <select
                                    id="teacher-filter-select"
                                    onchange="handleSelectTeacherFilter(this.value)"
                                    class="w-full pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none"
                                >
                                    <option value="all" ${activeFilter === 'all' ? 'selected' : ''}>All Faculty (${counts.all || 0})</option>
                                    <option value="class_teachers" ${activeFilter === 'class_teachers' ? 'selected' : ''}>Class Teachers (${counts.class_teachers || 0})</option>
                                    <option value="subject_teachers" ${activeFilter === 'subject_teachers' ? 'selected' : ''}>Subject Teachers (${counts.subject_teachers || 0})</option>
                                    <optgroup label="Filter by Class">
                                        ${classes.map(c => {
                                            const cid = String(c.id);
                                            const count = counts[cid] || 0;
                                            return `<option value="${cid}" ${activeFilter === cid ? 'selected' : ''}>${c.name || `Class ${cid}`} (${count} teacher${count === 1 ? '' : 's'})</option>`;
                                        }).join('')}
                                    </optgroup>
                                </select>
                                <i class="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] pointer-events-none"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Statistics KPI Strip -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div class="mobile-card !p-3 bg-white flex items-center gap-3">
                        <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center text-xs flex-shrink-0">
                            <i class="fas fa-chalkboard-teacher"></i>
                        </div>
                        <div class="min-w-0">
                            <span class="block text-[9px] font-bold text-gray-400 uppercase tracking-wider truncate">Total Faculty</span>
                            <span class="text-sm font-black text-gray-800">${stats.totalFaculty}</span>
                        </div>
                    </div>

                    <div class="mobile-card !p-3 bg-white flex items-center gap-3">
                        <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs flex-shrink-0">
                            <i class="fas fa-user-tie"></i>
                        </div>
                        <div class="min-w-0">
                            <span class="block text-[9px] font-bold text-gray-400 uppercase tracking-wider truncate">Class Teachers</span>
                            <span class="text-sm font-black text-emerald-700">${stats.classTeachersCount}</span>
                        </div>
                    </div>

                    <div class="mobile-card !p-3 bg-white flex items-center gap-3">
                        <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs flex-shrink-0">
                            <i class="fas fa-shield-alt"></i>
                        </div>
                        <div class="min-w-0">
                            <span class="block text-[9px] font-bold text-gray-400 uppercase tracking-wider truncate">Verified Records</span>
                            <span class="text-sm font-black text-blue-700">${stats.verifiedCount}</span>
                        </div>
                    </div>

                    <div class="mobile-card !p-3 bg-white flex items-center gap-3">
                        <div class="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-xs flex-shrink-0">
                            <i class="fas fa-school"></i>
                        </div>
                        <div class="min-w-0">
                            <span class="block text-[9px] font-bold text-gray-400 uppercase tracking-wider truncate">Classes Covered</span>
                            <span class="text-sm font-black text-amber-700">${stats.totalClassesCovered}</span>
                        </div>
                    </div>
                </div>

                <!-- Faculty Grid Container -->
                <div id="teacher-view-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    ${renderTeacherCardsHtml(teachers)}
                </div>
            </div>

            <!-- Modal Container for Details Dialog -->
            <div id="teacher-detail-modal" class="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs hidden flex items-center justify-center p-4">
                <div class="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100" id="teacher-modal-content">
                    <!-- Populated dynamically via openTeacherDetailModal -->
                </div>
            </div>

            <!-- In-App Document Preview Modal -->
            <div id="document-preview-modal" class="hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div class="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden">
                    <div class="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                        <div class="flex items-center gap-2 min-w-0">
                            <i class="fas fa-file-contract text-blue-700 text-sm"></i>
                            <div>
                                <h3 id="doc-preview-title" class="text-xs font-black text-gray-800 truncate">Document Preview</h3>
                                <span id="doc-preview-subtitle" class="text-[9px] font-bold text-gray-400">Faculty Verification Record</span>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <a id="doc-preview-direct-link" href="#" target="_blank" rel="noopener noreferrer" class="px-2.5 py-1 bg-white hover:bg-gray-100 text-blue-700 border border-gray-300 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1">
                                <i class="fas fa-external-link-alt text-[9px]"></i> New Tab
                            </a>
                            <a id="doc-preview-download-link" href="#" download class="px-2.5 py-1 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1">
                                <i class="fas fa-download text-[9px]"></i> Download
                            </a>
                                                        <button onclick="closeDocumentPreview()" class="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-200 transition-colors ml-1">
                                <i class="fas fa-times text-sm"></i>
                            </button>
                        </div>
                    </div>

                    <div id="doc-preview-body" class="p-4 flex-grow overflow-auto flex items-center justify-center min-h-[300px] bg-gray-100">
                        <!-- Preview frame or image injected here -->
                    </div>

                    <div class="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-[11px] text-gray-500">
                        <span>Stored securely in school cloud storage.</span>
                        <button onclick="closeDocumentPreview()" class="px-3.5 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl text-xs transition-colors">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Render Cards
    function renderTeacherCardsHtml(teachers) {
        if (!teachers || teachers.length === 0) {
            return `
                <div class="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-gray-200 p-8 space-y-3">
                    <div class="w-12 h-12 mx-auto rounded-full bg-blue-50 flex items-center justify-center text-blue-700 text-lg">
                        <i class="fas fa-user-slash"></i>
                    </div>
                    <h3 class="text-xs font-black text-gray-700">No faculty members found</h3>
                    <p class="text-[11px] text-gray-400">Try adjusting your category filter or search keywords</p>
                    <button onclick="resetTeacherFilters()" class="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-xl hover:bg-blue-100 transition-colors">
                        Reset Filters
                    </button>
                </div>
            `;
        }

        return teachers.map(t => {
            const hasDocs = t.documentCount > 0;
            const avatarUrl = t.photo || DEFAULT_AVATAR;

            return `
                <div class="mobile-card !p-4 bg-white hover:border-blue-200 transition-all flex flex-col justify-between space-y-3">
                    <div>
                        <!-- Monospace Unique Faculty ID Header Badge & Verification -->
                        <div class="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-gray-100">
                            <span class="px-2 py-0.5 rounded-lg bg-blue-100 text-blue-900 font-mono text-[10px] font-bold tracking-tight">
                                ${t.id}
                            </span>
                            ${t.isVerified ? `
                                <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 flex items-center gap-1">
                                    <i class="fas fa-check-circle text-[8px]"></i> Verified
                                </span>
                            ` : `
                                <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                                    Active Faculty
                                </span>
                            `}
                        </div>

                        <!-- Profile Info -->
                        <div class="flex items-start gap-3">
                            <div class="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                                <img src="${avatarUrl}" alt="${t.fullName}" class="w-full h-full object-cover" onerror="this.src='${DEFAULT_AVATAR}'">
                            </div>

                            <div class="flex-grow min-w-0">
                                <h3 class="text-xs font-black text-gray-800 truncate leading-tight" title="${t.fullName}">${t.fullName}</h3>
                                <p class="text-[10px] text-gray-500 truncate mt-0.5">${t.professionalTitle}</p>
                                <div class="mt-1">
                                    ${t.isClassTeacher ? `
                                        <span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 inline-flex items-center gap-1">
                                            <i class="fas fa-star text-[8px]"></i> ${t.classTeacherBadge}
                                        </span>
                                    ` : `
                                        <span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 inline-block">
                                            Subject Faculty
                                        </span>
                                    `}
                                </div>
                            </div>
                        </div>

                        <!-- Streamlined Workload Summary Chips -->
                        <div class="mt-3 p-2 bg-gray-50 rounded-xl space-y-1">
                            <div class="flex items-center justify-between text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                                <span>Assigned Workload</span>
                                <span class="text-blue-700">${t.totalSubjectsCount} subject${t.totalSubjectsCount === 1 ? '' : 's'}</span>
                            </div>
                            <div class="flex flex-wrap gap-1 pt-0.5">
                                ${t.workload.length > 0 ? t.workload.map(w => `
                                    <span class="px-2 py-0.5 bg-white border border-gray-200 rounded-lg text-[9px] font-bold text-gray-700 truncate max-w-full" title="${w.subjects.join(', ')}">
                                        <span class="text-blue-700">${w.className}:</span> ${w.subjects.join(', ')}
                                    </span>
                                `).join('') : `
                                    <span class="text-gray-400 italic text-[10px]">No subjects assigned</span>
                                `}
                            </div>
                        </div>
                    </div>

                    <!-- Footer Card Contacts & Actions -->
                    <div class="flex items-center justify-between pt-2 border-t border-gray-100">
                        <div class="flex items-center gap-2">
                            <a href="tel:${t.phone}" class="text-[10px] font-bold text-blue-700 hover:underline flex items-center gap-1">
                                <i class="fas fa-phone-alt text-[8px]"></i> ${t.phone}
                            </a>
                            ${hasDocs ? `
                                <span class="text-[9px] text-gray-400 flex items-center gap-0.5" title="${t.documentCount} document(s) attached">
                                    <i class="fas fa-paperclip text-[8px]"></i> ${t.documentCount}
                                </span>
                            ` : ''}
                        </div>

                        <div class="flex items-center gap-1.5">
                            <button type="button" onclick="openTeacherDetailModal('${t.id}')" class="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[10px] font-bold transition-colors">
                                View
                            </button>
                            <button type="button" onclick="handleEditTeacher('${t.id}')" class="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[10px] font-bold transition-colors">
                                Edit
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Modal: Open Teacher Details Dialog
    window.openTeacherDetailModal = function(teacherId) {
        if (!teacherViewEngine) return;
        const t = teacherViewEngine.getTeacherById(teacherId);
        if (!t) return;

        const modal = document.getElementById('teacher-detail-modal');
        const content = document.getElementById('teacher-modal-content');
        if (!modal || !content) return;

        content.innerHTML = `
            <div class="p-6 space-y-5">
                <!-- Modal Header -->
                <div class="flex items-start justify-between pb-3 border-b border-gray-100">
                    <div class="flex items-center gap-3">
                        <img src="${t.photo}" alt="${t.fullName}" class="w-14 h-14 rounded-2xl object-cover border border-gray-200 bg-gray-50" onerror="this.src='${DEFAULT_AVATAR}'">
                        <div>
                            <div class="flex items-center gap-1.5">
                                <span class="px-2 py-0.5 rounded-lg bg-blue-100 text-blue-900 font-mono text-[10px] font-bold">
                                    ${t.id}
                                </span>
                                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${t.isClassTeacher ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'}">
                                    ${t.classTeacherBadge}
                                </span>
                                ${t.isVerified ? `
                                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">Verified</span>
                                ` : ''}
                            </div>
                            <h3 class="text-base font-black text-gray-800 mt-1">${t.fullName}</h3>
                            <p class="text-[10px] font-bold text-gray-400">${t.professionalTitle}</p>
                        </div>
                    </div>

                    <button onclick="closeTeacherDetailModal()" class="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100 transition-colors">
                        <i class="fas fa-times text-sm"></i>
                    </button>
                </div>

                <!-- Professional & Personal Matrix -->
                <div>
                    <h4 class="text-[10px] font-black uppercase tracking-wider text-blue-700 mb-2">Faculty Information</h4>
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 bg-gray-50 rounded-2xl text-xs">
                        <div>
                            <span class="block text-[9px] font-bold text-gray-400 uppercase">Qualification</span>
                            <span class="font-bold text-gray-800">${t.qualification}</span>
                        </div>
                        <div>
                            <span class="block text-[9px] font-bold text-gray-400 uppercase">Experience</span>
                            <span class="font-bold text-gray-800">${t.experience}</span>
                        </div>
                        <div>
                            <span class="block text-[9px] font-bold text-gray-400 uppercase">Gender</span>
                            <span class="font-bold text-gray-800 capitalize">${t.gender}</span>
                        </div>
                        <div>
                            <span class="block text-[9px] font-bold text-gray-400 uppercase">Blood Group</span>
                            <span class="font-bold text-gray-800">${t.bloodGroup}</span>
                        </div>
                        <div>
                            <span class="block text-[9px] font-bold text-gray-400 uppercase">Mobile Phone</span>
                            <a href="tel:${t.phone}" class="font-bold text-blue-700 hover:underline">${t.phone}</a>
                        </div>
                        <div>
                            <span class="block text-[9px] font-bold text-gray-400 uppercase">Email</span>
                            <span class="font-bold text-gray-700 truncate block" title="${t.email}">${t.email}</span>
                        </div>
                    </div>
                </div>

                <!-- Workload Inspector -->
                <div>
                    <div class="flex items-center justify-between mb-2">
                        <h4 class="text-[10px] font-black uppercase tracking-wider text-blue-700">Assigned Curriculum Workload</h4>
                        <span class="text-[10px] font-bold text-gray-400">${t.totalWorkloadClasses} Classes • ${t.totalSubjectsCount} Subjects</span>
                    </div>

                    <div class="p-3 bg-gray-50 rounded-2xl space-y-2 text-xs">
                        ${t.workload.length > 0 ? t.workload.map(w => `
                            <div class="p-2.5 bg-white rounded-xl border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <span class="font-bold text-gray-800 text-xs">${w.className}</span>
                                <div class="flex flex-wrap gap-1">
                                    ${w.subjects.map(s => `
                                        <span class="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-bold">${s}</span>
                                    `).join('')}
                                </div>
                            </div>
                        `).join('') : `
                            <p class="text-xs text-gray-400 italic text-center py-2">No class subjects currently assigned.</p>
                        `}
                    </div>
                </div>

                <!-- Verification Documents -->
                <div>
                    <div class="flex items-center justify-between mb-2">
                        <h4 class="text-[10px] font-black uppercase tracking-wider text-blue-700">Verification Documents</h4>
                        <span class="text-[10px] font-bold text-gray-400">${t.documentCount} Attached</span>
                    </div>

                    <div class="space-y-1.5">
                        ${t.documents.length > 0 ? t.documents.map(d => {
                            const escapedUrl = encodeURIComponent(d.url || '');
                            const escapedName = encodeURIComponent(d.name || d.type || 'Document');
                            const escapedType = encodeURIComponent(d.type || 'Verification Record');

                            return `
                                <div class="p-2.5 bg-gray-50 rounded-xl flex items-center justify-between text-xs">
                                    <div class="flex items-center gap-2.5 min-w-0">
                                        <div class="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 text-xs">
                                            <i class="fas fa-file-alt"></i>
                                        </div>
                                        <div class="min-w-0">
                                            <h5 class="font-bold text-gray-800 text-[11px] truncate">${d.name || d.type || 'Document'}</h5>
                                            <span class="text-[9px] text-gray-400 font-bold block">${d.type || 'Verification Record'}${d.size ? ` • ${Math.round(d.size / 1024)} KB` : ''}</span>
                                        </div>
                                    </div>

                                    <button type="button" onclick="openDocumentPreview('${escapedUrl}', '${escapedName}', '${escapedType}')" class="px-2.5 py-1 bg-blue-700 hover:bg-blue-800 text-white text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1 flex-shrink-0">
                                        <i class="fas fa-eye text-[8px]"></i> View
                                    </button>
                                </div>
                            `;
                        }).join('') : `
                            <p class="text-xs text-gray-400 italic text-center py-3 bg-gray-50 rounded-xl">No verification documents attached.</p>
                        `}
                    </div>
                </div>

                                <!-- Modal Actions -->
                <div class="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <button onclick="closeTeacherDetailModal()" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors">
                        Close
                    </button>
                    <button onclick="handleEditTeacher('${t.id}')" class="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-xs shadow transition-colors flex items-center gap-1.5">
                        <i class="fas fa-edit"></i>
                        <span>Edit Faculty</span>
                    </button>
                </div>
            </div>
        `;

        modal.classList.remove('hidden');
    };

    window.closeTeacherDetailModal = function() {
        const modal = document.getElementById('teacher-detail-modal');
        if (modal) modal.classList.add('hidden');
    };

    window.openDocumentPreview = function(encodedUrl, encodedName, encodedType) {
        const url = decodeURIComponent(encodedUrl || '');
        const name = decodeURIComponent(encodedName || 'Faculty Verification Document');
        const type = decodeURIComponent(encodedType || 'Document');

        const modal = document.getElementById('document-preview-modal');
        const titleEl = document.getElementById('doc-preview-title');
        const subtitleEl = document.getElementById('doc-preview-subtitle');
        const directLink = document.getElementById('doc-preview-direct-link');
        const downloadLink = document.getElementById('doc-preview-download-link');
        const bodyEl = document.getElementById('doc-preview-body');

        if (!modal || !bodyEl) {
            window.open(url, '_blank');
            return;
        }

        if (titleEl) titleEl.textContent = name;
        if (subtitleEl) subtitleEl.textContent = type;
        if (directLink) directLink.href = url;
        if (downloadLink) downloadLink.href = url;

        const isImage = /\.(jpg|jpeg|png|webp|gif|svg)($|\?)/i.test(url);
        if (isImage) {
            bodyEl.innerHTML = `
                <div class="flex flex-col items-center justify-center p-4">
                    <img src="${url}" alt="${name}" class="max-h-[60vh] max-w-full rounded-xl shadow-sm object-contain border border-gray-200 bg-white">
                </div>
            `;
        } else {
            bodyEl.innerHTML = `
                <div class="w-full h-full flex flex-col space-y-2">
                    <iframe src="${url}" class="w-full h-[58vh] rounded-xl border border-gray-300 bg-white" title="${name}"></iframe>
                    <div class="text-[11px] text-gray-500 text-center bg-white p-2 rounded-xl border border-gray-200">
                        If the preview does not display above in your browser, 
                        <a href="${url}" target="_blank" class="font-bold text-blue-700 hover:underline">Click Here to Open in New Window</a> or 
                        <a href="${url}" download class="font-bold text-blue-700 hover:underline">Download Directly</a>.
                    </div>
                </div>
            `;
        }

        modal.classList.remove('hidden');
    };

    window.closeDocumentPreview = function() {
        const modal = document.getElementById('document-preview-modal');
        if (modal) modal.classList.add('hidden');
        const bodyEl = document.getElementById('doc-preview-body');
        if (bodyEl) bodyEl.innerHTML = '';
    };

    // UI Event Handlers
    window.handleSelectTeacherFilter = function(filter) {
        if (!teacherViewEngine) return;
        teacherViewEngine.setSelectedFilter(filter);
        renderTeacherViewUI();
    };

    window.handleTeacherSearch = function(query) {
        if (!teacherViewEngine) return;
        teacherViewEngine.setSearchQuery(query);
        const clearBtn = document.getElementById('teacher-search-clear');
        if (clearBtn) {
            if (query && query.trim()) {
                clearBtn.classList.remove('hidden');
            } else {
                clearBtn.classList.add('hidden');
            }
        }
        refreshTeacherGrid();
    };

    window.clearTeacherSearch = function() {
        if (!teacherViewEngine) return;
        teacherViewEngine.setSearchQuery('');
        const input = document.getElementById('teacher-search-input');
        if (input) input.value = '';
        const clearBtn = document.getElementById('teacher-search-clear');
        if (clearBtn) clearBtn.classList.add('hidden');
        refreshTeacherGrid();
    };

    window.resetTeacherFilters = function() {
        if (!teacherViewEngine) return;
        teacherViewEngine.setSelectedFilter('all');
        teacherViewEngine.setSearchQuery('');
        renderTeacherViewUI();
    };

    function refreshTeacherGrid() {
        const grid = document.getElementById('teacher-view-grid');
        if (!grid || !teacherViewEngine) return;
        const teachers = teacherViewEngine.getFilteredTeachers();
        grid.innerHTML = renderTeacherCardsHtml(teachers);
    }

    window.handleTeacherViewBack = function() {
        if (typeof adminRouter === 'function') {
            adminRouter('dashboard');
        } else {
            window.location.href = 'admin.html';
        }
    };

    window.handleTeacherViewAddFaculty = function() {
        if (typeof adminRouter === 'function') {
            adminRouter('addTeacher');
        } else {
            window.location.href = 'faculty-add.html';
        }
    };

    window.handleEditTeacher = function(teacherId) {
        closeTeacherDetailModal();
        if (typeof adminRouter === 'function') {
            adminRouter('editTeacher', { id: teacherId });
        } else {
            window.location.href = `teacher-edit.html?id=${encodeURIComponent(teacherId)}`;
        }
    };

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
                        .replace(/'/g, '&#039;');
    }
})();
