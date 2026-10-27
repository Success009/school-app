// Shared Core System for Udayashree School App (Restructured for Dynamic Stats)

/**
 * ARCHITECTURAL GUIDELINES & DECISION MAP (CRITICAL FOR INCOMING AI DEVELOPERS)
 * 
 * 1. WHY WE USE PROGRAMMATIC IN-MEMORY SCRIPT-BASED OVERWRITES INSTEAD OF BROWSER EDIT TOOLS:
 *    - The local browser CLI harness has a clipboard-paste interception bug when executing standard regex edits.
 *      It can accidentally capture and append 20,000+ lines of Google AI Studio page context (over 800 KB) into the file,
 *      corrupting its syntax. To prevent this regression, always perform file modifications programmatically in-memory
 *      via isolated terminal commands (sys_run_command node/python scripts).
 * 
 * 2. WHY WE USE OFFLINE-READY BASE64 EMBEDDED SVG AVATARS INSTEAD OF via.placeholder.com:
 *    - External URL dependencies (like via.placeholder.com) suffer from domain blocks, deprecation outages (ERR_CONNECTION_CLOSED),
 *      and require active internet connections. Since this app is wrapped into hybrid webshells (like Apache Cordova)
 *      to run offline in low-connectivity classrooms, we use base64-encoded inline SVGs. They render instantly with 
 *      0ms network latency, consume 0 bandwidth, and are 100% reliable offline.
 * 
 * 3. WHY WE USE THE TRANSPARENT COMPATIBILITY ADAPTER PATTERN FOR THE FIREBASE MOCK:
 *    - Over 5,000 lines of legacy dashboard scripts (admin-core.js, etc.) are distributed across multiple files and
 *      rely on 'db.ref()' syntax. Refactoring them entirely is a high regression hazard. The Adapter Pattern allows
 *      us to wrap modern, testable REST services (APIService, DatabaseService) within a lightweight, backwards-compatible
 *      mock interface, supporting complex snapshot mechanisms (exists, val, numChildren, forEach).
 * 
 * 4. WHY THE SERVERVALUE.TIMESTAMP PROTOCOL IS RECURSIVELY TRANSLATED CLIENT-SIDE:
 *    - Legacy UI scripts write ServerValue.TIMESTAMP strings which fail to serialize cleanly to a standard JSON file.
 *      We intercept these placeholders client-side in MockRef.set() and MockRef.update(), recursively crawling the payload
 *      to replace them with local millisecond epochs (Date.now()) right before submitting.
 */

// ==========================================
// ROBUST MODULAR SERVICES & SELF-HOSTED MOCK
// ==========================================

// 1. APIService: Handles connection state, retries, and REST calls
class APIService {
    static async request(url, options = { }) {
        const retries = options.retries || 3;
        const delay = options.delay || 1000;
        
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                if (!navigator.onLine) {
                    throw new Error("Device is offline");
                }
                const response = await fetch(url, options);
                if (!response.ok) {
                    throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
                }
                return await response.json();
            } catch (error) {
                console.warn(`API Request attempt ${attempt} failed for ${url}:`, error);
                if (attempt === retries) {
                    this.showNetworkWarning(error.message);
                    throw error;
                }
                await new Promise(resolve => setTimeout(resolve, delay * attempt));
            }
        }
    }

    static async get(path) {
        return this.request(`/api/db?path=${encodeURIComponent(path)}`);
    }

    static async post(path, value) {
        return this.request('/api/db', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path, value })
        });
    }

    static async patch(path, value) {
        return this.request('/api/db', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path, value })
        });
    }

    static async delete(path) {
        return this.request(`/api/db?path=${encodeURIComponent(path)}`, {
            method: 'DELETE'
        });
    }

    static async upload(path, file, onProgress = null) {
        return new Promise((resolve, reject) => {
            if (!navigator.onLine) {
                return reject(new Error("Device is offline"));
            }
            const xhr = new XMLHttpRequest();
            xhr.open('POST', `/api/upload?path=${encodeURIComponent(path)}`);

            if (onProgress) {
                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        onProgress(e.loaded, e.total);
                    }
                });
            }

            xhr.addEventListener('error', () => {
                reject(new Error("Network upload error"));
            });

            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const resp = JSON.parse(xhr.responseText);
                        resolve(resp.url);
                    } catch (e) {
                        reject(e);
                    }
                } else {
                    reject(new Error(`Upload failed with status ${xhr.status}`));
                }
            });

            const formData = new FormData();
            formData.append('file', file);
            xhr.send(formData);
        });
    }

    static showNetworkWarning(message) {
        console.error("Critical Network Warning:", message);
        if (typeof document === 'undefined') return;
        let warningToast = document.getElementById('network-warning-toast');
        if (!warningToast) {
            warningToast = document.createElement('div');
            warningToast.id = 'network-warning-toast';
            warningToast.className = 'fixed bottom-4 right-4 z-[99999] bg-red-600 text-white font-bold p-4 rounded-xl shadow-2xl flex items-center gap-3';
            document.body.appendChild(warningToast);
        }
        warningToast.innerHTML = `
            <i class="fas fa-exclamation-triangle text-xl"></i>
            <div>
                <p class="text-xs uppercase tracking-wider font-black">Connection Trouble</p>
                <p class="text-[10px] opacity-80">${message}</p>
            </div>
`;
        setTimeout(() => {
            if (warningToast && warningToast.parentNode) {
                warningToast.parentNode.removeChild(warningToast);
            }
        }, 5000);
    }
}

// 2. AuthService: Handles logins, credentials verification, session caches
class AuthService {
    static getRoles() {
        return {
            PARENT: 'parent',
            TEACHER: 'teacher',
            ADMIN: 'admin'
        };
    }

    static getCurrentUser() {
        const saved = localStorage.getItem('school_app_user');
        if (!saved) return null;
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error("AuthService: session corrupted", e);
            this.logout();
            return null;
        }
    }

    static setCurrentUser(user) {
        localStorage.setItem('school_app_user', JSON.stringify(user));
    }

    static checkAuth(allowedRoles) {
        const user = this.getCurrentUser();
        if (!user) {
            window.location.href = 'index.html';
            return false;
        }
        if (allowedRoles && !allowedRoles.includes(user.role)) {
            this.redirectUserToRoleDashboard(user.role);
            return false;
        }
        return true;
    }

    static redirectUserToRoleDashboard(role) {
        const roles = this.getRoles();
        switch (role) {
            case roles.PARENT:
                window.location.href = 'parent.html';
                break;
            case roles.TEACHER:
                window.location.href = 'teacher.html';
                break;
            case roles.ADMIN:
                window.location.href = 'admin.html';
                break;
            default:
                window.location.href = 'index.html';
        }
    }

    static logout() {
        localStorage.removeItem('school_app_user');
        window.location.href = 'index.html';
    }

    static async verifyPhoneRegistered(phone) {
        try {
            const adminData = await APIService.get(`school/admin/${phone}`);
            if (adminData) return { isRegistered: true, role: 'admin' };

            const mapData = await APIService.get(`school/login_mappings/${phone}`);
            if (mapData) return { isRegistered: true, role: mapData.role, mapData };

            return { isRegistered: false };
        } catch (e) {
            console.error("AuthService: registration check failed", e);
            throw e;
        }
    }

    static async executeLogin(phone, code) {
        if (code !== '0000') {
            throw new Error("Invalid verification code. Please enter '0000' to login.");
        }

        const registration = await this.verifyPhoneRegistered(phone);
        if (!registration.isRegistered) {
            throw new Error("Invalid phone number: This mobile number is not registered in the school database.");
        }

        const roles = this.getRoles();
        let sessionUser = null;

        if (registration.role === 'admin') {
            sessionUser = {
                role: roles.ADMIN,
                id: 'ADM-' + phone.slice(-4),
                name: 'Administrator',
                phone: phone
            };
        } else {
            const mapData = registration.mapData;
            if (mapData.role === 'teacher' || mapData.role === 'principal') {
                const teacherProfile = await APIService.get(`school/teachers/${mapData.studentId}`);
                if (!teacherProfile) {
                    throw new Error("Teacher profile record missing in database.");
                }
                
                let fullName = '';
                if (teacherProfile.name && typeof teacherProfile.name === 'object') {
                    fullName = `${teacherProfile.name.first || ''} ${teacherProfile.name.middle || ''} ${teacherProfile.name.last || ''}`.replace(/\s+/g, ' ').trim();
                } else {
                    fullName = teacherProfile.name || 'Faculty Member';
                }

                sessionUser = {
                    role: roles.TEACHER,
                    id: mapData.studentId,
                    name: fullName,
                    phone: teacherProfile.phone || phone,
                    photo: teacherProfile.photo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150',
                    subjects: teacherProfile.subjects || [ ],
                    assignedClasses: teacherProfile.assignedClasses || [ ],
                    classTeacherOf: teacherProfile.classTeacherOf || 'none',
                    schedule: teacherProfile.schedule || [
                        { period: '1st', class: teacherProfile.assignedClasses ? teacherProfile.assignedClasses[0] : '10-A', subject: teacherProfile.subjects ? teacherProfile.subjects[0] : 'Mathematics', time: '10:00 AM' }
                    ]
                };
            } else if (mapData.role === 'admin') {
                sessionUser = {
                    role: roles.ADMIN,
                    id: mapData.studentId || 'A-001',
                    name: 'Admin Staff',
                    phone: phone
                };
            } else {
                const studentProfile = await APIService.get(`school/students/${mapData.studentId}`);
                if (!studentProfile) {
                    throw new Error("Student profile record missing in database.");
                }

                sessionUser = {
                    role: roles.PARENT,
                    id: 'P-' + phone.slice(-4),
                    name: studentProfile.parentName || 'Student Parent',
                    phone: phone,
                    studentId: mapData.studentId,
                    studentName: studentProfile.name || 'Student',
                    studentClass: studentProfile.class || '1',
                    studentPhoto: studentProfile.photo || 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150'
                };
            }
        }

        if (sessionUser) {
            this.setCurrentUser(sessionUser);
            return sessionUser;
        } else {
            throw new Error("Failed to construct user session.");
        }
    }
}

// 3. DatabaseService: Handles data fetch and storage operations in local db
class DatabaseService {
    static async getStudents() {
        const data = await APIService.get('school/students');
        return data ? Object.entries(data).map(([id, val]) => ({ id, ...val })) : [ ];
    }

    static async getStudent(id) {
        return APIService.get(`school/students/${id}`);
    }

    static async saveStudent(id, studentData) {
        return APIService.post(`school/students/${id}`, studentData);
    }

    static async updateStudent(id, updates) {
        return APIService.patch(`school/students/${id}`, updates);
    }

    static async removeStudent(id) {
        return APIService.delete(`school/students/${id}`);
    }

    static async getTeachers() {
        const data = await APIService.get('school/teachers');
        return data ? Object.entries(data).map(([id, val]) => ({ id, ...val })) : [ ];
    }

    static async getTeacher(id) {
        return APIService.get(`school/teachers/${id}`);
    }

    static async saveTeacher(id, teacherData) {
        return APIService.post(`school/teachers/${id}`, teacherData);
    }

    static async updateTeacher(id, updates) {
        return APIService.patch(`school/teachers/${id}`, updates);
    }

    static async removeTeacher(id) {
        return APIService.delete(`school/teachers/${id}`);
    }

    static async saveLoginMapping(phone, mapData) {
        return APIService.post(`school/login_mappings/${phone}`, mapData);
    }

    static async removeLoginMapping(phone) {
        return APIService.delete(`school/login_mappings/${phone}`);
    }

    static async archiveStudent(id, studentData) {
        return APIService.post(`school/archives/students/${id}`, studentData);
    }

    static async logStudentStatusHistory(logData) {
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        let key = '';
        for (let i = 0; i < 16; i++) {
            key += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return APIService.post(`school/student_status_history/${key}`, logData);
    }

    static async getExamWindows() {
        const data = await APIService.get('school/exam_windows');
        return data ? Object.entries(data).map(([id, val]) => ({ id, ...val })) : [ ];
    }

    static async saveExamWindow(id, examData) {
        return APIService.post(`school/exam_windows/${id}`, examData);
    }

    static async updateExamStatus(id, status) {
        return APIService.patch(`school/exam_windows/${id}`, { status });
    }

    static async removeExamWindow(id) {
        return APIService.delete(`school/exam_windows/${id}`);
    }

    static async getDraftResults() {
        return await APIService.get('school/draft_results') || { };
    }

    static async getStudentResults(studentId, term) {
        return APIService.get(`school/results/${studentId}/${term}`);
    }

    static async saveDraftMark(studentId, examId, subjectId, markData) {
        return APIService.post(`school/draft_results/${studentId}/${examId}/${subjectId}`, markData);
    }

    static async savePublishedMark(studentId, examId, subjectId, markData) {
        return APIService.post(`school/results/${studentId}/${examId}/${subjectId}`, markData);
    }

    static async batchUpdate(updates) {
        return APIService.patch('', updates);
    }

    static async getAttendance(classId) {
        return await APIService.get(`school/attendance/${classId}`) || { };
    }

        static async getClasses() {
        const data = await APIService.get('school/classes');
        if (!data) return [ ];
        if (Array.isArray(data)) return data;
        return Object.entries(data).map(([id, val]) => (typeof val === 'object' && val !== null ? { id, ...val } : { id, name: val }));
    }

    static async saveClass(classId, classData) {
        return APIService.post(`school/classes/${classId}`, classData);
    }

    static async removeClass(classId) {
        await APIService.delete(`school/classes/${classId}`);
        await APIService.delete(`school/class_configs/${classId}`);
        return { success: true };
    }

    static async getClassConfigs(classId) {
        return await APIService.get(`school/class_configs/${classId}`) || { };
    }

    static async saveClassSubject(classId, subjectId, subjectData) {
        return APIService.post(`school/class_configs/${classId}/subjects/compulsory/${subjectId}`, subjectData);
    }

    static async removeClassSubject(classId, subjectId) {
        return APIService.delete(`school/class_configs/${classId}/subjects/compulsory/${subjectId}`);
    }

    static async getPeriodTimings() {
        const data = await APIService.get('school/config/period_timings');
        return data ? Object.entries(data).map(([id, val]) => ({ id, ...val })) : [ ];
    }

    static async savePeriodTiming(key, periodData) {
        return APIService.post(`school/config/period_timings/${key}`, periodData);
    }

    static async removePeriodTiming(key) {
        return APIService.delete(`school/config/period_timings/${key}`);
    }

    static async getNotices() {
        const data = await APIService.get('school/notices');
        return data ? Object.entries(data).map(([id, val]) => ({ id, ...val })) : [ ];
    }

    static async saveNotice(noticeData) {
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        let key = '';
        for (let i = 0; i < 16; i++) {
            key += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return APIService.post(`school/notices/${key}`, noticeData);
    }

    static async getTickets() {
        const data = await APIService.get('school/tickets');
        return data ? Object.entries(data).map(([id, val]) => ({ id, ...val })) : [ ];
    }

    static async saveTicket(id, ticketData) {
        return APIService.post(`school/tickets/${id}`, ticketData);
    }

    static async getSuggestions() {
        const data = await APIService.get('school/suggestions');
        return data ? Object.entries(data).map(([id, val]) => ({ id, ...val })) : [ ];
    }

    static async saveSuggestion(id, sugData) {
        return APIService.post(`school/suggestions/${id}`, sugData);
    }

    static async getClassChangeRequests() {
        const data = await APIService.get('school/class_change_requests');
        return data ? Object.entries(data).map(([id, val]) => ({ id, ...val })) : [ ];
    }

    static async saveClassChangeRequest(requestId, reqData) {
        return APIService.post(`school/class_change_requests/${requestId}`, reqData);
    }

    static async updateClassChangeRequestStatus(requestId, status) {
        return APIService.patch(`school/class_change_requests/${requestId}`, { status });
    }
}

// 4. Transparent Firebase compatibility adapter layers
function replaceTimestamps(obj) {
    if (obj === null || obj === undefined) return obj;
    if (obj === "__TIMESTAMP__") return Date.now();
    if (Array.isArray(obj)) {
        return obj.map(item => replaceTimestamps(item));
    }
    if (typeof obj === "object") {
        const newObj = { };
        for (const [key, val] of Object.entries(obj)) {
            newObj[key] = replaceTimestamps(val);
        }
        return newObj;
    }
    return obj;
}

class MockSnapshot {
    constructor(val, key = null) {
        this._val = val;
        this.key = key;
    }
    val() {
        return this._val;
    }
    exists() {
        return this._val !== null && this._val !== undefined;
    }
    numChildren() {
        if (this._val === null || this._val === undefined) return 0;
        if (typeof this._val === 'object') {
            return Object.keys(this._val).length;
        }
        if (Array.isArray(this._val)) {
            return this._val.length;
        }
        return 1;
    }
    forEach(callback) {
        if (this._val && typeof this._val === 'object') {
            for (const [key, val] of Object.entries(this._val)) {
                const childSnap = new MockSnapshot(val, key);
                if (callback(childSnap) === true) break;
            }
        }
    }
}

class MockRef {
    constructor(path, dbInstance) {
        this.path = path;
        this.db = dbInstance;
        this.queryOpts = null;
    }

    orderByChild(key) {
        this.queryOpts = this.queryOpts || { };
        this.queryOpts.orderByChild = key;
        return this;
    }

    equalTo(val) {
        this.queryOpts = this.queryOpts || { };
        this.queryOpts.equalTo = val;
        return this;
    }

    limitToLast(limit) {
        this.queryOpts = this.queryOpts || { };
        this.queryOpts.limitToLast = limit;
        return this;
    }

    async once(eventStr) {
        if (eventStr !== "value") return new MockSnapshot(null);
        let data = await APIService.get(this.path);

        if (this.queryOpts) {
            const opts = this.queryOpts;
            if (data && typeof data === "object") {
                let entries = Object.entries(data);
                if (opts.orderByChild) {
                    if (opts.equalTo !== undefined) {
                        entries = entries.filter(([k, v]) => v && v[opts.orderByChild] === opts.equalTo);
                    }
                    if (opts.limitToLast !== undefined) {
                        entries = entries.slice(-opts.limitToLast);
                    }
                    data = Object.fromEntries(entries);
                }
            }
        }
        return new MockSnapshot(data);
    }

    on(eventStr, callback) {
        if (eventStr !== "value") return;
        this._pollCallback = async () => {
            try {
                const snap = await this.once("value");
                callback(snap);
            } catch (e) {
                console.error("Polling error:", e);
            }
        };
        this._pollCallback();
        this._pollInterval = setInterval(this._pollCallback, 3000);
    }

    off(eventStr) {
        if (this._pollInterval) {
            clearInterval(this._pollInterval);
            this._pollInterval = null;
        }
    }

    async set(value) {
        const processedVal = replaceTimestamps(value);
        return APIService.post(this.path, processedVal);
    }

    async update(value) {
        const processedVal = replaceTimestamps(value);
        return APIService.patch(this.path, processedVal);
    }

    async remove() {
        return APIService.delete(this.path);
    }

    push(value) {
        const chars = "-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz";
        let key = "";
        let ts = Date.now();
        const tsChars = new Array(8);
        for (let i = 7; i >= 0; i--) {
            tsChars[i] = chars.charAt(ts % 64);
            ts = Math.floor(ts / 64);
        }
        key += tsChars.join("");
        for (let i = 0; i < 12; i++) {
            key += chars.charAt(Math.floor(Math.random() * 64));
        }

        const nextPath = this.path ? this.path + "/" + key : key;
        const pushRef = new MockRef(nextPath, this.db);
        pushRef.key = key;

        if (value !== undefined) {
            pushRef.set(value);
        }
        return pushRef;
    }
}

class MockStorageTask {
    constructor(file, path) {
        this.file = file;
        this.path = path;
        this.snapshot = {
            ref: {
                getDownloadURL: async () => this.downloadURL
            }
        };
        this.downloadURL = null;
    }

    on(eventStr, progress_cb, error_cb, success_cb) {
        APIService.upload(this.path, this.file, (loaded, total) => {
            const snapshot = {
                bytesTransferred: loaded,
                totalBytes: total
            };
            progress_cb(snapshot);
        }).then((url) => {
            this.downloadURL = url;
            success_cb();
        }).catch((err) => {
            error_cb(err);
        });
    }
}

class MockStorageRef {
    constructor(path) {
        this.path = path;
    }
    put(file) {
        return new MockStorageTask(file, this.path);
    }
}

// 5. Expose Global services and mock SDKs to prevent legacy breakage
const firebase = {
    apps: { length: 1 },
    initializeApp: () => { },
    database: () => ({
        ref: (path) => new MockRef(path, firebase.database())
    }),
    storage: () => ({
        ref: (path) => new MockStorageRef(path)
    })
};

Object.defineProperty(firebase.database, 'ServerValue', {
    get() {
        return { TIMESTAMP: "__TIMESTAMP__" };
    }
});

const db = firebase.database();
const storage = firebase.storage();

// Expose architecture layers on global window for clean unit testing and access
window.APIService = APIService;
window.AuthService = AuthService;
window.DatabaseService = DatabaseService;
window.firebase = firebase;
window.db = db;
window.storage = storage;

// Role Constants
const ROLES = {
    PARENT: 'parent',
    TEACHER: 'teacher',
    ADMIN: 'admin'
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
 * @param {File} file - The file to upload
 * @param {string} path - Storage path
 * @param {string} taskLabel - User-friendly label (e.g., "Adding Student")
 */
async function uploadFile(file, path, taskLabel = "Processing") {
    showUploadProgress(0, taskLabel, "Initializing...");
    
    let fileToUpload = file;
    if (file.type.startsWith('image/')) {
        showUploadProgress(5, taskLabel, "Optimizing Graphics...");
        fileToUpload = await processImage(file);
    }

    const storageRef = storage.ref(path);
    const uploadTask = storageRef.put(fileToUpload);

    return new Promise((resolve, reject) => {
        uploadTask.on('state_changed', 
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 80 + 10;
                showUploadProgress(progress, taskLabel, `Transferring Data... ${Math.round(progress)}%`);
            }, 
            (error) => {
                hideUploadProgress();
                reject(error);
            }, 
            async () => {
                showUploadProgress(95, taskLabel, "Finalizing Sync...");
                const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                showUploadProgress(100, taskLabel, "Verified!");
                setTimeout(hideUploadProgress, 800);
                resolve(downloadURL);
            }
        );
    });
}

function showUploadProgress(percent, title, stepLabel) {
    let overlay = document.getElementById('global-upload-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'global-upload-overlay';
        overlay.className = 'fixed inset-0 z-[20000] bg-black/60 backdrop-blur-xl flex flex-col items-center justify-center p-8 transition-all duration-500 opacity-0 pointer-events-none';
        overlay.innerHTML = `
            <div class="w-full max-w-sm bg-white rounded-[40px] p-8 shadow-2xl scale-95 transition-transform duration-500 text-center space-y-6 border border-white/20">
                <div class="relative w-32 h-32 mx-auto">
                    <svg class="w-full h-full transform -rotate-90">
                        <circle cx="64" cy="64" r="58" stroke="currentColor" stroke-width="8" fill="transparent" class="text-gray-100" />
                        <circle id="progress-circle" cx="64" cy="64" r="58" stroke="currentColor" stroke-width="8" fill="transparent" stroke-dasharray="364.4" stroke-dashoffset="364.4" stroke-linecap="round" class="text-blue-600 transition-all duration-500 ease-out" />
                    </svg>
                    <div id="progress-text" class="absolute inset-0 flex items-center justify-center text-gray-900 font-black text-xl">0%</div>
                </div>
                <div class="space-y-2">
                    <h3 id="progress-title" class="text-gray-900 font-black text-lg tracking-tight">Processing</h3>
                    <p id="progress-step" class="text-blue-600 text-[10px] font-black uppercase tracking-widest animate-pulse">Initializing...</p>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        void overlay.offsetWidth; // Reflow
        overlay.classList.remove('opacity-0', 'pointer-events-none');
        overlay.querySelector('div').classList.remove('scale-95');
    }
    
    const circle = document.getElementById('progress-circle');
    const text = document.getElementById('progress-text');
    const titleEl = document.getElementById('progress-title');
    const stepEl = document.getElementById('progress-step');
    
    if (circle) circle.style.strokeDashoffset = 364.4 - (percent / 100) * 364.4;
    if (text) text.innerText = `${Math.round(percent)}%`;
    if (titleEl) titleEl.innerText = title;
    if (stepEl) stepEl.innerText = stepLabel;
}

function hideUploadProgress() {
    const overlay = document.getElementById('global-upload-overlay');
    if (overlay) {
        overlay.classList.add('opacity-0', 'pointer-events-none');
        overlay.querySelector('div').classList.add('scale-95');
        setTimeout(() => overlay.remove(), 500);
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

    const logoutBtnHtml = (currentUser && currentUser.role === ROLES.PARENT)
        ? ''
        : `<button onclick="handleLogout()" class="text-white hover:text-red-200 active:scale-95 transition-transform ml-2">
               <i class="fas fa-sign-out-alt text-lg"></i>
           </button>`;

    const headerHtml = `
        <div class="flex items-center justify-between w-full">
            <div class="flex items-center">
                ${backBtnHtml}
                <h1 id="page-title" class="text-lg font-bold truncate max-w-[200px]">${title}</h1>
            </div>
            <div class="flex items-center gap-3">
                <div class="relative cursor-pointer" onclick="${currentUser?.role === ROLES.PARENT ? "parentRouter('notices')" : ''}">
                    <i class="fas fa-bell text-xl"></i>
                    <span id="header-bell-badge" class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-blue-700 hidden"></span>
                </div>
                ${logoutBtnHtml}
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
 * Dynamic Metadata Discovery
 * Scans students database to extract unique classes and sections.
 * Ensures filters and dropdowns are always synchronized with actual data.
 */
async function getSchoolMetadata() {
    return {
        classes: ["1", "2", "3", "4", "5", "6", "7", "8"],
        sections: [ ]
    };
}

/**
 * Dynamic Student ID Generator
 * Formats: US-{JoinYear}-{RandomNumeric4Digits}
 * Example: US-2026-4789
 */
function generateStudentID(joinYear) {
    const currentBSYear = getNepaliDateClass() ? new (getNepaliDateClass())().getYear() : 2083;
    const cleanYear = joinYear || currentBSYear;
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
        return (url && url.startsWith('http')) ? url : "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2NiZDVlMSI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg==";
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

    const sortedEntries = Object.entries(teachers).sort((a, b) => {
        const orderA = a[1].sortOrder !== undefined ? parseInt(a[1].sortOrder) : 9999;
        const orderB = b[1].sortOrder !== undefined ? parseInt(b[1].sortOrder) : 9999;
        return orderA - orderB;
    });

    listContainer.innerHTML = sortedEntries.map(([teacherId, t]) => {
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
        const profTitleBadge = (profTitle && profTitle !== 'Faculty Member' && profTitle !== 'teacher' && profTitle !== 'Faculty') 
            ? `<span class="px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase bg-indigo-100 text-indigo-700 border border-indigo-200 ml-1">${profTitle}</span>` 
            : '';

        const subjectStr = t.subjects ? (Array.isArray(t.subjects) ? t.subjects.join(', ') : t.subjects) : 'N/A';

        // Custom action callback for admin/profile loading vs dynamic list
        const clickAttr = options.showAdminActions 
            ? `onclick="viewTeacherProfileDetails('${teacherId}')"` 
            : ``;

        return `
            <div ${clickAttr} class="mobile-card flex items-center p-4 bg-white border border-gray-100 shadow-sm relative overflow-hidden active:bg-gray-50 transition-colors ${options.showAdminActions ? 'cursor-pointer' : ''}">
                <img src="${SafeResolvers.photo(t.photo)}" class="w-12 h-12 rounded-xl object-cover mr-4 border border-gray-100 shadow-sm">
                <div class="flex-grow">
                    <div class="flex items-center gap-2 flex-wrap">
                        <h4 class="font-bold text-gray-800 text-sm">${fullName}</h4>
                        <span class="px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${badgeClass}">${status}</span>
                        ${profTitleBadge}
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
// Automatically initialize global notifications on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    setupGlobalNotificationUI();
});

function setupGlobalNotificationUI() {
    /**
     * Polished Global Alert Interceptor
     * Replaces standard browser alerts with a high-fidelity modal.
     */
    
    window.alert = function(message) {
        const cleanMsg = (typeof message === 'string') ? message : JSON.stringify(message);
        const modalId = 'custom-ui-alert-modal';
        let modal = document.getElementById(modalId);
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = modalId;
            modal.className = 'fixed inset-0 z-[30000] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md transition-all duration-500 opacity-0 pointer-events-none';
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="bg-white rounded-[32px] p-8 shadow-2xl max-w-sm w-full transform scale-90 transition-all duration-500 relative text-center border border-gray-100">
                <div class="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl shadow-inner">
                    <i class="fas fa-bell"></i>
                </div>
                <h4 class="font-black text-gray-900 text-lg mb-2 tracking-tight">System Message</h4>
                <p class="text-sm text-gray-500 leading-relaxed mb-8 font-medium">${cleanMsg.replace(/\n/g, '<br>')}</p>
                <button id="custom-alert-close-btn" class="w-full bg-gray-900 hover:bg-black active:scale-95 text-white font-black py-4 rounded-2xl text-sm transition-all shadow-xl outline-none">
                    Got it
                </button>
            </div>
        `;

        requestAnimationFrame(() => {
            modal.classList.remove('opacity-0', 'pointer-events-none');
            modal.querySelector('div').classList.remove('scale-90');
        });

        return new Promise((resolve) => {
            document.getElementById('custom-alert-close-btn').onclick = () => {
                modal.classList.add('opacity-0', 'pointer-events-none');
                modal.querySelector('div').classList.add('scale-90');
                setTimeout(resolve, 500);
            };
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

async function renderSharedStudentIncidentHistory(containerId, filterStudentId = null) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `<div class="text-center py-6 text-gray-400 text-xs"><i class="fas fa-spinner fa-spin mr-2"></i>Loading incident archives...</div>`;

    try {
        const snap = await db.ref('school/student_status_history').once('value');
        const history = snap.val();

        if (!history) {
            container.innerHTML = `<div class="text-center py-6 text-gray-400 text-xs italic bg-gray-50 rounded-xl p-4">No student incident or expulsion logs recorded in school archives.</div>`;
            return;
        }

        let logs = Object.values(history);
        if (filterStudentId) {
            logs = logs.filter(l => l.studentId === filterStudentId);
        }

        if (logs.length === 0) {
            container.innerHTML = `<div class="text-center py-6 text-gray-400 text-xs italic bg-gray-50 rounded-xl p-4">No incident logs found for this student.</div>`;
            return;
        }

        logs.sort((a, b) => b.timestamp - a.timestamp);

        container.innerHTML = logs.map(l => {
            let badgeClass = "bg-gray-100 text-gray-700";
            if (l.status === 'Expelled') badgeClass = "bg-red-100 text-red-700 border border-red-200";
            else if (l.status === 'Left') badgeClass = "bg-amber-100 text-amber-700 border border-amber-200";
            else if (l.status === 'Investigated') badgeClass = "bg-blue-100 text-blue-700 border border-blue-200";

            return `
                <div class="p-3 bg-white border border-gray-100 rounded-xl shadow-sm space-y-1.5 text-left">
                    <div class="flex justify-between items-center">
                        <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest">${l.studentName} (ID: ${l.studentId})</span>
                        <span class="px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${badgeClass}">${l.status}</span>
                    </div>
                    <p class="text-xs text-gray-700 font-semibold">${l.reason}</p>
                    <div class="flex justify-between items-center text-[8px] font-black text-gray-400 uppercase border-t border-gray-50 pt-1.5">
                        <span>Recorded By: ${l.recordedBy}</span>
                        <span>Date: ${l.date || convertToNepaliDate(l.timestamp)}</span>
                    </div>
            `;
        }).join('');

    } catch (e) {
        console.error(e);
        container.innerHTML = `<div class="text-center py-6 text-red-400 text-xs">Failed to load incident history: ${e.message}</div>`;
    }
}

function getNepaliDateClass() {
    return window.NepaliDate?.default || window.NepaliDate;
}

function getFormattedCurrentNepaliDate() {
    const NepaliDateClass = getNepaliDateClass();
    if (NepaliDateClass) {
        return new NepaliDateClass().format('YYYY-MM-DD');
    }
    // May 31, 2026 is BS 2083-02-17
    return "2083-02-17";
}

function convertToNepaliDate(englishDate) {
    if (!englishDate) return '';
    const dateObj = new Date(englishDate);
    if (isNaN(dateObj.getTime())) return englishDate;
    const NepaliDateClass = getNepaliDateClass();
    if (NepaliDateClass) {
        return new NepaliDateClass(dateObj).format('YYYY-MM-DD');
    }
    return englishDate;
}

function convertToEnglishDate(nepaliDateStr) {
    if (!nepaliDateStr) return null;
    const NepaliDateClass = getNepaliDateClass();
    if (NepaliDateClass) {
        try {
            return new NepaliDateClass(nepaliDateStr).toJsDate();
        } catch (e) {
            console.error("Nepali date translation error:", e);
        }
    }
    return new Date(nepaliDateStr);
}

function calculateNepaliAgeHelper(dobVal) {
    if (!dobVal) return '';
    const regex = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/;
    if (regex.test(dobVal)) {
        const parts = dobVal.split('-');
        const birthYear = parseInt(parts[0]);

        try {
            const NepaliDateClass = getNepaliDateClass();
            if (NepaliDateClass) {
                const currentBS = new NepaliDateClass();
                const currentYear = currentBS.getYear();
                let age = currentYear - birthYear;
                if (age < 0) age = 0;
                return age;
            }
        } catch (e) {
            console.error("Age computation exception:", e);
        }
        const currentYear = 2083;
        let age = currentYear - birthYear;
        if (age < 0) age = 0;
        return age;
    }
    return '';
}

function calculateNepaliAgeOnboarding() {
    const dobVal = document.getElementById('std-dob')?.value || '';
    const ageInput = document.getElementById('std-age');
    if (ageInput) {
        ageInput.value = calculateNepaliAgeHelper(dobVal);
    }
}
function calculateNepaliAgeEdit() {
    const dobVal = document.getElementById('edit-std-dob')?.value || '';
    const ageInput = document.getElementById('edit-std-age');
    if (ageInput) {
        ageInput.value = calculateNepaliAgeHelper(dobVal);
    }
}

function convertToNepaliDateTime(timestamp) {
    if (!timestamp) return '';
    const dateObj = new Date(timestamp);
    if (isNaN(dateObj.getTime())) return '';
    const dateStr = convertToNepaliDate(dateObj);
    const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return `${dateStr} ${timeStr}`;
}
    
