// Shared Core System for Udayashree School App (Restructured for Dynamic Stats)

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAHOiriisWOpuVLAdcYun_mCkOhbYfB5y4",
  authDomain: "deep-freehold-389006.firebaseapp.com",
  databaseURL: "https://deep-freehold-389006-default-rtdb.firebaseio.com",
  projectId: "deep-freehold-389006",
  storageBucket: "deep-freehold-389006.appspot.com",
  messagingSenderId: "76562961838",
  appId: "1:76562961838:web:4d18b2f79d7eb9fd88243f",
  measurementId: "G-VZC36FJC24"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();
const storage = firebase.storage();

// Role Constants
const ROLES = {
    PARENT: 'parent',
    TEACHER: 'teacher',
    ADMIN: 'admin',
    ACCOUNTANT: 'accountant',
    PRINCIPAL: 'principal'
};

// Global User State
let currentUser = null;

// Resolve Current Session
const savedUser = localStorage.getItem('school_app_user');
if (savedUser) {
    try {
        currentUser = JSON.parse(savedUser);
    } catch (e) {
        console.error("Error parsing user session", e);
    }
}

/**
 * Authentication & Authorization Guard
 */
function checkAuth(allowedRoles) {
    if (!currentUser) {
        window.location.href = 'index.html';
        return false;
    }
    if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
        redirectUserToRoleDashboard(currentUser.role);
        return false;
    }
    return true;
}

/**
 * Redirects user to their role-specific dashboard page.
 */
function redirectUserToRoleDashboard(role) {
    switch (role) {
        case ROLES.PARENT:
            window.location.href = 'parent.html';
            break;
        case ROLES.TEACHER:
            window.location.href = 'teacher.html';
            break;
        case ROLES.ADMIN:
            window.location.href = 'admin.html';
            break;
        case ROLES.ACCOUNTANT:
            window.location.href = 'accountant.html';
            break;
        case ROLES.PRINCIPAL:
            window.location.href = 'principal.html';
            break;
        default:
            window.location.href = 'index.html';
    }
}

/**
 * Global Logout handler
 */
function handleLogout() {
    localStorage.removeItem('school_app_user');
    currentUser = null;
    window.location.href = 'index.html';
}

/**
 * Global image selection preview helper
 */
function previewImage(input, previewId) {
    const preview = document.getElementById(previewId);
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" class="w-full h-full object-cover">`;
        }
        reader.readAsDataURL(input.files[0]);
    }
}

/**
 * Image Normalization Utility
 * Converts any image format to JPG with 0.9 quality to balance speed and clarity.
 */
async function processImage(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1200; // Cap resolution for speed, still high quality
                let width = img.width;
                let height = img.height;

                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob((blob) => {
                    resolve(new File([blob], "image.jpg", { type: 'image/jpeg' }));
                }, 'image/jpeg', 0.9);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

/**
 * Enhanced Global file upload with Progress tracking
 */
async function uploadFile(file, path) {
    // Show global progress UI
    showUploadProgress(0, "Preparing...");
    
    // Process image if it's an image file
    let fileToUpload = file;
    if (file.type.startsWith('image/')) {
        showUploadProgress(5, "Optimizing Image...");
        fileToUpload = await processImage(file);
    }

    const storageRef = storage.ref(path);
    const uploadTask = storageRef.put(fileToUpload);

    return new Promise((resolve, reject) => {
        uploadTask.on('state_changed', 
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 90 + 10;
                showUploadProgress(progress, `Uploading: ${Math.round(progress)}%`);
            }, 
            (error) => {
                hideUploadProgress();
                reject(error);
            }, 
            async () => {
                const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                showUploadProgress(100, "Finalizing...");
                setTimeout(hideUploadProgress, 500);
                resolve(downloadURL);
            }
        );
    });
}

function showUploadProgress(percent, label) {
    let overlay = document.getElementById('global-upload-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'global-upload-overlay';
        overlay.className = 'fixed inset-0 z-[20000] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-8 transition-opacity duration-300';
        overlay.innerHTML = `
            <div class="w-full max-w-xs space-y-4 text-center">
                <div class="relative w-24 h-24 mx-auto">
                    <svg class="w-full h-full transform -rotate-90">
                        <circle cx="48" cy="48" r="40" stroke="currentColor" stroke-width="8" fill="transparent" class="text-gray-700" />
                        <circle id="progress-circle" cx="48" cy="48" r="40" stroke="currentColor" stroke-width="8" fill="transparent" stroke-dasharray="251.2" stroke-dashoffset="251.2" class="text-blue-500 transition-all duration-300" />
                    </svg>
                    <div id="progress-text" class="absolute inset-0 flex items-center justify-center text-white font-black text-sm">0%</div>
                </div>
                <div class="space-y-1">
                    <h3 class="text-white font-bold text-base">Processing Files</h3>
                    <p id="progress-label" class="text-gray-400 text-[10px] font-black uppercase tracking-widest">${label}</p>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    }
    
    const circle = document.getElementById('progress-circle');
    const text = document.getElementById('progress-text');
    const labelEl = document.getElementById('progress-label');
    
    if (circle) {
        const offset = 251.2 - (percent / 100) * 251.2;
        circle.style.strokeDashoffset = offset;
    }
    if (text) text.innerText = `${Math.round(percent)}%`;
    if (labelEl) labelEl.innerText = label;
}

function hideUploadProgress() {
    const overlay = document.getElementById('global-upload-overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 300);
    }
}
/**
 * Renders consistent Header with Universal Navigation
 * @param {string} title - Page title
 * @param {function} backAction - Optional function to trigger on back click
 */
function renderHeader(title, backAction = null) {
    const backBtnHtml = backAction 
        ? `<button id="header-back-btn" class="w-10 h-10 -ml-2 flex items-center justify-center text-white active:scale-90 transition-transform mr-1">
             <i class="fas fa-arrow-left text-lg"></i>
           </button>` 
        : '';

    const headerHtml = `
        <div class="flex items-center justify-between w-full">
            <div class="flex items-center">
                ${backBtnHtml}
                <h1 id="page-title" class="text-lg font-bold truncate max-w-[200px]">${title}</h1>
            </div>
            <div class="flex items-center gap-3">
                <i class="fas fa-bell text-xl"></i>
                <button onclick="handleLogout()" class="text-white hover:text-red-200 active:scale-95 transition-transform ml-2">
                    <i class="fas fa-sign-out-alt text-lg"></i>
                </button>
            </div>
        </div>
    `;
    
    const headerEl = document.getElementById('main-header');
    if (headerEl) {
        headerEl.innerHTML = headerHtml;
        if (backAction) {
            document.getElementById('header-back-btn').onclick = backAction;
        }
    }
}

/**
 * Dynamic view content transition helper
 */
function triggerViewTransition() {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.classList.remove('view-enter');
        void mainContent.offsetWidth; // Trigger reflow
        mainContent.classList.add('view-enter');
    }
}

// ==========================================
// FOUNDATIONAL UPGRADES & DATABASE SCHEMAS
// ==========================================

/**
 * Dynamic Student ID Generator
 * Formats: US-{JoinYear}-{RandomNumeric4Digits}
 * Example: US-2026-4789
 */
function generateStudentID(joinYear) {
    const cleanYear = joinYear || new Date().getFullYear();
    const randDigits = Math.floor(1000 + Math.random() * 9000);
    return `US-${cleanYear}-${randDigits}`;
}

/**
 * Safe Metric Value Resolver
 * Guarantees that even if database records are empty, the application
 * gracefully returns fallback placeholders to avoid layout breaking or JS errors.
 */
const SafeResolvers = {
    attendance: (percentage) => {
        const val = parseFloat(percentage);
        return isNaN(val) ? "0%" : `${val.toFixed(1)}%`;
    },
    count: (value) => {
        const val = parseInt(value);
        return isNaN(val) ? "0" : val.toString();
    },
    currency: (amount) => {
        const val = parseFloat(amount);
        return isNaN(val) ? "Rs. 0" : `Rs. ${val.toLocaleString()}`;
    },
    text: (str, fallback = "N/A") => {
        return (str && str.trim()) ? str : fallback;
    },
    photo: (url) => {
        return (url && url.startsWith('http')) ? url : "https://via.placeholder.com/150";
    }
};

/**
 * Renders the shared Teacher Directory dynamically into any container.
 * @param {string} containerId - The DOM element ID to render into.
 * @param {Object} options - Customization toggles (e.g. canClickToCall, showAdminActions, hideSearchBar).
 */
async function renderSharedTeacherDirectory(containerId, options = { }) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const searchId = `${containerId}-search`;
    const filterId = `${containerId}-dept-filter`;
    const listContainerId = `${containerId}-list`;

    const departments = ["All", "Mathematics", "Science", "Computer Science", "English", "Social Studies", "Nepali", "Administration"];

    let headerHtml = '';
    if (!options.hideSearchBar) {
        headerHtml = `
            <div class="mb-4 space-y-2">
                <div class="relative">
                    <input type="text" id="${searchId}" onkeyup="filterSharedTeachers('${containerId}')" class="w-full p-3 bg-white border border-gray-100 rounded-xl text-sm pl-10 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm" placeholder="Search colleagues by name or subject...">
                    <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-xs"></i>
                </div>
                <div class="flex items-center justify-between bg-white p-2.5 rounded-xl border border-gray-50 shadow-sm">
                    <span class="text-[10px] font-black text-gray-400 uppercase pl-1 tracking-wider">Department</span>
                    <select id="${filterId}" onchange="filterSharedTeachers('${containerId}')" class="p-1 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold outline-none">
                        ${departments.map(d => `<option value="${d}">${d}</option>`).join('')}
                    </select>
                </div>
            </div>
        `;
    }

    container.innerHTML = `
        ${headerHtml}
        <div id="${listContainerId}" class="space-y-3">
            <div class="text-center py-10 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Loading Faculty Directory...</div>
        </div>
    `;

    const listContainer = document.getElementById(listContainerId);

    try {
        const snap = await db.ref('school/teachers').once('value');
        const teachers = snap.val();
        
        if (!teachers) {
            listContainer.innerHTML = `<div class="text-center py-10 text-gray-400">No faculty members found.</div>`;
            return;
        }

        container.setAttribute('data-teachers', JSON.stringify(teachers));
        container.setAttribute('data-options', JSON.stringify(options));

        renderTeachersSubset(listContainerId, teachers, options);

    } catch (e) {
        console.error(e);
        listContainer.innerHTML = `<div class="text-center py-10 text-red-400">Failed to render Shared Directory: ${e.message}</div>`;
    }
}

function renderTeachersSubset(listContainerId, teachers, options = { }) {
    const listContainer = document.getElementById(listContainerId);
    if (!listContainer) return;

    listContainer.innerHTML = Object.entries(teachers).map(([teacherId, t]) => {
        const fullName = t.name && typeof t.name === 'object' 
            ? `${t.name.first || ''} ${t.name.middle || ''} ${t.name.last || ''}`.replace(/\s+/g, ' ').trim()
            : t.name || 'Faculty Member';

        // Resolve badge styling based on status label
        let badgeClass = "bg-gray-100 text-gray-600";
        const status = SafeResolvers.text(t.statusLabel, 'Active');
        if (status === 'Active' || status === 'On Duty') badgeClass = "bg-green-100 text-green-700";
        else if (status === 'In Class') badgeClass = "bg-yellow-100 text-yellow-700";
        else if (status === 'On Leave') badgeClass = "bg-red-100 text-red-700";
        else if (status === 'Off Duty') badgeClass = "bg-gray-100 text-gray-500";
        else if (status === 'Principal' || status === 'Vice Principal' || status === 'HOD') badgeClass = "bg-purple-100 text-purple-700";

        // Map department keys to clean labels
        const deptMap = {
            "DEPARTMENT_MATH": "Math Dept.",
            "DEPARTMENT_SCIENCE": "Science Dept.",
            "DEPARTMENT_LANGUAGES": "Languages Dept.",
            "DEPARTMENT_SOCIAL": "Social Dept.",
            "DEPARTMENT_COMPUTERS": "Computers Dept."
        };
        const deptLabel = t.department && deptMap[t.department] ? ` | ${deptMap[t.department]}` : '';
        const hodLabel = t.isDepartmentHead ? `<span class="px-1.5 py-0.5 rounded-md text-[8px] bg-red-100 text-red-700 font-black tracking-wide ml-1 border border-red-200">HOD</span>` : '';

        const profTitle = SafeResolvers.text(t.professionalTitle, SafeResolvers.text(t.role, 'Faculty'));
        const subjectStr = t.subjects ? (Array.isArray(t.subjects) ? t.subjects.join(', ') : t.subjects) : 'N/A';

        // Custom action callback for admin/profile loading vs dynamic list
        const clickAttr = options.showAdminActions 
            ? `onclick="viewTeacherProfileDetails('${teacherId}')"` 
            : ``;

        return `
            <div ${clickAttr} class="mobile-card flex items-center p-4 bg-white border border-gray-100 shadow-sm relative overflow-hidden active:bg-gray-50 transition-colors ${options.showAdminActions ? 'cursor-pointer' : ''}">
                <img src="${SafeResolvers.photo(t.photo)}" class="w-12 h-12 rounded-xl object-cover mr-4 border border-gray-100 shadow-sm">
                <div class="flex-grow">
                    <div class="flex items-center gap-2">
                        <h4 class="font-bold text-gray-800 text-sm">${fullName}</h4>
                        <span class="px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${badgeClass}">${status}</span>
                        ${hodLabel}
                    </div>
                    <p class="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">${profTitle}${deptLabel} | ${subjectStr}</p>
                </div>
            </div>
        `;
    }).join('');
}
function filterSharedTeachers(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const searchInput = document.getElementById(`${containerId}-search`);
    const deptSelect = document.getElementById(`${containerId}-dept-filter`);
    const listContainer = document.getElementById(`${containerId}-list`);

    if (!listContainer) return;

    const rawData = container.getAttribute('data-teachers');
    const rawOptions = container.getAttribute('data-options');

    if (!rawData) return;

    const teachers = JSON.parse(rawData);
    const options = rawOptions ? JSON.parse(rawOptions) : { };

    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const dept = deptSelect ? deptSelect.value : 'All';

    const filteredTeachers = { };
    for (const [id, t] of Object.entries(teachers)) {
        const fullName = t.name && typeof t.name === 'object' 
            ? `${t.name.first || ''} ${t.name.middle || ''} ${t.name.last || ''}`.replace(/\s+/g, ' ').trim()
            : t.name || 'Faculty Member';
        
        const subjectStr = t.subjects ? (Array.isArray(t.subjects) ? t.subjects.join(', ') : t.subjects) : '';
        const deptStr = t.department || '';

        const matchesQuery = fullName.toLowerCase().includes(query) || subjectStr.toLowerCase().includes(query);
        const matchesDept = (dept === 'All') || (deptStr === dept) || (t.subjects && Array.isArray(t.subjects) && t.subjects.includes(dept));

        if (matchesQuery && matchesDept) {
            filteredTeachers[id] = t;
        }
    }

    renderTeachersSubset(`${containerId}-list`, filteredTeachers, options);
}

/**
 * Floating Debug Menu to switch roles anywhere instantly
 */
function injectDebugMenu() {
    let debugContainer = document.getElementById('debug-menu-container');
    if (!debugContainer) {
        debugContainer = document.createElement('div');
        debugContainer.id = 'debug-menu-container';
        document.body.appendChild(debugContainer);
    }

    debugContainer.innerHTML = `
        <div class="fixed bottom-24 right-4 z-[200]">
            <button onclick="toggleDebugMenu()" class="w-12 h-12 bg-gray-800 text-white rounded-full shadow-2xl flex items-center justify-center border-2 border-white/20 active:scale-90 transition-all">
                <i class="fas fa-bug"></i>
            </button>
            <div id="debug-options" class="hidden absolute bottom-14 right-0 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 w-48 space-y-1">
                <p class="text-[10px] font-black text-gray-400 uppercase px-3 py-1">Switch Role</p>
                <button onclick="debugLogin('9800000000')" class="w-full text-left px-3 py-2 text-xs font-bold hover:bg-gray-50 rounded-lg flex items-center">
                    <i class="fas fa-user-friends mr-2 text-blue-500"></i> Parent View
                </button>
                <button onclick="debugLogin('9810000000')" class="w-full text-left px-3 py-2 text-xs font-bold hover:bg-gray-50 rounded-lg flex items-center">
                    <i class="fas fa-chalkboard-teacher mr-2 text-indigo-500"></i> Teacher View
                </button>
                <button onclick="debugLogin('9820000000')" class="w-full text-left px-3 py-2 text-xs font-bold hover:bg-gray-50 rounded-lg flex items-center">
                    <i class="fas fa-user-shield mr-2 text-red-500"></i> Admin View
                </button>
                <button onclick="debugLogin('9830000000')" class="w-full text-left px-3 py-2 text-xs font-bold hover:bg-gray-50 rounded-lg flex items-center">
                    <i class="fas fa-file-invoice-dollar mr-2 text-green-500"></i> Accountant View
                </button>
                <button onclick="debugLogin('9840000000')" class="w-full text-left px-3 py-2 text-xs font-bold hover:bg-gray-50 rounded-lg flex items-center">
                    <i class="fas fa-university mr-2 text-purple-500"></i> Principal View
                </button>
                <hr class="my-1 border-gray-50">
                <button onclick="localStorage.clear(); window.location.href='index.html';" class="w-full text-left px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg flex items-center">
                    <i class="fas fa-trash-alt mr-2"></i> Clear Session
                </button>
            </div>
        </div>
    `;
}

function toggleDebugMenu() {
    const options = document.getElementById('debug-options');
    if (options) {
        options.classList.toggle('hidden');
    }
}

async function debugLogin(phone) {
    if (phone.startsWith('981')) {
        currentUser = { 
            role: ROLES.TEACHER, 
            id: 'T-552', 
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
        try {
            // Read from dynamic login mapping
            const mapSnap = await db.ref('school/login_mappings/' + phone).once('value');
            if (mapSnap.exists()) {
                const mapData = mapSnap.val();
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
                }
            } else {
                // Fallback default mockup
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
        } catch (e) {
            console.error(e);
        }
    }
    localStorage.setItem('school_app_user', JSON.stringify(currentUser));
    redirectUserToRoleDashboard(currentUser.role);
}

// Automatically inject debug menu on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    injectDebugMenu();
    setupGlobalNotificationUI();
});

// ==========================================
// CUSTOM VISUAL NOTIFICATION & DIALOG SYSTEMS
// ==========================================

function setupGlobalNotificationUI() {
    // Redefine window.alert dynamically to render as a smooth native-like modal overlay
    window.alert = function(message) {
        const modalId = 'custom-ui-alert-modal';
        let modal = document.getElementById(modalId);
        if (!modal) {
            modal = document.createElement('div');
            modal.id = modalId;
            modal.className = 'fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300 opacity-0 pointer-events-none';
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full transform scale-90 transition-transform duration-300 relative text-center">
                <div class="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl">
                    <i class="fas fa-info-circle"></i>
                </div>
                <h4 class="font-black text-gray-800 text-base mb-2">School Message</h4>
                <p class="text-xs text-gray-500 leading-relaxed mb-6">${message.replace(/\n/g, '<br>')}</p>
                <button id="custom-alert-close-btn" class="w-full bg-blue-700 hover:bg-blue-800 active:scale-95 text-white font-black py-3.5 rounded-2xl text-xs transition-transform shadow-md outline-none">
                    Dismiss
                </button>
            </div>
        `;

        // Trigger transition animation
        setTimeout(() => {
            modal.classList.remove('opacity-0', 'pointer-events-none');
            const box = modal.querySelector('div');
            if (box) box.classList.remove('scale-90');
        }, 50);

        return new Promise((resolve) => {
            const btn = document.getElementById('custom-alert-close-btn');
            if (btn) {
                btn.addEventListener('click', () => {
                    modal.classList.add('opacity-0', 'pointer-events-none');
                    const box = modal.querySelector('div');
                    if (box) box.classList.add('scale-90');
                    setTimeout(() => {
                        resolve();
                    }, 300);
                });
            } else {
                resolve();
            }
        });
    };
}

function showToast(message, type = 'success') {
    const toastId = 'custom-toast-notification';
    let toast = document.getElementById(toastId);
    if (!toast) {
        toast = document.createElement('div');
        toast.id = toastId;
        toast.className = 'fixed top-6 left-1/2 -translate-x-1/2 z-[10001] px-5 py-3.5 rounded-2xl text-xs font-bold text-white shadow-xl transition-all duration-300 transform -translate-y-4 opacity-0 pointer-events-none flex items-center gap-2 max-w-xs w-full justify-center';
        document.body.appendChild(toast);
    }

    let bgStyle = 'bg-emerald-600';
    let iconHtml = '<i class="fas fa-check-circle"></i>';
    if (type === 'error') {
        bgStyle = 'bg-rose-600';
        iconHtml = '<i class="fas fa-exclamation-circle"></i>';
    } else if (type === 'info') {
        bgStyle = 'bg-blue-600';
        iconHtml = '<i class="fas fa-info-circle"></i>';
    }

    toast.className = `fixed top-6 left-1/2 -translate-x-1/2 z-[10001] px-5 py-3.5 rounded-2xl text-xs font-bold text-white shadow-xl transition-all duration-300 transform translate-y-0 opacity-100 flex items-center gap-2 max-w-xs w-full justify-center ${bgStyle}`;
    toast.innerHTML = `${iconHtml} <span>${message}</span>`;

    if (window.toastTimeout) clearTimeout(window.toastTimeout);

    window.toastTimeout = setTimeout(() => {
        toast.className = 'fixed top-6 left-1/2 -translate-x-1/2 z-[10001] px-5 py-3.5 rounded-2xl text-xs font-bold text-white shadow-xl transition-all duration-300 transform -translate-y-4 opacity-0 pointer-events-none flex items-center gap-2 max-w-xs w-full justify-center';
    }, 2500);
}
