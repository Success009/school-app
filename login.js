// Login View Controller for Udayashree School App (Updated with Samsung-Compatible OTP jumping and Mock 0000 Bypass)

let loginStep = 1;
let tempPhone = '';

function showStep1() {
    loginStep = 1;
    document.getElementById('login-title').innerText = "School Login";
    document.getElementById('login-desc').innerText = "Enter your registered mobile number to receive an OTP";
    document.getElementById('step-1-view').classList.remove('hidden');
    document.getElementById('step-2-view').classList.add('hidden');
}

function showStep2() {
    loginStep = 2;
    document.getElementById('login-title').innerText = "Verify OTP";
    document.getElementById('login-desc').innerText = "Enter the 4-digit code sent to your phone";
    document.getElementById('step-1-view').classList.add('hidden');
    document.getElementById('step-2-view').classList.remove('hidden');
    
    const inputs = document.querySelectorAll('.otp-input');
    
    // Auto-focus and Samsung/Gboard compatible input jumping logic
    inputs.forEach((input, index) => {
        input.value = '';
        
        // Remove previous listeners by cloning
        const newInput = input.cloneNode(true);
        input.parentNode.replaceChild(newInput, input);
    });

    const freshInputs = document.querySelectorAll('.otp-input');
    freshInputs.forEach((input, index) => {
        // Handle numerical input (Samsung/Android friendly 'input' event!)
        input.addEventListener('input', (e) => {
            const val = input.value.trim();
            if (val.length >= 1) {
                input.value = val.slice(-1); // Only keep the last digit
                if (index < freshInputs.length - 1) {
                    freshInputs[index + 1].focus(); // Move cursor to next input box
                }
            }
        });

        // Handle backspacing
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace') {
                if (input.value.length === 0 && index > 0) {
                    freshInputs[index - 1].focus(); // Go back to previous input box
                } else {
                    input.value = '';
                }
            }
        });
    });

    setTimeout(() => { freshInputs[0].focus(); }, 150);
}

async function sendOTP() {
    const phoneInput = document.getElementById('login-phone').value.trim();
    // Strip everything except numbers
    const phone = phoneInput.replace(/\D/g, '');

    if (phone.length < 10) {
        await alert('Please enter a valid 10-digit mobile number');
        return;
    }

    try {
        showUploadProgress(30, "Login Process", "Verifying database entries...");
        
        // Check if phone exists in school/admin or school/head or school/login_mappings
        const adminSnap = await db.ref('school/admin/' + phone).once('value');
        const headSnap = await db.ref('school/head/' + phone).once('value');
        const mapSnap = await db.ref('school/login_mappings/' + phone).once('value');

        if (!adminSnap.exists() && !headSnap.exists() && !mapSnap.exists()) {
            hideUploadProgress();
            await alert("Invalid phone number: This mobile number is not registered in the school database.");
            return;
        }

        tempPhone = phone;
        hideUploadProgress();
        showStep2();
    } catch (error) {
        console.error("SMS Trigger failed:", error);
        hideUploadProgress();
        await alert("Verification check failed: " + error.message);
    }
}

async function handleLogin() {
    const phone = tempPhone || '9800000000';
    
    // Collect the 4 digits from inputs
    const inputs = document.querySelectorAll('.otp-input');
    let code = '';
    inputs.forEach(input => code += input.value.trim());

    if (code.length < 4) {
        await alert("Please enter the complete 4-digit verification code.");
        return;
    }

    // Default SMS bypass code to 0000
    if (code !== '0000') {
        await alert("Invalid verification code. Please enter '0000' to login.");
        return;
    }

    try {
        showUploadProgress(50, "Authentication", "Retrieving profile details...");

        // 1. Check for Super Admin phone numbers
        const adminSnap = await db.ref('school/admin/' + phone).once('value');
        if (adminSnap.exists()) {
            currentUser = { role: ROLES.ADMIN, id: 'ADM-' + phone.slice(-4), name: 'Administrator', phone: phone };
            localStorage.setItem('school_app_user', JSON.stringify(currentUser));
            hideUploadProgress();
            redirectUserToRoleDashboard(currentUser.role);
            return;
        }

        // 2. Check for Principal (Head) phone numbers
        const headSnap = await db.ref('school/head/' + phone).once('value');
        if (headSnap.exists()) {
            const headData = await db.ref('school/principal_profile').once('value');
            const p = headData.val() || { };
            currentUser = { 
                role: ROLES.PRINCIPAL, 
                id: 'HEAD-OFFICE', 
                name: p.name || 'Principal', 
                phone: phone,
                photo: p.photo || 'https://via.placeholder.com/150'
            };
            localStorage.setItem('school_app_user', JSON.stringify(currentUser));
            hideUploadProgress();
            redirectUserToRoleDashboard(currentUser.role);
            return;
        }

        // 3. Read from dynamic login mapping for Teachers/Parents/Accountants/Admins/Principals
        const mapSnap = await db.ref('school/login_mappings/' + phone).once('value');
        
        if (mapSnap.exists()) {
            const mapData = mapSnap.val();
            
            if (mapData.role === 'teacher') {
                // Resolve Teacher dynamic profile
                const tchSnap = await db.ref('school/teachers/' + mapData.studentId).once('value');
                if (tchSnap.exists()) {
                    const t = tchSnap.val();
                    
                    // Construct teacher fullname
                    let fullName = '';
                    if (t.name && typeof t.name === 'object') {
                        fullName = `${t.name.first || ''} ${t.name.middle || ''} ${t.name.last || ''}`.replace(/\s+/g, ' ').trim();
                    } else {
                        fullName = t.name || 'Faculty Member';
                    }

                    currentUser = {
                        role: ROLES.TEACHER,
                        id: mapData.studentId,
                        name: fullName,
                        phone: t.phone || phone,
                        photo: t.photo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150',
                        subjects: t.subjects || [ ],
                        assignedClasses: t.assignedClasses || [ ],
                        schedule: t.schedule || [
                            { period: '1st', class: t.assignedClasses ? t.assignedClasses[0] : '10-A', subject: t.subjects ? t.subjects[0] : 'Mathematics', time: '10:00 AM' }
                        ]
                    };
                } else {
                    throw new Error("Teacher profile not found.");
                }
            } else if (mapData.role === 'accountant') {
                currentUser = {
                    role: ROLES.ACCOUNTANT,
                    id: mapData.studentId || 'ACC-05',
                    name: 'Accountant Staff',
                    phone: phone
                };
            } else if (mapData.role === 'admin') {
                currentUser = {
                    role: ROLES.ADMIN,
                    id: mapData.studentId || 'A-001',
                    name: 'Admin Staff',
                    phone: phone
                };
            } else if (mapData.role === 'principal') {
                currentUser = {
                    role: ROLES.PRINCIPAL,
                    id: 'HEAD-OFFICE',
                    name: 'Principal',
                    phone: phone
                };
            } else {
                // Resolve Parent dynamic profile
                const stdSnap = await db.ref('school/students/' + mapData.studentId).once('value');
                if (stdSnap.exists()) {
                    const s = stdSnap.val();
                    currentUser = { 
                        role: ROLES.PARENT,
                        id: 'P-' + phone.slice(-4),
                        name: s.parentName || 'Parent',
                        phone: phone,
                        student: {
                            id: mapData.studentId,
                            name: s.name,
                            grade: s.class,
                            section: s.section,
                            roll: s.roll || '01',
                            bloodGroup: s.bloodGroup,
                            photo: s.photo,
                            age: s.age || 'N/A',
                            joinYear: s.joinYear || 'N/A',
                            fatherName: s.fatherName || (s.family ? s.family.fatherName : '') || 'N/A',
                            classTeacher: 'Ms. Sunita Rai',
                            schedule: [
                                { period: '1st', time: '10:00 AM', subject: 'Mathematics', teacher: 'Ms. Sunita Rai', days: 'Sun - Fri' },
                                { period: '2nd', time: '11:00 AM', subject: 'Science', teacher: 'Mr. Ram Prasad', days: 'Sun - Fri' },
                                { period: 'Break', time: '01:00 PM', subject: 'Lunch Break', teacher: '-', days: 'Daily' }
                            ],
                            marks: { "Term 1": [ ] }
                        }
                    };
                } else {
                    throw new Error("Student profile not found.");
                }
            }
        } else {
            hideUploadProgress();
            await alert("Invalid phone number or account not registered.");
            return;
        }
        
        localStorage.setItem('school_app_user', JSON.stringify(currentUser));
        hideUploadProgress();
        redirectUserToRoleDashboard(currentUser.role);
    } catch (e) {
        console.error("Authentication failed:", e);
        hideUploadProgress();
        await alert("Authentication failed: " + e.message);
    }
}

// Startup execution
window.onload = () => {
    if (currentUser) {
        redirectUserToRoleDashboard(currentUser.role);
    } else {
        setTimeout(() => {
            const splash = document.getElementById('splash-screen');
            const app = document.getElementById('app');
            if (splash && app) {
                splash.classList.add('opacity-0');
                setTimeout(() => {
                    splash.style.display = 'none';
                    app.classList.remove('opacity-0');
                }, 700);
            }
        }, 2500); // 2.5s splash
    }
};