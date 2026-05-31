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
                <button onclick="await alert('Attendance logs are summarized dynamically inside Parent App Dashboard!')" class="bg-gray-800 text-white p-4 rounded-xl text-xs font-bold shadow-lg active:scale-95 transition-all">
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

async function saveStudent() {
    const fname = document.getElementById('std-fname').value.trim();
    const mname = document.getElementById('std-mname').value.trim();
    const lname = document.getElementById('std-lname').value.trim();
    const gender = document.getElementById('std-gender').value;
    const dob = document.getElementById('std-dob').value;
    const blood = document.getElementById('std-blood').value;
    const age = document.getElementById('std-age').value.trim();
    const currentBSYear = getNepaliDateClass() ? new (getNepaliDateClass())().getYear() : 2083;
    const joinYear = document.getElementById('std-join').value.trim() || currentBSYear;
    const father = document.getElementById('std-father').value.trim();
    const mother = document.getElementById('std-mother').value.trim();
    const phoneInput = document.getElementById('std-phone').value.trim();
    const email = document.getElementById('std-email').value.trim();
    
    const finalClass = document.getElementById('std-class-lvl').value.trim();
    const section = "General"; // Always default to General section
    
    const snapSubj = await db.ref(`school/class_configs/${finalClass}/subjects/compulsory`).once('value');
    const compConfig = snapSubj.val() || { };
    const selectedSubjects = Object.values(compConfig);

    const cStreet = document.getElementById('std-curr-street').value.trim();
    const cCity = document.getElementById('std-curr-city').value.trim();
    const cDistrict = document.getElementById('std-curr-district').value.trim();
    const pStreet = document.getElementById('std-perm-street').value.trim();
    const pCity = document.getElementById('std-perm-city').value.trim();
    const pDistrict = document.getElementById('std-perm-district').value.trim();

    const photoFile = document.getElementById('std-photo-input').files[0];
    const birthFile = document.getElementById('std-birth-input').files[0];
    const transferFile = document.getElementById('std-transfer-input').files[0];

    if (!fname || !lname || !phoneInput || !finalClass) {
        await alert("Please fill all required fields (First & Last Name, Class, Phone)");
        return;
    }

    const studentId = generateStudentID(joinYear);
    let photoUrl = "https://via.placeholder.com/150";
    let birthUrl = "N/A";
    let transferUrl = "N/A";

    try {
        if (photoFile) {
            photoUrl = await uploadFile(photoFile, `school/students/${studentId}/profile.jpg`, "Adding Student");
        }
        if (birthFile) {
            birthUrl = await uploadFile(birthFile, `school/students/${studentId}/birth_certificate.jpg`, "Adding Student");
        }
        if (transferFile) {
            transferUrl = await uploadFile(transferFile, `school/students/${studentId}/transfer_certificate.jpg`, "Adding Student");
        }

        const studentData = {
            id: studentId,
            name: {
                first: fname,
                middle: mname,
                last: lname
            },
            gender,
            dob,
            age: age || 'N/A',
            bloodGroup: blood,
            class: finalClass,
            section: section,
            roll: '01',
            joinYear: joinYear,
            fatherName: father,
            motherName: mother,
            phone: phoneInput,
            parentEmail: email || 'N/A',
            address: {
                current: { street: cStreet, city: cCity, district: cDistrict },
                permanent: { street: pStreet, city: pCity, district: pDistrict }
            },
            photo: photoUrl,
            birthCertificate: birthUrl,
            transferCertificate: transferUrl,
            academic: {
                subjects: selectedSubjects,
                session: joinYear
            },
            createdAt: firebase.database.ServerValue.TIMESTAMP
        };

        const phones = phoneInput.split(',').map(p => p.trim()).filter(p => p.length >= 10);

        await db.ref('school/students/' + studentId).set(studentData);

        for (const phone of phones) {
            await db.ref('school/login_mappings/' + phone).set({
                studentId: studentId,
                role: 'parent'
            });
        }

        await alert(`Student Registered Successfully!\nGenerated Student ID: ${studentId}`);
        adminRouter('dashboard');
    } catch (e) {
        console.error(e);
        hideUploadProgress();
        await alert("Error saving student record: " + e.message);
    }
}

async function deleteStudent(studentId) {
    if (!confirm("Are you sure you want to permanently delete this student record?")) return;
    try {
        const snap = await db.ref('school/students/' + studentId).once('value');
        if (snap.exists()) {
            const data = snap.val();
            if (data.phone) {
                const phones = data.phone.split(',').map(p => p.trim()).filter(p => p.length >= 10);
                for (const phone of phones) {
                    await db.ref('school/login_mappings/' + phone).remove();
                }
            }
        }
        await db.ref('school/students/' + studentId).remove();
        await alert("Student record deleted successfully.");
        adminRouter('viewStudents');
    } catch (e) {
        await alert("Failed to delete record: " + e.message);
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
