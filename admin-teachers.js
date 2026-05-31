// Admin Teachers Management Module

async function loadTeachersList() {
    renderSharedTeacherDirectory('teacher-list-container', { showAdminActions: true });
}

async function viewTeacherProfileDetails(teacherId) {
    adminRouter('studentDetails'); // Recycle same subview container
    const container = document.getElementById('student-profile-container');
    if (!container) return;
    try {
        const snap = await db.ref('school/teachers/' + teacherId).once('value');
        const data = snap.val();

        let fullName = '';
        if (data.name && typeof data.name === 'object') {
            fullName = `${data.name.first || ''} ${data.name.middle || ''} ${data.name.last || ''}`.replace(/\s+/g, ' ').trim();
        } else {
            fullName = data.name || 'Faculty';
        }

        const statuses = ["Active", "On Duty", "In Class", "On Leave", "Off Duty", "Principal", "Vice Principal", "HOD"];
        const statusOptions = statuses.map(s => `<option value="${s}" ${data.statusLabel === s ? 'selected' : ''}>${s}</option>`).join('');

        const departments = [
            { key: "None", val: "None / Administrative" },
            { key: "DEPARTMENT_MATH", val: "Mathematics Dept." },
            { key: "DEPARTMENT_SCIENCE", val: "Science Dept." },
            { key: "DEPARTMENT_LANGUAGES", val: "Languages Dept." },
            { key: "DEPARTMENT_SOCIAL", val: "Social Studies Dept." },
            { key: "DEPARTMENT_COMPUTERS", val: "Computer Science Dept." }
        ];
        const deptOptions = departments.map(d => `<option value="${d.key}" ${data.department === d.key ? 'selected' : ''}>${d.val}</option>`).join('');

        const divisions = [
            { key: "None", val: "None / Specialist" },
            { key: "DIVISION_PRIMARY", val: "Primary Division (Grades 1-5)" },
            { key: "DIVISION_LOWER_SEC", val: "Lower Secondary Division (Grades 6-8)" }
        ];
        const divOptions = divisions.map(d => `<option value="${d.key}" ${data.division === d.key ? 'selected' : ''}>${d.val}</option>`).join('');
        
        container.innerHTML = `
            <div class="flex flex-col items-center py-6">
                <div class="w-32 h-32 rounded-3xl overflow-hidden border-4 border-white shadow-xl mb-4">
                    <img src="${SafeResolvers.photo(data.photo)}" class="w-full h-full object-cover">
                </div>
                <h2 class="text-2xl font-black text-gray-800">${fullName}</h2>
                <span class="text-xs text-purple-600 font-bold uppercase tracking-widest mt-1">${SafeResolvers.text(data.statusLabel, 'Active')}</span>
                <p class="text-[10px] text-gray-400 mt-1 font-bold">Faculty ID: ${teacherId}</p>
            </div>

            <!-- INTERACTIVE TEACHER OPERATIONS FORM -->
            <div class="space-y-4">
                <div class="mobile-card space-y-3">
                    <h4 class="text-xs font-black uppercase text-purple-600 mb-2 tracking-wider">1. Hierarchy & Availability Status</h4>
                    
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1">Professional Title</label>
                            <input type="text" id="edit-t-title" value="${SafeResolvers.text(data.professionalTitle, 'Faculty Member')}" class="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold outline-none">
                        </div>
                        <div>
                            <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1">Sort Order (Hierarchy)</label>
                            <input type="number" id="edit-t-sortOrder" value="${data.sortOrder !== undefined ? data.sortOrder : 10}" class="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold outline-none">
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1">Availability Status</label>
                            <select id="edit-t-status" class="w-full p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold outline-none">
                                ${statusOptions}
                            </select>
                        </div>
                        <div>
                            <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1">Joined Year</label>
                            <input type="text" id="edit-t-joinedYear" value="${data.joinedYear || ''}" class="w-full p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold outline-none">
                        </div>
                    </div>

                    <div class="flex items-center gap-2 pt-2">
                        <input type="checkbox" id="edit-t-available" ${data.isAvailable !== false ? 'checked' : ''} class="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500">
                        <label for="edit-t-available" class="text-xs font-bold text-gray-600">Currently Available for Schedule Blocks</label>
                    </div>
                </div>

                <div class="mobile-card space-y-3">
                    <h4 class="text-xs font-black uppercase text-purple-600 mb-2 tracking-wider">2. Academic Department & divisions</h4>
                    
                    <div>
                        <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1">Subject Department</label>
                        <select id="edit-t-dept" class="w-full p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold outline-none">
                            ${deptOptions}
                        </select>
                    </div>

                    <div>
                        <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1">Grade-Level Division</label>
                        <select id="edit-t-div" class="w-full p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold outline-none">
                            ${divOptions}
                        </select>
                    </div>

                    <div class="flex items-center gap-2 pt-2">
                        <input type="checkbox" id="edit-t-isHead" ${data.isDepartmentHead ? 'checked' : ''} class="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500">
                        <label for="edit-t-isHead" class="text-xs font-bold text-gray-600">Head of Department (HOD) Status</label>
                    </div>
                </div>

                <button onclick="updateTeacherProfile('${teacherId}')" class="w-full bg-purple-700 text-white font-black py-4 rounded-2xl shadow-md active:scale-95 transition-all text-sm mb-4">
                    <i class="fas fa-save mr-2"></i> Save Faculty Settings
                </button>
            </div>
        `;
    } catch (e) {
        container.innerHTML = `<div class="text-center py-10 text-red-400">Error fetching teacher profile: ${e.message}</div>`;
    }
}

async function updateTeacherProfile(teacherId) {
    try {
        const title = document.getElementById('edit-t-title').value.trim();
        const sortOrder = parseInt(document.getElementById('edit-t-sortOrder').value);
        const status = document.getElementById('edit-t-status').value;
        const joinedYear = document.getElementById('edit-t-joinedYear').value.trim();
        const available = document.getElementById('edit-t-available').checked;
        const dept = document.getElementById('edit-t-dept').value;
        const div = document.getElementById('edit-t-div').value;
        const isHead = document.getElementById('edit-t-isHead').checked;

        if (!title) {
            await alert("Professional Title cannot be empty!");
            return;
        }

        const updates = {
            professionalTitle: title,
            sortOrder: isNaN(sortOrder) ? 10 : sortOrder,
            statusLabel: status,
            joinedYear: joinedYear,
            isAvailable: available,
            department: dept,
            division: div,
            isDepartmentHead: isHead
        };

        await db.ref('school/teachers/' + teacherId).update(updates);
        await alert("Teacher faculty record updated successfully!");
        viewTeacherProfileDetails(teacherId);
    } catch (e) {
        console.error(e);
        await alert("Failed to update teacher settings: " + e.message);
    }
}

async function saveTeacher() {
    const fname = document.getElementById('tch-fname').value.trim();
    const mname = document.getElementById('tch-mname').value.trim();
    const lname = document.getElementById('tch-lname').value.trim();
    const gender = document.getElementById('tch-gender').value;
    const dob = document.getElementById('tch-dob').value;
    const blood = document.getElementById('tch-blood').value;
    const phone = document.getElementById('tch-phone').value.trim();
    const phone2 = document.getElementById('tch-phone2').value.trim();
    const email = document.getElementById('tch-email').value.trim();

    const cStreet = document.getElementById('tch-curr-street').value.trim();
    const cCity = document.getElementById('tch-curr-city').value.trim();
    const cDistrict = document.getElementById('tch-curr-district').value.trim();
    const pStreet = document.getElementById('tch-perm-street').value.trim();
    const pCity = document.getElementById('tch-perm-city').value.trim();
    const pDistrict = document.getElementById('tch-perm-district').value.trim();

    const qualification = document.getElementById('tch-qualification').value.trim();
    const experience = document.getElementById('tch-experience').value.trim();
    const subjects = document.getElementById('tch-subjects').value.trim();
    const classes = document.getElementById('tch-classes').value.trim();

    const photoFile = document.getElementById('tch-photo-input').files[0];

    if (!fname || !lname || !phone) {
        await alert("First Name, Last Name, and Primary Phone are required.");
        return;
    }

    const title = document.getElementById('tch-title') ? document.getElementById('tch-title').value.trim() : 'Faculty Member';
    const sortOrderVal = document.getElementById('tch-sortOrder') ? parseInt(document.getElementById('tch-sortOrder').value) : 10;
    const sortOrder = isNaN(sortOrderVal) ? 10 : sortOrderVal;
    const currentBSYear = getNepaliDateClass() ? new (getNepaliDateClass())().getYear() : 2083;
    const teacherId = `UT-${currentBSYear}-${Math.floor(1000 + Math.random() * 9000)}`;
    let photoUrl = "https://images.unsplash.com/photo-1544717305-2782549b5136?w=150";
    
    try {
        if (photoFile) photoUrl = await uploadFile(photoFile, `school/teachers/${teacherId}/profile.jpg`, "Onboarding Faculty");
        else showToast("Proceeding without profile photo", "info");

        const docRows = document.querySelectorAll('#tch-doc-vault .doc-row');
        const verifiedDocs = [ ];
        for (const row of docRows) {
            const label = row.querySelector('.doc-label').value.trim();
            const file = row.querySelector('.doc-file').files[0];
            if (file && label) {
                const url = await uploadFile(file, `school/teachers/${teacherId}/docs/${label.replace(/\s+/g, '_')}_${Date.now()}.jpg`, `Uploading ${label}`);
                verifiedDocs.push({ label, url });
            }
        }

        const teacherData = {
            id: teacherId,
            name: {
                first: fname,
                middle: mname,
                last: lname
            },
            gender,
            dob,
            bloodGroup: blood,
            phone,
            secondaryPhone: phone2 || 'N/A',
            email: email || 'N/A',
            address: {
                current: { street: cStreet, city: cCity, district: cDistrict },
                permanent: { street: pStreet, city: pCity, district: pDistrict }
            },
            qualification,
            experienceYears: experience || '0',
            verificationDocs: verifiedDocs,
            subjects: subjects.split(',').map(s => s.trim()).filter(s => s.length > 0),
            assignedClasses: classes.split(',').map(c => c.trim()).filter(c => c.length > 0),
            photo: photoUrl,
            role: 'teacher',
            professionalTitle: title,
            sortOrder: sortOrder,
            schedule: [
                { period: '1st', class: classes.split(',')[0] || '1', subject: subjects.split(',')[0] || 'Mathematics', time: '10:00 AM' }
            ],
            createdAt: firebase.database.ServerValue.TIMESTAMP
        };

        await db.ref('school/teachers/' + teacherId).set(teacherData);

        await db.ref('school/login_mappings/' + phone).set({
            studentId: teacherId,
            role: 'teacher'
        });

        await alert(`Teacher Onboarded successfully!\nAssigned Teacher ID: ${teacherId}`);
        adminRouter('dashboard');
    } catch (e) {
        console.error(e);
        await alert("Failed to onboarding faculty member: " + e.message);
    }
}

async function deleteTeacher(teacherId) {
    if (!confirm("Are you sure you want to permanently terminate this faculty contract and revoke all login accesses?")) return;
    try {
        const snap = await db.ref('school/teachers/' + teacherId).once('value');
        if (snap.exists()) {
            const data = snap.val();
            if (data.phone) {
                await db.ref('school/login_mappings/' + data.phone).remove();
            }
        }
        await db.ref('school/teachers/' + teacherId).remove();
        await alert("Faculty record terminated successfully.");
        adminRouter('viewTeachers');
    } catch (e) {
        await alert("Failed to delete record: " + e.message);
    }
}

function syncTeacherAddress(checkbox) {
    const fields = ['street', 'city', 'district'];
    fields.forEach(f => {
        const currVal = document.getElementById('tch-curr-' + f).value;
        const permInput = document.getElementById('tch-perm-' + f);
        if (checkbox.checked) {
            permInput.value = currVal;
        } else {
            permInput.value = '';
        }
    });
}

function addDocumentRow(vaultId) {
    const vault = document.getElementById(vaultId);
    const row = document.createElement('div');
    row.className = 'doc-row grid grid-cols-12 gap-2 items-end animate-fade-in';
    row.innerHTML = `
        <div class="col-span-5">
            <input type="text" class="doc-label w-full p-2 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-bold outline-none" placeholder="e.g. License">
        </div>
        <div class="col-span-5">
            <input type="file" class="doc-file w-full text-[10px] text-gray-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:bg-purple-600 file:text-white" accept="image/*">
        </div>
        <div class="col-span-2">
            <button onclick="this.parentElement.parentElement.remove()" class="w-full p-2 text-red-400 active:scale-90 transition-transform">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    `;
    vault.appendChild(row);
}
    