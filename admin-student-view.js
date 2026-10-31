// admin-student-view.js - Streamlined Student Directory & Roster Viewer Controller
// Clean, ID-centric student roster inspection with class dropdown filter and robust document previewer

let studentViewEngine = null;

// Entry Point
async function initStudentView(targetContainerId = 'student-view-container') {
    let container = document.getElementById(targetContainerId);
    if (!container) {
        container = document.getElementById('student-view-container') || document.getElementById('main-content');
    }
    if (!container) return;

    // Loading State
    container.innerHTML = `
        <div class="flex flex-col items-center justify-center py-16 text-gray-400">
            <i class="fas fa-spinner fa-spin text-3xl text-blue-700 mb-3"></i>
            <p class="text-xs font-bold uppercase tracking-wider text-gray-500">Loading Student Directory...</p>
        </div>
    `;

    try {
        if (typeof window.StudentViewModule !== 'undefined') {
            studentViewEngine = new window.StudentViewModule();
            await studentViewEngine.loadFromDatabase();
        } else {
            console.warn('StudentViewModule not found on window, fallback initialized.');
            studentViewEngine = {
                getClasses: () => [
                    { id: '1', name: 'Class 1' }, { id: '2', name: 'Class 2' },
                    { id: '3', name: 'Class 3' }, { id: '4', name: 'Class 4' },
                    { id: '5', name: 'Class 5' }, { id: '6', name: 'Class 6' },
                    { id: '7', name: 'Class 7' }, { id: '8', name: 'Class 8' }
                ],
                getSelectedClassId: () => 'all',
                setSelectedClass: (cid) => cid,
                setSearchQuery: () => {},
                setSortBy: () => {},
                getClassCounts: () => ({ all: 0 }),
                getClassStatistics: () => ({ totalStudents: 0, maleCount: 0, femaleCount: 0, withDocsCount: 0, withPhoneCount: 0 }),
                getFilteredStudents: () => [],
                getStudentById: () => null
            };
        }

        renderStudentDirectory(container);
    } catch (err) {
        console.error('Failed to initialize StudentViewModule:', err);
        container.innerHTML = `
            <div class="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs">
                <i class="fas fa-exclamation-triangle mr-2"></i> Failed to load student directory: ${err.message}
            </div>
        `;
    }
}

// Render Master Directory View
function renderStudentDirectory(container) {
    const classes = studentViewEngine.getClasses();
    const counts = studentViewEngine.getClassCounts();
    const currentClassId = studentViewEngine.getSelectedClassId();
    const stats = studentViewEngine.getClassStatistics();
    const students = studentViewEngine.getFilteredStudents();

    container.innerHTML = `
        <div class="max-w-5xl mx-auto space-y-4 pb-16">
            <!-- Header Bar -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200">
                <div class="flex items-center gap-3">
                    <button onclick="handleStudentViewBack()" class="text-gray-600 hover:text-blue-700 p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center text-sm font-bold" title="Back">
                        <i class="fas fa-arrow-left"></i>
                        <span class="ml-1.5 text-xs">Dashboard</span>
                    </button>
                    <div>
                        <h2 class="text-lg font-black text-gray-800 leading-tight">Student Directory</h2>
                        <p class="text-[11px] text-gray-400">Search and inspect enrolled student profiles by unique Student ID</p>
                    </div>
                </div>

                <div class="flex items-center gap-2">
                    <button onclick="navigateToAddStudent()" class="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 active:scale-95 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5">
                        <i class="fas fa-user-plus text-xs"></i>
                        <span>Add Student</span>
                    </button>
                </div>
            </div>

            <!-- Streamlined Controls Bar: Search & Class Dropdown (No Tab Row, No Sort Clutter) -->
            <div class="mobile-card !p-3 bg-white">
                <div class="flex flex-col sm:flex-row items-center gap-2.5">
                    <!-- Search Input -->
                    <div class="relative flex-grow w-full">
                        <i class="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                        <input type="text" id="student-search-input" oninput="handleStudentSearch(this.value)" placeholder="Search by Student ID, name, guardian, or phone..." class="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500">
                        <button type="button" id="student-search-clear" onclick="clearStudentSearch()" class="hidden absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>

                    <!-- Clean Class Filter Dropdown -->
                    <div class="w-full sm:w-56 flex-shrink-0">
                        <div class="relative">
                            <select id="student-class-select" onchange="handleSelectClass(this.value)" class="w-full pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none">
                                <option value="all" ${currentClassId === 'all' ? 'selected' : ''}>All Classes (${counts.all || 0})</option>
                                ${classes.map(c => {
                                    const cid = String(c.id);
                                    const count = counts[cid] || 0;
                                    return `<option value="${cid}" ${currentClassId === cid ? 'selected' : ''}>Class ${cid} (${count} student${count === 1 ? '' : 's'})</option>`;
                                }).join('')}
                            </select>
                            <i class="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] pointer-events-none"></i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Class Statistics Summary Strip -->
            <div id="student-stats-strip" class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                ${renderStudentStatsHtml(stats)}
            </div>

            <!-- Students Roster Card Grid -->
            <div id="student-cards-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                ${renderStudentCardsListHtml(students)}
            </div>
        </div>

        <!-- Student Detail Modal -->
        <div id="student-detail-modal" class="hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div id="student-modal-content" class="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100">
                <!-- Injected dynamically -->
            </div>
        </div>

        <!-- Document Preview Modal (Prevents Blank Page on Mobile / Browser Popups) -->
        <div id="document-preview-modal" class="hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div class="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden">
                <div class="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                    <div class="flex items-center gap-2 min-w-0">
                        <i class="fas fa-file-contract text-blue-700 text-sm"></i>
                        <div>
                            <h3 id="doc-preview-title" class="text-xs font-black text-gray-800 truncate">Document Preview</h3>
                            <span id="doc-preview-subtitle" class="text-[9px] font-bold text-gray-400">Official Educational Record</span>
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

// Render Stats Strip
function renderStudentStatsHtml(stats) {
    return `
        <div class="mobile-card !p-3 bg-white flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center text-xs">
                <i class="fas fa-user-graduate"></i>
            </div>
            <div>
                <span class="block text-sm font-black text-gray-800">${stats.totalStudents}</span>
                <span class="block text-[9px] font-bold text-gray-400 uppercase tracking-tight">Total Students</span>
            </div>
        </div>
        <div class="mobile-card !p-3 bg-white flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs">
                <i class="fas fa-male"></i>
            </div>
            <div>
                <span class="block text-sm font-black text-gray-800">${stats.maleCount} Boys / ${stats.femaleCount} Girls</span>
                <span class="block text-[9px] font-bold text-gray-400 uppercase tracking-tight">Gender Ratio</span>
            </div>
        </div>
        <div class="mobile-card !p-3 bg-white flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center text-xs">
                <i class="fas fa-file-contract"></i>
            </div>
            <div>
                <span class="block text-sm font-black text-gray-800">${stats.withDocsCount}</span>
                <span class="block text-[9px] font-bold text-gray-400 uppercase tracking-tight">With Documents</span>
            </div>
        </div>
        <div class="mobile-card !p-3 bg-white flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center text-xs">
                <i class="fas fa-phone-alt"></i>
            </div>
            <div>
                <span class="block text-sm font-black text-gray-800">${stats.withPhoneCount}</span>
                <span class="block text-[9px] font-bold text-gray-400 uppercase tracking-tight">Parent Linked</span>
            </div>
        </div>
    `;
}

// Render Student Card Grid (Student ID is the Primary Identifier, NOT Roll Number)
function renderStudentCardsListHtml(students) {
    if (!students || students.length === 0) {
        return `
            <div class="col-span-full py-16 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200 p-8">
                <i class="fas fa-user-slash text-3xl mb-2 text-gray-300"></i>
                <p class="text-xs font-bold text-gray-500">No students found matching current filters.</p>
                <button onclick="clearStudentSearch(); handleSelectClass('all');" class="mt-3 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg hover:bg-blue-100 transition-colors">
                    Reset Filters
                </button>
            </div>
        `;
    }

    return students.map(s => `
        <div class="mobile-card !p-4 bg-white hover:border-blue-200 transition-all flex flex-col justify-between space-y-3">
            <div class="flex items-start gap-3">
                <div class="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                    <img src="${s.photo}" alt="${s.fullName}" class="w-full h-full object-cover" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2NiZDVlMSI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg=='">
                </div>

                <div class="flex-grow min-w-0">
                    <!-- Student ID is the Primary Identifier Badge -->
                    <div class="flex items-center justify-between gap-1">
                        <span class="text-[11px] font-mono font-black px-2 py-0.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200/80 tracking-wide">${s.id}</span>
                        <span class="text-[10px] font-bold text-gray-500">Class ${s.class}</span>
                    </div>
                    <h3 class="text-xs font-black text-gray-800 truncate mt-1" title="${s.fullName}">${s.fullName}</h3>
                    <div class="flex items-center gap-1.5 text-[10px] text-gray-500 mt-0.5">
                        <span>${s.age}</span>
                        <span>•</span>
                        <span class="capitalize">${s.gender}</span>
                    </div>
                </div>
            </div>

            <!-- Guardian & Contact Snippet -->
            <div class="p-2.5 bg-gray-50 rounded-xl text-[10px] text-gray-600 space-y-1">
                <div class="flex items-center justify-between">
                    <span class="text-gray-400">Guardian:</span>
                    <span class="font-bold text-gray-700 truncate max-w-[150px]">${s.fatherName !== 'N/A' ? s.fatherName : (s.motherName !== 'N/A' ? s.motherName : 'N/A')}</span>
                </div>
                <div class="flex items-center justify-between">
                    <span class="text-gray-400">Mobile:</span>
                    <a href="tel:${s.phone}" class="font-bold text-blue-700 hover:underline flex items-center gap-1">
                        <i class="fas fa-phone-alt text-[8px]"></i> ${s.phone.split(',')[0]}
                    </a>
                </div>
            </div>

            <!-- Footer Card Actions -->
            <div class="flex items-center justify-between pt-1 border-t border-gray-100">
                <span class="text-[9px] font-bold text-gray-400 flex items-center gap-1">
                    <i class="fas fa-paperclip text-gray-300"></i> ${s.documentCount} Doc${s.documentCount === 1 ? '' : 's'}
                </span>

                <div class="flex items-center gap-1.5">
                    <button type="button" onclick="openStudentDetailModal('${s.id}')" class="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[10px] font-bold transition-colors">
                        View
                    </button>
                    <button type="button" onclick="handleEditStudent('${s.id}')" class="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[10px] font-bold transition-colors">
                        Edit
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Modal: Open Student Details Dialog
function openStudentDetailModal(studentId) {
    if (!studentViewEngine) return;
    const s = studentViewEngine.getStudentById(studentId);
    if (!s) return;

    const modal = document.getElementById('student-detail-modal');
    const content = document.getElementById('student-modal-content');
    if (!modal || !content) return;

    content.innerHTML = `
        <div class="p-6 space-y-5">
            <!-- Modal Header (Student ID is Primary) -->
            <div class="flex items-start justify-between pb-3 border-b border-gray-100">
                <div class="flex items-center gap-3">
                    <img src="${s.photo}" alt="${s.fullName}" class="w-14 h-14 rounded-2xl object-cover border border-gray-200 bg-gray-50">
                    <div>
                        <div class="flex items-center gap-1.5">
                            <span class="text-xs font-mono font-black px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200">${s.id}</span>
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">Class ${s.class}</span>
                        </div>
                        <h3 class="text-base font-black text-gray-800 mt-1">${s.fullName}</h3>
                        <p class="text-[10px] font-bold text-gray-400">Enrolled: Session ${s.joinYear}</p>
                    </div>
                </div>

                <button onclick="closeStudentDetailModal()" class="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100 transition-colors">
                    <i class="fas fa-times text-sm"></i>
                </button>
            </div>

            <!-- Personal Data Matrix -->
            <div>
                <h4 class="text-[10px] font-black uppercase tracking-wider text-blue-700 mb-2">Personal Information</h4>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 bg-gray-50 rounded-2xl text-xs">
                    <div>
                        <span class="block text-[9px] font-bold text-gray-400 uppercase">Gender</span>
                        <span class="font-bold text-gray-800 capitalize">${s.gender}</span>
                    </div>
                    <div>
                        <span class="block text-[9px] font-bold text-gray-400 uppercase">Age</span>
                        <span class="font-bold text-gray-800">${s.age}</span>
                    </div>
                    <div>
                        <span class="block text-[9px] font-bold text-gray-400 uppercase">Blood Group</span>
                        <span class="font-bold text-gray-800">${s.bloodGroup}</span>
                    </div>
                    <div>
                        <span class="block text-[9px] font-bold text-gray-400 uppercase">Birthdate (BS)</span>
                        <span class="font-bold text-gray-800">${s.dob}</span>
                    </div>
                </div>
            </div>

            <!-- Family & Contacts -->
            <div>
                <h4 class="text-[10px] font-black uppercase tracking-wider text-blue-700 mb-2">Family & Contact Details</h4>
                <div class="p-3 bg-gray-50 rounded-2xl text-xs space-y-2">
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <span class="block text-[9px] font-bold text-gray-400 uppercase">Father's Name</span>
                            <span class="font-bold text-gray-800">${s.fatherName}</span>
                        </div>
                        <div>
                            <span class="block text-[9px] font-bold text-gray-400 uppercase">Mother's Name</span>
                            <span class="font-bold text-gray-800">${s.motherName}</span>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-2 pt-1 border-t border-gray-200/50">
                        <div>
                            <span class="block text-[9px] font-bold text-gray-400 uppercase">Parent Mobile(s)</span>
                            <span class="font-bold text-blue-700">${s.phone}</span>
                        </div>
                        <div>
                            <span class="block text-[9px] font-bold text-gray-400 uppercase">Parent Email</span>
                            <span class="font-bold text-gray-700">${s.parentEmail}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Addresses -->
            <div>
                <h4 class="text-[10px] font-black uppercase tracking-wider text-blue-700 mb-2">Address</h4>
                <div class="p-3 bg-gray-50 rounded-2xl text-xs space-y-1.5">
                    <div>
                        <span class="block text-[9px] font-bold text-gray-400 uppercase">Current Address</span>
                        <span class="font-bold text-gray-800">${s.currentAddress}</span>
                    </div>
                    <div>
                        <span class="block text-[9px] font-bold text-gray-400 uppercase">Permanent Address</span>
                        <span class="font-bold text-gray-800">${s.permanentAddress}</span>
                    </div>
                </div>
            </div>

            <!-- Assigned Subjects -->
            <div>
                <h4 class="text-[10px] font-black uppercase tracking-wider text-blue-700 mb-2">Curriculum Subjects</h4>
                <div class="flex flex-wrap gap-1.5">
                    ${s.subjects.length > 0 ? s.subjects.map(subj => `
                        <span class="px-2.5 py-1 bg-blue-50 text-blue-800 rounded-lg text-[10px] font-bold border border-blue-200">
                            <i class="fas fa-book text-[8px] mr-1 text-blue-500"></i>${subj}
                        </span>
                    `).join('') : '<span class="text-xs text-gray-400 italic">No assigned subjects</span>'}
                </div>
            </div>

            <!-- Verification Documents Roster with Reliable Viewer -->
            <div>
                <div class="flex items-center justify-between mb-2">
                    <h4 class="text-[10px] font-black uppercase tracking-wider text-blue-700">Attached Documents</h4>
                    <span class="text-[9px] font-bold text-gray-500">${s.documentCount} Attached</span>
                </div>
                <div class="space-y-1.5">
                    ${s.documents.length > 0 ? s.documents.map(doc => {
                        const escapedUrl = encodeURIComponent(doc.url || '');
                        const escapedName = encodeURIComponent(doc.name || doc.type || 'Document');
                        const escapedType = encodeURIComponent(doc.type || 'Official Record');
                        return `
                            <div class="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-200">
                                <div class="flex items-center gap-2 min-w-0">
                                    <i class="fas fa-file-contract text-blue-600 text-xs flex-shrink-0"></i>
                                    <div class="min-w-0">
                                        <span class="block text-xs font-bold text-gray-800 truncate">${doc.name || doc.type}</span>
                                        <span class="block text-[9px] text-gray-400">${doc.type}</span>
                                    </div>
                                </div>
                                <div class="flex items-center gap-1.5 flex-shrink-0">
                                    <button type="button" onclick="openDocumentPreview('${escapedUrl}', '${escapedName}', '${escapedType}')" class="px-2.5 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1">
                                        <i class="fas fa-eye text-[9px]"></i> View
                                    </button>
                                    <a href="${doc.url}" download class="p-1.5 text-gray-400 hover:text-blue-700 hover:bg-gray-200 rounded-lg transition-colors" title="Download">
                                        <i class="fas fa-download text-xs"></i>
                                    </a>
                                </div>
                            </div>
                        `;
                    }).join('') : '<div class="text-xs text-gray-400 italic p-3 bg-gray-50 rounded-xl text-center">No documents uploaded for this student</div>'}
                </div>
            </div>

            <!-- Modal Footer -->
            <div class="flex items-center justify-between pt-3 border-t border-gray-100">
                <button type="button" onclick="closeStudentDetailModal()" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors">
                    Close
                </button>
                <button type="button" onclick="handleEditStudent('${s.id}')" class="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5">
                    <i class="fas fa-edit text-xs"></i> Edit Student
                </button>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
}

function closeStudentDetailModal() {
    const modal = document.getElementById('student-detail-modal');
    if (modal) modal.classList.add('hidden');
}

// In-App Document Preview Modal Functions (Completely eliminates blank info screens)
function openDocumentPreview(encodedUrl, encodedName, encodedType) {
    const url = decodeURIComponent(encodedUrl || '');
    const name = decodeURIComponent(encodedName || 'Attached Document');
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

    // Check if it's an image or PDF
    const isImage = /\.(jpg|jpeg|png|webp|gif|svg)($|\?)/i.test(url);
    if (isImage) {
        bodyEl.innerHTML = `
            <div class="flex flex-col items-center justify-center p-4">
                <img src="${url}" alt="${name}" class="max-h-[60vh] max-w-full rounded-xl shadow-sm object-contain border border-gray-200 bg-white">
            </div>
        `;
    } else {
        // Embed PDF via iframe with immediate fallback message
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
}

function closeDocumentPreview() {
    const modal = document.getElementById('document-preview-modal');
    if (modal) modal.classList.add('hidden');
    const bodyEl = document.getElementById('doc-preview-body');
    if (bodyEl) bodyEl.innerHTML = ''; // release memory/iframe
}

// Handlers
function handleSelectClass(classId) {
    if (!studentViewEngine) return;
    studentViewEngine.setSelectedClass(classId);

    const refreshedStudents = studentViewEngine.getFilteredStudents();
    const stats = studentViewEngine.getClassStatistics(classId);

    const statsEl = document.getElementById('student-stats-strip');
    if (statsEl) statsEl.innerHTML = renderStudentStatsHtml(stats);

    const gridEl = document.getElementById('student-cards-grid');
    if (gridEl) gridEl.innerHTML = renderStudentCardsListHtml(refreshedStudents);

    // Sync select dropdown if triggered externally
    const selectEl = document.getElementById('student-class-select');
    if (selectEl && selectEl.value !== String(classId)) {
        selectEl.value = String(classId);
    }
}

// Compatibility wrapper
function handleSelectClassTab(classId) {
    handleSelectClass(classId);
}

function handleStudentSearch(val) {
    if (!studentViewEngine) return;
    studentViewEngine.setSearchQuery(val);

    const clearBtn = document.getElementById('student-search-clear');
    if (clearBtn) {
        if (val && val.trim()) clearBtn.classList.remove('hidden');
        else clearBtn.classList.add('hidden');
    }

    const filtered = studentViewEngine.getFilteredStudents();
    const gridEl = document.getElementById('student-cards-grid');
    if (gridEl) gridEl.innerHTML = renderStudentCardsListHtml(filtered);
}

function clearStudentSearch() {
    const input = document.getElementById('student-search-input');
    if (input) input.value = '';
    handleStudentSearch('');
}

function handleStudentViewBack() {
    if (typeof adminRouter === 'function') {
        adminRouter('dashboard');
    } else {
        window.location.href = 'admin.html';
    }
}

function navigateToAddStudent() {
    if (typeof adminRouter === 'function') {
        adminRouter('addStudent');
    } else {
        window.location.href = 'student-add.html';
    }
}

function handleEditStudent(studentId) {
    closeStudentDetailModal();
    if (typeof adminRouter === 'function') {
        adminRouter('editStudent', { id: studentId });
    } else {
        window.location.href = `student-edit.html?id=${encodeURIComponent(studentId)}`;
    }
}

// Global Exports
if (typeof window !== 'undefined') {
    window.initStudentView = initStudentView;
    window.handleSelectClass = handleSelectClass;
    window.handleSelectClassTab = handleSelectClassTab;
    window.handleStudentSearch = handleStudentSearch;
    window.clearStudentSearch = clearStudentSearch;
    window.handleStudentViewBack = handleStudentViewBack;
    window.navigateToAddStudent = navigateToAddStudent;
    window.openStudentDetailModal = openStudentDetailModal;
    window.closeStudentDetailModal = closeStudentDetailModal;
    window.openDocumentPreview = openDocumentPreview;
    window.closeDocumentPreview = closeDocumentPreview;
    window.handleEditStudent = handleEditStudent;
}
