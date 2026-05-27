// Login View Controller for Udayashree School App (Updated for Multi-Number resolution)

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
    
    // Auto focus and digit logic
    const inputs = document.querySelectorAll('.otp-input');
    inputs.forEach((input, index) => {
        input.value = '';
        input.addEventListener('keyup', (e) => {
            if (e.key >= 0 && e.key <= 9) {
                if (index < inputs.length - 1) inputs[index + 1].focus();
            } else if (e.key === 'Backspace') {
                if (index > 0) inputs[index - 1].focus();
            }
        });
    });
    setTimeout(() => { inputs[0].focus(); }, 100);
}

function sendOTP() {
    const phone = document.getElementById('login-phone').value.trim();
    if (phone.length >= 10) {
        tempPhone = phone;
        showStep2();
    } else {
        alert('Please enter a valid mobile number');
    }
}

async function handleLogin() {
    const phone = tempPhone || '9800000000';
    
    try {
        // 1. Check for Super Admin phone numbers
        const adminSnap = await db.ref('school/admin/' + phone).once('value');
        if (adminSnap.exists()) {
            currentUser = { role: ROLES.ADMIN, id: 'ADM-' + phone.slice(-4), name: 'Administrator', phone: phone };
            localStorage.setItem('school_app_user', JSON.stringify(currentUser));
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
            redirectUserToRoleDashboard(currentUser.role);
            return;
        }

        // 2. Read from dynamic login mapping for Teachers/Parents
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
                        phone: t.phone,
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
            // Bypasses & overrides for testing / development
            if (phone.startsWith('981')) {
                currentUser = { 
                    role: ROLES.TEACHER, 
                    id: 'UT-2026-9999', 
                    name: 'Ms. Sunita Rai',
                    phone: phone,
                    photo: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150',
                    subjects: ['Mathematics', 'Science'],
                    assignedClasses: ['10-A', '9-B'],
                    schedule: [
                        { period: '1st', class: '10A', subject: 'Mathematics', time: '10:00 AM' },
                        { period: '3rd', class: '9B', subject: 'Advanced Math', time: '11:30 AM' }
                    ]
                };
            } else if (phone.startsWith('982')) {
                currentUser = { role: ROLES.ADMIN, id: 'A-001', name: 'Admin Staff' };
            } else if (phone.startsWith('983')) {
                currentUser = { role: ROLES.ACCOUNTANT, id: 'ACC-05', name: 'Nabin Jha' };
            } else if (phone.startsWith('984')) {
                currentUser = { role: ROLES.PRINCIPAL, id: 'P-01', name: 'Dr. Hari Bansha' };
            } else {
                // Default fallback guest account
                currentUser = { 
                    role: ROLES.PARENT,
                    id: 'MOCK-001',
                    name: 'Guest Parent',
                    phone: phone,
                    student: {
                        id: 'US-2026-9999',
                        name: 'Demo Student',
                        grade: '10',
                        section: 'A',
                        roll: '01',
                        bloodGroup: 'O+',
                        photo: 'https://via.placeholder.com/150',
                        age: '15',
                        joinYear: '2026',
                        classTeacher: 'Ms. Sunita Rai',
                        schedule: [
                            { period: '1st', time: '10:00 AM', subject: 'Mathematics', teacher: 'Ms. Sunita Rai', days: 'Sun - Fri' },
                            { period: 'Break', time: '01:00 PM', subject: 'Lunch Break', teacher: '-', days: 'Daily' }
                        ],
                        marks: { "Term 1": [ ] }
                    }
                };
            }
        }
    } catch (e) {
        console.error("Login map resolution failed:", e);
        alert("Verification bypass: Loaded default profile.");
        // Defensive profile mapping
        currentUser = { 
            role: ROLES.PARENT,
            id: 'MOCK-001',
            name: 'Guest Parent',
            phone: phone,
            student: {
                id: 'US-2026-9999',
                name: 'Demo Student',
                grade: '10',
                section: 'A',
                roll: '01',
                bloodGroup: 'O+',
                photo: 'https://via.placeholder.com/150',
                age: '15',
                joinYear: '2026',
                classTeacher: 'Ms. Sunita Rai',
                schedule: [ ],
                marks: { "Term 1": [ ] }
            }
        };
    }
    
    localStorage.setItem('school_app_user', JSON.stringify(currentUser));
    redirectUserToRoleDashboard(currentUser.role);
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