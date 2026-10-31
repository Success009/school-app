// admin-student-add.js - Modern Student Onboarding UI Controller
// Single-responsibility student registration interface adhering to clean UX standards

let studentAddEngine = null;
let currentStudentPhotoUrl = '';
let currentStudentDocs = [];

// Entry Point
async function initStudentAdd(targetContainerId = 'student-add-container') {
    let container = document.getElementById(targetContainerId);
    if (!container) {
        container = document.getElementById('student-add-container') || document.getElementById('main-content');
    }
    if (!container) return;

    // Loading State
    container.innerHTML = `
        <div class="flex flex-col items-center justify-center py-16 text-gray-400">
            <i class="fas fa-spinner fa-spin text-3xl text-blue-700 mb-3"></i>
            <p class="text-xs font-bold uppercase tracking-wider text-gray-500">Loading Student Enrollment System...</p>
        </div>
    `;

    try {
        // Initialize Engine
        if (typeof window.StudentAddModule !== 'undefined') {
            studentAddEngine = new window.StudentAddModule();
            await studentAddEngine.loadFromDatabase();
        } else {
            console.warn("StudentAddModule not found on window, fallback initialized.");
            studentAddEngine = {
                getClasses: () => [
                    { id: "1", name: "Class 1" }, { id: "2", name: "Class 2" },
                    { id: "3", name: "Class 3" }, { id: "4", name: "Class 4" },
                    { id: "5", name: "Class 5" }, { id: "6", name: "Class 6" },
                    { id: "7", name: "Class 7" }, { id: "8", name: "Class 8" }
                ],
                getSubjectsForClass: () => ["Basic Math", "English", "Nepali", "General Science"],
                getNextRollNumber: () => "01",
                validate: () => ({ isValid: true, cleanData: {} }),
                registerStudent: async () => ({ success: true, studentId: 'US-2083-0001' })
            };
        }

        renderStudentAddView(container);
    } catch (err) {
        console.error("Failed to load StudentAddModule:", err);
        container.innerHTML = `
            <div class="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs">
                <i class="fas fa-exclamation-triangle mr-2"></i> Failed to initialize student onboarding engine: ${err.message}
            </div>
        `;
    }
}

// Render Main Form View
function renderStudentAddView(container) {
    currentStudentPhotoUrl = '';
    currentStudentDocs = [];

    const classes = studentAddEngine.getClasses();
    const defaultClassId = classes.length > 0 ? String(classes[0].id) : '1';
    const initialRoll = studentAddEngine.getNextRollNumber ? studentAddEngine.getNextRollNumber(defaultClassId) : '01';
    const initialSubjects = studentAddEngine.getSubjectsForClass ? studentAddEngine.getSubjectsForClass(defaultClassId) : [];

    const defaultAvatar = window.DEFAULT_STUDENT_AVATAR || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2NiZDVlMSI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg==';

    const classOptionsHtml = classes.map(c => `
        <option value="${c.id}">${c.name || `Class ${c.id}`}</option>
    `).join('');

    container.innerHTML = `
        <div class="space-y-6 pb-12">
                                    <!-- Header with Back Navigation -->
            <div class="flex items-center justify-between pb-3 border-b border-gray-200">
                <div class="flex items-center gap-3">
                    <button type="button" onclick="handleStudentBackNavigation()" class="text-gray-600 hover:text-blue-700 p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center text-sm font-bold" title="Back to Dashboard">
                        <i class="fas fa-arrow-left"></i>
                        <span class="ml-1.5 text-xs">Dashboard</span>
                    </button>
                    <div>
                        <h2 class="text-lg font-black text-gray-800 leading-tight">Student Enrollment</h2>
                    </div>
                </div>
            </div>

            <!-- Error Banner -->
            <div id="student-form-error-alert" class="hidden p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold space-y-1"></div>

            <!-- Success Banner -->
            <div id="student-form-success-banner" class="hidden p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div>
                        <h4 class="text-xs font-black text-emerald-900">Student Registered</h4>
                        <p id="student-form-success-message" class="text-[11px] font-bold text-emerald-700 mt-0.5"></p>
                    </div>
                </div>
                <button type="button" onclick="resetStudentAddForm(true)" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors">
                    Enroll Another Student
                </button>
            </div>

            <!-- Form Body -->
            <form id="student-enrollment-form" onsubmit="event.preventDefault(); handleRegisterStudent();" class="space-y-6">

                                <!-- Section 1: Student Personal Details & Photo -->
                <div class="mobile-card">
                    <div class="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                        <h3 class="text-xs font-black uppercase text-blue-700 tracking-wider flex items-center gap-2">
                            <i class="fas fa-user text-blue-600"></i> 1. Student Personal Details
                        </h3>
                    </div>

                    <!-- Photo Upload with Preview -->
                    <div class="mb-5 p-3.5 bg-gray-50/70 border border-gray-200 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
                        <div class="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-dashed border-blue-300 bg-white shadow-xs flex-shrink-0 flex items-center justify-center">
                            <img id="preview-student-photo" src="${defaultAvatar}" class="w-full h-full object-cover">
                        </div>
                        <div class="flex-grow text-center sm:text-left">
                            <div class="flex items-center justify-center sm:justify-start gap-2 mb-2">
                                <span class="text-xs font-black text-gray-800">Student Photo</span>
                                <span id="student-photo-status-badge" class="text-[9px] font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                                    Default photo
                                </span>
                            </div>
                            <div class="flex items-center justify-center sm:justify-start gap-2">
                                <input type="file" id="upload-student-photo-input" class="hidden" accept="image/*" onchange="handleStudentPhotoUpload(event)">
                                <button type="button" onclick="document.getElementById('upload-student-photo-input').click()" class="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-lg border border-gray-300 shadow-xs transition-colors flex items-center gap-1.5">
                                    <i class="fas fa-camera text-blue-600"></i> Select Photo
                                </button>
                                <button type="button" id="btn-remove-student-photo" onclick="removeStudentPhoto()" class="hidden px-2.5 py-1.5 text-gray-400 hover:text-red-600 text-xs font-bold transition-colors">
                                    Remove
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Name Fields -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                        <div>
                            <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">First Name *</label>
                            <input type="text" id="std-fname" required class="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs font-bold text-gray-800" placeholder="Aarav">
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Middle Name</label>
                            <input type="text" id="std-mname" class="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs font-bold text-gray-800" placeholder="Chandra">
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Last Name *</label>
                            <input type="text" id="std-lname" required class="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs font-bold text-gray-800" placeholder="Sharma">
                        </div>
                    </div>

                    <!-- Gender, DOB (BS), Age, Blood Group -->
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                            <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Gender</label>
                            <select id="std-gender" class="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs font-bold text-gray-800">
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Date of Birth (BS)</label>
                            <input type="text" id="std-dob" placeholder="YYYY-MM-DD (e.g. 2075-04-12)" oninput="calculateStudentNepaliAge()" class="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs font-bold text-gray-800">
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Age (Years)</label>
                            <input type="text" id="std-age" readonly class="w-full p-2.5 bg-gray-100 border border-gray-200 rounded-xl outline-none text-xs font-bold text-gray-700 cursor-not-allowed" placeholder="Auto">
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Blood Group</label>
                            <select id="std-blood" class="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs font-bold text-gray-800">
                                <option value="Unknown">Unknown</option>
                                <option value="A+">A+</option>
                                <option value="A-">A-</option>
                                <option value="B+">B+</option>
                                <option value="B-">B-</option>
                                <option value="O+">O+</option>
                                <option value="O-">O-</option>
                                <option value="AB+">AB+</option>
                                <option value="AB-">AB-</option>
                            </select>
                        </div>
                    </div>
                </div>

                                <!-- Section 2: Family & Contact Details -->
                <div class="mobile-card">
                    <div class="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                        <h3 class="text-xs font-black uppercase text-blue-700 tracking-wider flex items-center gap-2">
                            <i class="fas fa-users text-blue-600"></i> 2. Family & Contact Details
                        </h3>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                        <div>
                            <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Father's Name</label>
                            <input type="text" id="std-father" class="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs font-bold text-gray-800" placeholder="Ramesh Sharma">
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Mother's Name</label>
                            <input type="text" id="std-mother" class="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs font-bold text-gray-800" placeholder="Sita Sharma">
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Parent Mobile Number(s) *</label>
                            <div class="relative">
                                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">+977</span>
                                <input type="tel" id="std-phone" required class="w-full p-2.5 pl-14 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs font-bold text-gray-800" placeholder="98XXXXXXXX, 98YYYYYYYY">
                            </div>
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Parent Email</label>
                            <input type="email" id="std-email" class="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs font-bold text-gray-800" placeholder="parent@example.com">
                        </div>
                    </div>
                </div>

                <!-- Section 3: Address Information -->
                <div class="mobile-card">
                    <div class="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                        <h3 class="text-xs font-black uppercase text-blue-700 tracking-wider flex items-center gap-2">
                            <i class="fas fa-map-marker-alt text-blue-600"></i> 3. Address Information
                        </h3>
                    </div>

                    <!-- Current Address -->
                    <div class="mb-3">
                        <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Current Address</label>
                        <div class="grid grid-cols-3 gap-2">
                            <input type="text" id="std-curr-street" oninput="handleStudentAddressSync()" class="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800" placeholder="Street / Tole">
                            <input type="text" id="std-curr-city" oninput="handleStudentAddressSync()" class="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800" placeholder="City / Municipality">
                            <input type="text" id="std-curr-district" oninput="handleStudentAddressSync()" class="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800" placeholder="District">
                        </div>
                    </div>

                    <!-- Sync Checkbox -->
                    <div class="flex items-center gap-2 py-2">
                        <input type="checkbox" id="std-sync-addr" onchange="handleStudentAddressSync()" class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer">
                        <label for="std-sync-addr" class="text-[11px] font-bold text-blue-700 cursor-pointer select-none">
                            Permanent address same as current address
                        </label>
                    </div>

                    <!-- Permanent Address -->
                    <div id="perm-addr-container">
                        <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Permanent Address</label>
                        <div class="grid grid-cols-3 gap-2">
                            <input type="text" id="std-perm-street" class="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800" placeholder="Street / Tole">
                            <input type="text" id="std-perm-city" class="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800" placeholder="City / Municipality">
                            <input type="text" id="std-perm-district" class="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800" placeholder="District">
                        </div>
                    </div>
                </div>

                <!-- Section 4: Enrollment -->
                <div class="mobile-card">
                    <div class="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                        <h3 class="text-xs font-black uppercase text-blue-700 tracking-wider flex items-center gap-2">
                            <i class="fas fa-graduation-cap text-blue-600"></i> 4. Enrollment
                        </h3>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Class *</label>
                            <select id="std-class-select" class="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs font-bold text-gray-800">
                                ${classOptionsHtml}
                            </select>
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Join Year (BS)</label>
                            <input type="number" id="std-join-year" value="2083" class="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs font-bold text-gray-800">
                        </div>
                    </div>
                </div>

                <!-- Section 5: Documents & Verification -->
                <div class="mobile-card">
                    <div class="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                        <h3 class="text-xs font-black uppercase text-blue-700 tracking-wider flex items-center gap-2">
                            <i class="fas fa-file-invoice text-blue-600"></i> 5. Documents & Verification
                        </h3>
                        <span id="student-doc-count-badge" class="text-[9px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            0 Documents Attached
                        </span>
                    </div>

                    <!-- Document Uploader Widget -->
                    <div class="p-3.5 bg-gray-50/70 border border-gray-200 rounded-2xl mb-4">
                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
                            <div class="sm:col-span-2">
                                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Document Category</label>
                                <select id="student-doc-type-select" class="w-full p-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none">
                                    <option value="Birth Certificate">Birth Certificate</option>
                                    <option value="Transfer Certificate">Transfer Certificate (TC)</option>
                                    <option value="Previous Marksheet">Previous School Marksheet / Progress Card</option>
                                    <option value="Medical Record">Medical / Immunization Record</option>
                                    <option value="Parent Citizenship">Parent Citizenship / ID Card</option>
                                    <option value="Other Document">Other Document</option>
                                </select>
                            </div>
                            <div>
                                <input type="file" id="upload-student-doc-input" class="hidden" multiple accept="image/*,application/pdf" onchange="handleStudentMultipleDocsUpload(event)">
                                <button type="button" onclick="document.getElementById('upload-student-doc-input').click()" class="w-full py-2 bg-white hover:bg-gray-100 text-gray-700 font-bold rounded-xl border border-gray-300 shadow-xs text-xs flex items-center justify-center gap-1.5 transition-colors">
                                    <i class="fas fa-paperclip text-blue-600"></i>
                                    <span id="student-doc-upload-btn-text">Attach Document</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Attached Documents Roster -->
                    <div id="student-attached-docs-list" class="space-y-2">
                        ${renderStudentAttachedDocsList()}
                    </div>
                </div>

                <!-- Submit Button -->
                <div class="pt-2">
                    <button type="submit" id="btn-submit-student" class="w-full bg-blue-700 hover:bg-blue-800 active:scale-[0.99] text-white font-black py-4 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2">
                        <i class="fas fa-user-plus"></i>
                        <span>Register Student</span>
                    </button>
                </div>
            </form>
        </div>
    `;
}

// Helpers: Render Subject Pills
function renderSubjectPills(subjects) {
    if (!subjects || subjects.length === 0) {
        return `<span class="text-[11px] text-gray-400 italic">No specific subjects configured for this class yet.</span>`;
    }
    return subjects.map(s => `
        <span class="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-blue-200 rounded-lg text-[10px] font-bold text-blue-800 shadow-xs">
            <i class="fas fa-book text-blue-500 text-[8px]"></i> ${s}
        </span>
    `).join('');
}

// Class Change Event
function handleStudentClassChange(classId) {
    if (!studentAddEngine) return;
    
    // Update Roll Number
    const rollInput = document.getElementById('std-roll');
    if (rollInput && studentAddEngine.getNextRollNumber) {
        rollInput.value = studentAddEngine.getNextRollNumber(classId);
    }

    // Update Subjects
    const subjects = studentAddEngine.getSubjectsForClass ? studentAddEngine.getSubjectsForClass(classId) : [];
    const container = document.getElementById('enrolled-subjects-container');
    const badge = document.getElementById('subject-count-badge');
    if (container) container.innerHTML = renderSubjectPills(subjects);
    if (badge) badge.innerText = `${subjects.length} Subjects`;
}

// Age Auto-Calculation from BS Date
function calculateStudentNepaliAge() {
    const dobInput = document.getElementById('std-dob');
    const ageInput = document.getElementById('std-age');
    if (!dobInput || !ageInput) return;

    const val = dobInput.value.trim();
    if (val.length >= 4) {
        const birthYear = parseInt(val.split('-')[0], 10);
        if (!isNaN(birthYear) && birthYear >= 2000 && birthYear <= 2100) {
            const age = 2083 - birthYear;
            ageInput.value = (age >= 0 && age <= 40) ? `${age} yrs` : '';
            return;
        }
    }
    ageInput.value = '';
}

// Address Synchronization
function handleStudentAddressSync() {
    const checkbox = document.getElementById('std-sync-addr');
    const isChecked = checkbox && checkbox.checked;

    const cStreet = document.getElementById('std-curr-street')?.value || '';
    const cCity = document.getElementById('std-curr-city')?.value || '';
    const cDistrict = document.getElementById('std-curr-district')?.value || '';

    const pStreet = document.getElementById('std-perm-street');
    const pCity = document.getElementById('std-perm-city');
    const pDistrict = document.getElementById('std-perm-district');

    if (isChecked) {
        if (pStreet) { pStreet.value = cStreet; pStreet.disabled = true; pStreet.classList.add('bg-gray-100'); }
        if (pCity) { pCity.value = cCity; pCity.disabled = true; pCity.classList.add('bg-gray-100'); }
        if (pDistrict) { pDistrict.value = cDistrict; pDistrict.disabled = true; pDistrict.classList.add('bg-gray-100'); }
    } else {
        if (pStreet) { pStreet.disabled = false; pStreet.classList.remove('bg-gray-100'); }
        if (pCity) { pCity.disabled = false; pCity.classList.remove('bg-gray-100'); }
        if (pDistrict) { pDistrict.disabled = false; pDistrict.classList.remove('bg-gray-100'); }
    }
}

// Client-Side Canvas Image Compression (Max 400x400 @ 0.8 JPEG quality)
async function compressStudentProfileImage(file, maxDimension = 400, quality = 0.8) {
    if (!file || !file.type.startsWith('image/')) return file;
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                let { width, height } = img;
                if (width > maxDimension || height > maxDimension) {
                    if (width > height) {
                        height = Math.round((height * maxDimension) / width);
                        width = maxDimension;
                    } else {
                        width = Math.round((width * maxDimension) / height);
                        height = maxDimension;
                    }
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    if (blob) {
                        const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
                            type: 'image/jpeg',
                            lastModified: Date.now()
                        });
                        resolve(compressedFile);
                    } else {
                        resolve(file);
                    }
                }, 'image/jpeg', quality);
            };
            img.onerror = () => resolve(file);
            img.src = e.target.result;
        };
        reader.onerror = () => resolve(file);
        reader.readAsDataURL(file);
    });
}

// Upload Service Helper
async function uploadStudentFileViaApi(file) {
    const formData = new FormData();
    formData.append('file', file);
    const resp = await fetch('/api/upload', {
        method: 'POST',
        body: formData
    });
    if (!resp.ok) {
        throw new Error(`Upload failed (${resp.status})`);
    }
    const data = await resp.json();
    if (!data.success || !data.url) {
        throw new Error(data.error || 'Upload failed');
    }
    return data.url;
}

// Photo Upload Handler
async function handleStudentPhotoUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    // Zero-latency local image preview
    const previewEl = document.getElementById('preview-student-photo');
    if (previewEl) previewEl.src = URL.createObjectURL(file);

    const badge = document.getElementById('student-photo-status-badge');
    if (badge) {
        badge.className = 'text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800';
        badge.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Uploading...';
    }

    try {
        const compressedFile = await compressStudentProfileImage(file, 400, 0.8);
        const url = await uploadStudentFileViaApi(compressedFile);
        currentStudentPhotoUrl = url;

        if (badge) {
            badge.className = 'text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800';
            badge.innerHTML = '<i class="fas fa-check-circle mr-1"></i> Photo uploaded';
        }
        const removeBtn = document.getElementById('btn-remove-student-photo');
        if (removeBtn) removeBtn.classList.remove('hidden');

        if (typeof showToast === 'function') showToast("Photo uploaded", "success");
    } catch (e) {
        console.error("Student photo upload error:", e);
        if (typeof showToast === 'function') showToast("Photo upload failed", "error");
        if (badge) {
            badge.className = 'text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800';
            badge.innerText = 'Upload failed';
        }
    }
}

// Remove Photo
function removeStudentPhoto() {
    currentStudentPhotoUrl = '';
    const def = window.DEFAULT_STUDENT_AVATAR || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2NiZDVlMSI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg==';
    const previewEl = document.getElementById('preview-student-photo');
    if (previewEl) previewEl.src = def;

    const badge = document.getElementById('student-photo-status-badge');
    if (badge) {
        badge.className = 'text-[9px] font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600';
        badge.innerText = 'Default photo';
    }

    const removeBtn = document.getElementById('btn-remove-student-photo');
    if (removeBtn) removeBtn.classList.add('hidden');

    const input = document.getElementById('upload-student-photo-input');
    if (input) input.value = '';
}

// Multiple Documents Management
function renderStudentAttachedDocsList() {
        if (!currentStudentDocs || currentStudentDocs.length === 0) {
        return `
            <div class="text-center py-4 bg-gray-50/70 border border-dashed border-gray-200 rounded-xl text-gray-400">
                <p class="text-xs font-bold text-gray-400">No documents attached</p>
            </div>
        `;
    }

    return currentStudentDocs.map((doc) => {
        const isPdf = doc.name && doc.name.toLowerCase().endsWith('.pdf');
        const iconClass = isPdf ? 'fa-file-pdf text-red-500' : 'fa-file-image text-blue-500';
        const formattedSize = doc.size ? `${Math.round(doc.size / 1024)} KB` : '';

        return `
            <div class="flex items-center justify-between p-2.5 bg-white border border-gray-200 rounded-xl shadow-xs hover:border-gray-300 transition-colors">
                <div class="flex items-center gap-2.5 min-w-0 pr-2">
                    <div class="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-sm flex-shrink-0">
                        <i class="fas ${iconClass}"></i>
                    </div>
                    <div class="min-w-0">
                        <div class="flex items-center gap-1.5 flex-wrap">
                            <span class="text-xs font-black text-gray-800 truncate">${doc.name}</span>
                            <span class="text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.2 rounded-md">${doc.type}</span>
                        </div>
                        <p class="text-[10px] text-gray-400">
                            ${formattedSize ? `${formattedSize} • ` : ''}Attached
                        </p>
                    </div>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                    <a href="${doc.url}" target="_blank" class="px-2.5 py-1 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 text-gray-600 text-[10px] font-bold rounded-lg border border-gray-200 transition-colors flex items-center gap-1">
                        <i class="fas fa-external-link-alt text-[9px]"></i>
                        <span>View</span>
                    </a>
                    <button type="button" onclick="removeStudentAttachedDoc('${doc.id}')" class="text-gray-400 hover:text-red-600 p-1.5 rounded transition-colors text-xs" title="Remove Document">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

async function handleStudentMultipleDocsUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const btnText = document.getElementById('student-doc-upload-btn-text');
    const selectedType = document.getElementById('student-doc-type-select')?.value || 'General Document';

    if (btnText) btnText.innerHTML = `<i class="fas fa-spinner fa-spin text-blue-600 mr-1"></i> Uploading...`;

    let uploadCount = 0;
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
            const url = await uploadStudentFileViaApi(file);
            currentStudentDocs.push({
                id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                name: file.name,
                type: selectedType,
                url: url,
                size: file.size,
                uploadedAt: Date.now()
            });
            uploadCount++;
        } catch (e) {
            console.error("Document upload failed for " + file.name, e);
            if (typeof showToast === 'function') showToast(`Failed to upload ${file.name}`, "error");
        }
    }

    if (btnText) btnText.innerText = 'Attach Document';
    event.target.value = '';

    updateStudentAttachedDocsUI();

    if (uploadCount > 0 && typeof showToast === 'function') {
        showToast(uploadCount === 1 ? "Document attached" : `${uploadCount} documents attached`, "success");
    }
}

function removeStudentAttachedDoc(docId) {
    currentStudentDocs = currentStudentDocs.filter(d => d.id !== docId);
    updateStudentAttachedDocsUI();
}

function updateStudentAttachedDocsUI() {
    const listEl = document.getElementById('student-attached-docs-list');
    if (listEl) listEl.innerHTML = renderStudentAttachedDocsList();

    const badge = document.getElementById('student-doc-count-badge');
    if (badge) {
        badge.innerText = `${currentStudentDocs.length} Documents Attached`;
        badge.className = `text-[9px] font-bold px-2 py-0.5 rounded-full ${currentStudentDocs.length > 0 ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-gray-100 text-gray-600'}`;
    }
}

// Registration Submission Handler
async function handleRegisterStudent() {
    if (!studentAddEngine) return;

    const fname = document.getElementById('std-fname')?.value.trim() || '';
    const mname = document.getElementById('std-mname')?.value.trim() || '';
    const lname = document.getElementById('std-lname')?.value.trim() || '';
    const gender = document.getElementById('std-gender')?.value || 'Male';
    const dob = document.getElementById('std-dob')?.value.trim() || '';
    const age = document.getElementById('std-age')?.value.trim() || '';
    const blood = document.getElementById('std-blood')?.value || 'Unknown';
    const father = document.getElementById('std-father')?.value.trim() || '';
    const mother = document.getElementById('std-mother')?.value.trim() || '';
    const phone = document.getElementById('std-phone')?.value.trim() || '';
    const email = document.getElementById('std-email')?.value.trim() || '';
    const classVal = document.getElementById('std-class-select')?.value || '1';
    const roll = document.getElementById('std-roll')?.value.trim() || '01';
    const joinYear = document.getElementById('std-join-year')?.value.trim() || '2083';

    const cStreet = document.getElementById('std-curr-street')?.value.trim() || '';
    const cCity = document.getElementById('std-curr-city')?.value.trim() || '';
    const cDistrict = document.getElementById('std-curr-district')?.value.trim() || '';

    const pStreet = document.getElementById('std-perm-street')?.value.trim() || cStreet;
    const pCity = document.getElementById('std-perm-city')?.value.trim() || cCity;
    const pDistrict = document.getElementById('std-perm-district')?.value.trim() || cDistrict;

    const photo = currentStudentPhotoUrl || (window.DEFAULT_STUDENT_AVATAR || undefined);

    const formData = {
        firstName: fname,
        middleName: mname,
        lastName: lname,
        gender,
        dob,
        age,
        bloodGroup: blood,
        fatherName: father,
        motherName: mother,
        phone,
        parentEmail: email,
        class: classVal,
        roll,
        joinYear,
        address: {
            current: { street: cStreet, city: cCity, district: cDistrict },
            permanent: { street: pStreet, city: pCity, district: pDistrict }
        },
        photo,
        documents: currentStudentDocs
    };

    const alertBox = document.getElementById('student-form-error-alert');
    const submitBtn = document.getElementById('btn-submit-student');
    if (alertBox) alertBox.classList.add('hidden');

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin mr-1"></i> Registering Student...`;
    }

    const result = await studentAddEngine.registerStudent(formData);

    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="fas fa-user-plus mr-1"></i> Register & Generate Student ID`;
    }

    if (!result.success) {
        if (alertBox) {
            alertBox.innerHTML = result.errors.map(e => `<div><i class="fas fa-exclamation-circle mr-1"></i> ${e}</div>`).join('');
            alertBox.classList.remove('hidden');
        }
        return;
    }

    // Success Notification & Reset
    if (typeof showToast === 'function') {
        showToast(`Student registered: ${result.student.name.first} ${result.student.name.last}`, "success");
    }

    const successBanner = document.getElementById('student-form-success-banner');
    const successMsg = document.getElementById('student-form-success-message');
    if (successBanner && successMsg) {
        successMsg.innerText = `Student ${result.student.name.first} ${result.student.name.last} registered in Class ${result.student.class} with ID ${result.studentId}`;
        successBanner.classList.remove('hidden');
    }

    resetStudentAddForm(false);
}

// Reset Form
function resetStudentAddForm(clearBanner = true) {
    if (document.getElementById('std-fname')) document.getElementById('std-fname').value = '';
    if (document.getElementById('std-mname')) document.getElementById('std-mname').value = '';
    if (document.getElementById('std-lname')) document.getElementById('std-lname').value = '';
    if (document.getElementById('std-dob')) document.getElementById('std-dob').value = '';
    if (document.getElementById('std-age')) document.getElementById('std-age').value = '';
    if (document.getElementById('std-father')) document.getElementById('std-father').value = '';
    if (document.getElementById('std-mother')) document.getElementById('std-mother').value = '';
    if (document.getElementById('std-phone')) document.getElementById('std-phone').value = '';
    if (document.getElementById('std-email')) document.getElementById('std-email').value = '';
    if (document.getElementById('std-curr-street')) document.getElementById('std-curr-street').value = '';
    if (document.getElementById('std-curr-city')) document.getElementById('std-curr-city').value = '';
    if (document.getElementById('std-curr-district')) document.getElementById('std-curr-district').value = '';
    if (document.getElementById('std-perm-street')) document.getElementById('std-perm-street').value = '';
    if (document.getElementById('std-perm-city')) document.getElementById('std-perm-city').value = '';
    if (document.getElementById('std-perm-district')) document.getElementById('std-perm-district').value = '';

    const syncCb = document.getElementById('std-sync-addr');
    if (syncCb) {
        syncCb.checked = false;
        handleStudentAddressSync();
    }

    removeStudentPhoto();
    currentStudentDocs = [];
    updateStudentAttachedDocsUI();

    const alertBox = document.getElementById('student-form-error-alert');
    if (alertBox) alertBox.classList.add('hidden');

    if (clearBanner) {
        const successBanner = document.getElementById('student-form-success-banner');
        if (successBanner) successBanner.classList.add('hidden');
    }

    // Refresh roll for active class
    const classVal = document.getElementById('std-class-select')?.value || '1';
    handleStudentClassChange(classVal);
}

// Export for Global & ES Modules
if (typeof window !== 'undefined') {
    window.initStudentAdd = initStudentAdd;
    window.handleRegisterStudent = handleRegisterStudent;
    window.resetStudentAddForm = resetStudentAddForm;
    window.handleStudentClassChange = handleStudentClassChange;
    window.calculateStudentNepaliAge = calculateStudentNepaliAge;
    window.handleStudentAddressSync = handleStudentAddressSync;
    window.handleStudentPhotoUpload = handleStudentPhotoUpload;
    window.removeStudentPhoto = removeStudentPhoto;
    window.handleStudentMultipleDocsUpload = handleStudentMultipleDocsUpload;
    window.removeStudentAttachedDoc = removeStudentAttachedDoc;
}
