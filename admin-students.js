// Admin Students Management Module

async function loadStudentsList() {
    const list = document.getElementById('student-list');
    const lvlFilter = document.getElementById('filter-level')?.value || 'all';
    const secFilter = document.getElementById('filter-section')?.value || 'all';
    
    if (!list) return;
    try {
        const snap = await db.ref('school/students').once('value');
        const students = snap.val();
        if (!students) {
            list.innerHTML = `<div class="text-center py-10 text-gray-400">No students registered yet.</div>`;
            return;
        }
        let studentEntries = Object.entries(students);

        // Advanced Dual-Filter Logic
        studentEntries = studentEntries.filter(([id, data]) => {
            const matchesLvl = (lvlFilter === 'all') || (String(data.class) === String(lvlFilter));
            const matchesSec = (secFilter === 'all') || (String(data.section) === String(secFilter));
            return matchesLvl && matchesSec;
        });

        if (studentEntries.length === 0) {
            list.innerHTML = `<div class="text-center py-8 text-yellow-600 bg-yellow-50 rounded-xl text-xs p-4 border border-yellow-100">No students found matching filters.</div>`;
            return;
        }
        studentEntries.sort((a, b) => {
            const nameA = (a[1].name?.first || a[1].name || '').toLowerCase();
            const nameB = (b[1].name?.first || b[1].name || '').toLowerCase();
            return nameA.localeCompare(nameB);
        });

        list.innerHTML = studentEntries.map(([studentId, data]) => {
            let fullName = '';
            if (data.name && typeof data.name === 'object') {
                fullName = `${data.name.first || ''} ${data.name.middle || ''} ${data.name.last || ''}`.replace(/\s+/g, ' ').trim();
            } else {
                fullName = data.name || 'Student';
            }
            return `
                <div onclick="viewStudentProfile('${studentId}')" class="mobile-card list-item flex items-center p-4 cursor-pointer active:bg-gray-50 bg-white">
                    <img src="${SafeResolvers.photo(data.photo)}" class="w-12 h-12 rounded-xl object-cover mr-4 border border-gray-100">
                    <div class="flex-grow">
                        <h4 class="font-bold text-gray-800">${fullName}</h4>
                        <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Class ${SafeResolvers.text(data.class)} | ID: ${studentId}</p>
                    </div>
                    <i class="fas fa-chevron-right text-gray-200 text-xs"></i>
                </div>
            `;
        }).join('');
    } catch (e) {
        list.innerHTML = `<div class="text-center py-10 text-red-400">Error retrieving data: ${e.message}</div>`;
    }
}

async function viewStudentProfile(studentId) {
    adminRouter('studentDetails');
    const container = document.getElementById('student-profile-container');
    if (!container) return;
    try {
        const snap = await db.ref('school/students/' + studentId).once('value');
        const data = snap.val();

        let fname = '', mname = '', lname = '';
        if (data.name && typeof data.name === 'object') {
            fname = data.name.first || '';
            mname = data.name.middle || '';
            lname = data.name.last || '';
        } else {
            const parts = (data.name || '').split(' ');
            fname = parts[0] || '';
            lname = parts.slice(1).join(' ') || '';
        }

        const bloodGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-", "Unknown"];
        const bloodSelectHtml = bloodGroups.map(bg => `
            <option value="${bg}" ${data.bloodGroup === bg ? 'selected' : ''}>${bg}</option>
        `).join('');
        
        container.innerHTML = `
            <div class="flex flex-col items-center py-6">
                <div class="w-32 h-32 rounded-3xl overflow-hidden border-4 border-white shadow-xl mb-4 relative">
                    <img src="${SafeResolvers.photo(data.photo)}" class="w-full h-full object-cover">
                </div>
                <h2 class="text-2xl font-black text-gray-800">${fname} ${lname}</h2>
                <span class="text-xs text-blue-600 font-bold uppercase tracking-widest mt-1">Class ${SafeResolvers.text(data.class)}</span>
                <p class="text-[10px] text-gray-400 mt-1 font-bold">Student ID: ${studentId}</p>
            </div>

            <!-- INTERACTIVE PROFILE FORM -->
            <div class="space-y-4">
                <div class="mobile-card space-y-3">
                    <h4 class="text-xs font-black uppercase text-blue-600 mb-2 tracking-wider">1. Academic & Personal Names</h4>
                    <div class="grid grid-cols-3 gap-2">
                        <div>
                            <label class="block text-[8px] font-bold text-gray-400 uppercase mb-0.5">First Name</label>
                            <input type="text" id="edit-std-fname" value="${fname}" class="w-full p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold outline-none">
                        </div>
                        <div>
                            <label class="block text-[8px] font-bold text-gray-400 uppercase mb-0.5">Middle Name</label>
                            <input type="text" id="edit-std-mname" value="${mname}" class="w-full p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold outline-none">
                        </div>
                        <div>
                            <label class="block text-[8px] font-bold text-gray-400 uppercase mb-0.5">Last Name</label>
                            <input type="text" id="edit-std-lname" value="${lname}" class="w-full p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold outline-none">
                        </div>
                    </div>
                </div>

                <div class="mobile-card">
                    <div>
                        <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1">Class Code (1-8)</label>
                        <input type="text" id="edit-std-class" value="${SafeResolvers.text(data.class)}" class="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold outline-none">
                    </div>
                    <input type="hidden" id="edit-std-section" value="${SafeResolvers.text(data.section || 'General')}">
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <div class="mobile-card">
                        <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1">Blood Group</label>
                        <select id="edit-std-blood" class="w-full p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold outline-none">
                            ${bloodSelectHtml}
                        </select>
                    </div>
                    <div class="mobile-card">
                        <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1">Roll Number</label>
                        <input type="text" id="edit-std-roll" value="${SafeResolvers.text(data.roll)}" class="w-full p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold outline-none">
                    </div>
                </div>

                <div class="grid grid-cols-3 gap-2">
                    <div class="mobile-card !p-3">
                        <label class="block text-[8px] font-bold text-gray-400 uppercase mb-0.5">Date of Birth (BS)</label>
                        <input type="text" id="edit-std-dob" value="${data.dob || ''}" placeholder="YYYY-MM-DD" oninput="calculateNepaliAgeEdit()" class="w-full p-1.5 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold outline-none">
                    </div>
                    <div class="mobile-card !p-3">
                        <label class="block text-[8px] font-bold text-gray-400 uppercase mb-0.5">Student Age</label>
                        <input type="number" id="edit-std-age" readonly value="${data.age || ''}" class="w-full p-1.5 bg-gray-100 border border-gray-100 rounded-lg text-xs font-bold outline-none cursor-not-allowed">
                    </div>
                    <div class="mobile-card !p-3">
                        <label class="block text-[8px] font-bold text-gray-400 uppercase mb-0.5">Join Year</label>
                        <input type="text" id="edit-std-joinYear" value="${data.joinYear || ''}" class="w-full p-1.5 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold outline-none">
                    </div>
                </div>

                <div class="mobile-card space-y-3">
                    <h4 class="text-xs font-black uppercase text-blue-600 mb-1 tracking-wider">2. Contact & Family Info</h4>
                    <div>
                        <label class="block text-[8px] font-bold text-gray-400 uppercase mb-0.5">Father's Name</label>
                        <input type="text" id="edit-std-father" value="${SafeResolvers.text(data.fatherName || data.parentName)}" class="w-full p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold outline-none">
                    </div>
                    <div>
                        <label class="block text-[8px] font-bold text-gray-400 uppercase mb-0.5">Mother's Name</label>
                        <input type="text" id="edit-std-mother" value="${SafeResolvers.text(data.motherName)}" class="w-full p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold outline-none">
                    </div>
                    <div>
                        <label class="block text-[8px] font-bold text-gray-400 uppercase mb-0.5">Registered Mobiles</label>
                        <input type="text" id="edit-std-phone" value="${SafeResolvers.text(data.phone)}" class="w-full p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold outline-none">
                    </div>
                </div>

                <button onclick="updateStudentProfile('${studentId}')" class="w-full bg-blue-700 text-white font-black py-4 rounded-2xl shadow-md active:scale-95 transition-all text-sm mb-4">
                    <i class="fas fa-save mr-2"></i> Save Profile Changes
                </button>
            </div>

            <!-- ENROLLMENT TERMINATION & INCIDENT LOGGING PANEL -->
            <div class="mobile-card bg-white p-5 border border-gray-100 shadow-sm rounded-2xl space-y-3 mt-6 text-left">
                <h4 class="text-xs font-black uppercase text-red-600 mb-1 tracking-wider"><i class="fas fa-exclamation-triangle mr-1"></i> Enrollment & Status Updates</h4>
                <p class="text-[10px] text-gray-400 font-bold leading-relaxed uppercase">Update enrollment status (e.g., Left or Expelled) and document official incident reports below.</p>
                
                <div class="grid grid-cols-2 gap-3 mt-2">
                    <div>
                        <label class="block text-[8px] font-bold text-gray-400 uppercase mb-1">Target Status</label>
                        <select id="status-update-action" class="w-full p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold outline-none">
                            <option value="Active" ${data.status === 'Active' ? 'selected' : ''}>Active</option>
                            <option value="Left" ${data.status === 'Left' ? 'selected' : ''}>Left School</option>
                            <option value="Expelled" ${data.status === 'Expelled' ? 'selected' : ''}>Expelled</option>
                            <option value="Investigated">Under Investigation</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-[8px] font-bold text-gray-400 uppercase mb-1">Date of Incident</label>
                        <input type="text" id="status-update-date" class="w-full p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold outline-none" value="${getFormattedCurrentNepaliDate()}">
                    </div>

                <div>
                    <label class="block text-[8px] font-bold text-gray-400 uppercase mb-1">Official Incident Notes / Reasons</label>
                    <textarea id="status-update-reason" rows="3" class="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none resize-none" placeholder="Enter formal decision notes..."></textarea>
                </div>

                <button onclick="logStudentStatusUpdate('${studentId}')" class="w-full bg-red-600 hover:bg-red-700 text-white font-black py-3 rounded-xl shadow-md active:scale-95 transition-all text-xs">
                    <i class="fas fa-file-signature mr-1.5"></i> Log Decision & Update Status
                </button>
            </div>

            <!-- INCIDENT HISTORY SUB-PANEL -->
            <div class="mt-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-left">
                <h4 class="text-xs font-black uppercase text-gray-800 mb-3 tracking-wider"><i class="fas fa-history mr-1"></i> Student Incident Archive</h4>
                <div id="admin-pupil-incident-history" class="space-y-3"></div>
            </div>

            <div class="mt-4 grid grid-cols-2 gap-3">
                <button onclick="viewStudentAttendance('${studentId}', '${data.class}')" class="bg-gray-800 text-white p-4 rounded-xl text-xs font-bold shadow-lg active:scale-95 transition-all">
                    View Attendance
                </button>
                <button onclick="adminRouter('examsManagement')" class="bg-indigo-600 text-white p-4 rounded-xl text-xs font-bold shadow-lg active:scale-95 transition-all">
                    Manage Marks
                </button>
            </div>
            
            <button onclick="deleteStudent('${studentId}')" class="w-full mt-4 bg-red-50 text-red-600 p-4 rounded-xl text-xs font-black active:scale-95 transition-all">
                <i class="fas fa-trash-alt mr-2"></i> Delete Student Record
            </button>

            <button onclick="adminRouter('viewStudents')" class="w-full text-gray-400 font-bold py-6 text-xs text-center block">
                <i class="fas fa-arrow-left mr-1"></i> Back to Directory
            </button>
        `;

        setTimeout(() => {
            renderSharedStudentIncidentHistory('admin-pupil-incident-history', studentId);
        }, 50);
    } catch (e) {
        container.innerHTML = `<div class="text-center py-10 text-red-400">Error fetching student profile: ${e.message}</div>`;
    }
}

async function updateStudentProfile(studentId) {
    try {
        const first = document.getElementById('edit-std-fname').value.trim();
        const middle = document.getElementById('edit-std-mname').value.trim();
        const last = document.getElementById('edit-std-lname').value.trim();
        const stdClass = document.getElementById('edit-std-class').value.trim();
        const stdSection = document.getElementById('edit-std-section').value.trim();
        const blood = document.getElementById('edit-std-blood').value;
        const roll = document.getElementById('edit-std-roll').value.trim();
        const age = parseInt(document.getElementById('edit-std-age').value) || null;
        const dob = document.getElementById('edit-std-dob').value.trim();
        const joinYear = document.getElementById('edit-std-joinYear').value.trim();
        const father = document.getElementById('edit-std-father').value.trim();
        const mother = document.getElementById('edit-std-mother').value.trim();
        const phone = document.getElementById('edit-std-phone').value.trim();

        if (!first || !last || !stdClass || !stdSection || !phone) {
            await alert("Names, Class, Section, and Registered Mobile are required fields!");
            return;
        }

        const updates = {
            "name/first": first,
            "name/middle": middle,
            "name/last": last,
            class: stdClass,
            section: stdSection,
            bloodGroup: blood,
            roll: roll,
            age: age,
            dob: dob,
            joinYear: joinYear,
            fatherName: father,
            motherName: mother,
            phone: phone
        };

        await db.ref('school/students/' + studentId).update(updates);
        await alert("Student profile updated successfully!");
        viewStudentProfile(studentId);
    } catch (e) {
        console.error(e);
        await alert("Failed to update student profile: " + e.message);
    }
}

// Legacy saveStudent replaced by modular StudentAddModule
async function saveStudent() {
    if (typeof handleRegisterStudent === 'function') {
        return handleRegisterStudent();
    }
}

async function deleteStudent(studentId) {
    if (!confirm("Are you sure you want to archive this student record (Soft Delete)?")) return;
    try {
        const snap = await db.ref('school/students/' + studentId).once('value');
        if (snap.exists()) {
            const data = snap.val();
            data.archivedAt = Date.now();
            data.archiveType = "soft_delete";
            
            await db.ref('school/archives/students/' + studentId).set(data);
            
            if (data.phone) {
                const phones = data.phone.split(',').map(p => p.trim()).filter(p => p.length >= 10);
                for (const phone of phones) {
                    await db.ref('school/login_mappings/' + phone).remove();
                }
            }
            
            await db.ref('school/students/' + studentId).remove();
            await alert("Student record archived successfully.");
            adminRouter('viewStudents');
        } else {
            await alert("Student record not found.");
        }
    } catch (e) {
        await alert("Failed to archive record: " + e.message);
    }
}

function syncStudentAddress(checkbox) {
    const fields = ['street', 'city', 'district'];
    fields.forEach(f => {
        const currVal = document.getElementById('std-curr-' + f).value;
        const permInput = document.getElementById('std-perm-' + f);
        if (checkbox.checked) {
            permInput.value = currVal;
        } else {
            permInput.value = '';
        }
    });
}

async function logStudentStatusUpdate(studentId) {
    const selectedStatus = document.getElementById('status-update-action').value;
    const dateText = document.getElementById('status-update-date').value.trim();
    const reasonText = document.getElementById('status-update-reason').value.trim();

    if (!reasonText) {
        await alert("Please specify the notes/reasons for this enrollment status modification.");
        return;
    }

    try {
        // Retrieve student's current details to log full name
        const snap = await db.ref('school/students/' + studentId).once('value');
        if (!snap.exists()) {
            await alert("Student profile not found.");
            return;
        }
        const data = snap.val();
        let fullName = '';
        if (data.name && typeof data.name === 'object') {
            fullName = `${data.name.first || ''} ${data.name.middle || ''} ${data.name.last || ''}`.replace(/\s+/g, ' ').trim();
        } else {
            fullName = data.name || 'Student';
        }

        // Update student status in DB
        await db.ref(`school/students/${studentId}`).update({ status: selectedStatus });

        // Push new record to the shared student status history node
        const historyId = db.ref('school/student_status_history').push().key;
        const logData = {
            id: historyId,
            studentId: studentId,
            studentName: fullName,
            status: selectedStatus,
            reason: reasonText,
            recordedBy: currentUser?.name || "School Administrator",
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            date: dateText || getFormattedCurrentNepaliDate()
        };
        await db.ref(`school/student_status_history/${historyId}`).set(logData);

        await alert(`Success! Incident log added and student status is now set to '${selectedStatus}'.`);
        
        // Refresh profile UI
        viewStudentProfile(studentId);

    } catch (e) {
        console.error(e);
        await alert("Failed to log status update: " + e.message);
    }
}

async function viewStudentAttendance(studentId, studentClass) {
    let modal = document.getElementById('admin-attendance-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'admin-attendance-modal';
        modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[2000] p-4 animate-fade-in';
        document.body.appendChild(modal);
    }
    modal.innerHTML = `
        <div class="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-scale-up text-left">
            <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div>
                    <h3 class="text-sm font-black text-gray-800 uppercase tracking-wider">Attendance History</h3>
                    <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Student ID: ${studentId} | Class ${studentClass}</p>
                </div>
                <button onclick="document.getElementById('admin-attendance-modal').remove()" class="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center active:scale-90 transition-transform">
                    <i class="fas fa-times text-xs"></i>
                </button>
            </div>
            <div class="p-6 flex-grow overflow-y-auto space-y-4" id="admin-attendance-modal-body">
                <div class="text-center py-10 text-gray-400 text-xs font-bold">
                    <i class="fas fa-spinner fa-spin mr-2"></i> Loading attendance history...
                </div>
            </div>
        </div>
    `;

    try {
        const days = await DatabaseService.getAttendance(studentClass);
        const modalBody = document.getElementById('admin-attendance-modal-body');
        if (!modalBody) return;

        if (!days || Object.keys(days).length === 0) {
            modalBody.innerHTML = `
                <div class="text-center py-12 text-gray-500 bg-gray-50 rounded-2xl text-xs p-6 border border-gray-100 font-bold">
                    <i class="fas fa-info-circle text-2xl mb-2 block text-gray-400"></i>
                    No attendance records registered for this student yet.
                </div>
            `;
            return;
        }

        let totalLogs = 0;
        let presentLogs = 0;
        let historyList = [ ];

        Object.entries(days).forEach(([dateStr, students]) => {
            if (students && students[studentId]) {
                const log = students[studentId];
                totalLogs++;
                if (log.status === 'present') presentLogs++;
                historyList.push({
                    date: dateStr,
                    status: log.status,
                    teacher: log.teacherName || log.teacher || "Faculty"
                });
            }
        });

        if (totalLogs === 0) {
            modalBody.innerHTML = `
                <div class="text-center py-12 text-gray-500 bg-gray-50 rounded-2xl text-xs p-6 border border-gray-100 font-bold">
                    <i class="fas fa-info-circle text-2xl mb-2 block text-gray-400"></i>
                    No attendance records registered for this student yet.
                </div>
            `;
            return;
        }

        const pct = (presentLogs / totalLogs) * 100;
        
        // Sort history by date descending
        historyList.sort((a, b) => b.date.localeCompare(a.date));

        let historyHtml = historyList.map(h => {
            const dateParts = h.date.split('-');
            const dayStr = dateParts[2] || "01";
            const monthNames = ["BAI", "JST", "ASH", "SHW", "BHD", "ASW", "KRT", "MNG", "PSH", "MGH", "FLG", "CHT"];
            const monthIdx = parseInt(dateParts[1]) - 1;
            const monthStr = isNaN(monthIdx) ? "JST" : (monthNames[monthIdx] || "JST");
            const isPresent = h.status === 'present';

            return `
                <div class="flex items-center p-3 bg-white rounded-2xl border border-gray-100 shadow-sm text-left">
                    <div class="w-10 h-10 ${isPresent ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'} rounded-xl flex flex-col items-center justify-center mr-4 flex-shrink-0">
                        <span class="text-xs font-black">${dayStr}</span>
                        <span class="text-[8px] font-bold uppercase">${monthStr}</span>
                    </div>
                    <div class="flex-grow">
                        <h4 class="text-xs font-bold text-gray-800">${isPresent ? 'Present' : 'Absent'} - Class session</h4>
                        <p class="text-[9px] text-gray-400 mt-0.5">Teacher: ${h.teacher}</p>
                    </div>
                    <span class="text-[9px] font-black ${isPresent ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'} px-2 py-1 rounded-lg uppercase">${h.status}</span>
                </div>
            `;
        }).join('');

        modalBody.innerHTML = `
            <div class="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-center justify-between">
                <div>
                    <p class="text-[9px] text-blue-500 font-bold uppercase tracking-wider">Attendance Rate</p>
                    <h4 class="text-2xl font-black text-blue-700 mt-0.5">${pct.toFixed(1)}%</h4>
                </div>
                <div class="text-right text-xs font-bold text-gray-500">
                    <p>${presentLogs} Days Present</p>
                    <p class="text-[10px] opacity-75">${totalLogs} Total Recorded Days</p>
                </div>
            </div>
            
            <div class="space-y-2 mt-4">
                <h4 class="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Chronological History</h4>
                <div class="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                    ${historyHtml}
                </div>
            </div>
        `;
    } catch (e) {
        console.error(e);
        const modalBody = document.getElementById('admin-attendance-modal-body');
        if (modalBody) {
            modalBody.innerHTML = `<div class="text-center py-10 text-red-400 text-xs font-bold">Failed to load attendance history: ${e.message}</div>`;
        }
    }
}
