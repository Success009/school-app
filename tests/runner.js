// tests/runner.js - Polyfill-based headless test runner for browser modules
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

import { APIService } from '../modules/api.js';
import { AuthService } from '../modules/auth.js';
import { DatabaseService } from '../modules/db.js';
import { ValidationService } from '../modules/validation.js';
import { OfflineStore } from '../modules/offlineStore.js';
import { SmsSecurityService } from '../smsSecurity.js';

const { DbStorageService } = require('../controllers/dbStorage.js');
const { ServerValidation } = require('../controllers/validation.js');
const { ALLOWED_MIME_TYPES } = require('../controllers/uploadController.js');

// 1. Browser polyfills for headless environment
const storageMock = {};
global.navigator = { onLine: true };
global.localStorage = {
    getItem: (key) => storageMock[key] || null,
    setItem: (key, val) => { storageMock[key] = String(val); },
    removeItem: (key) => { delete storageMock[key]; }
};
global.window = {
    location: {
        href: ""
    }
};

// Polyfill document for UI warning tests
const elementStore = {};
global.document = {
    getElementById: (id) => elementStore[id] || null,
    createElement: (tag) => {
        const el = {
            tagName: tag,
            id: '',
            className: '',
            innerHTML: '',
            parentNode: null
        };
        return el;
    },
    body: {
        appendChild: (el) => {
            if (el.id) elementStore[el.id] = el;
            el.parentNode = global.document.body;
            return el;
        },
        removeChild: (el) => {
            if (el.id) delete elementStore[el.id];
            el.parentNode = null;
            return el;
        }
    }
};

// Polyfill FormData and XMLHttpRequest for upload testing
global.FormData = class {
    constructor() {
        this.fields = {};
    }
    append(key, val) {
        this.fields[key] = val;
    }
};

global.XMLHttpRequest = class {
    constructor() {
        this.upload = {
            addEventListener: (event, handler) => {
                this.uploadHandlers = this.uploadHandlers || {};
                this.uploadHandlers[event] = handler;
            }
        };
        this.listeners = {};
    }
    open(method, url) {
        this.method = method;
        this.url = url;
    }
    addEventListener(event, handler) {
        this.listeners[event] = handler;
    }
    send(data) {
        if (this.uploadHandlers && this.uploadHandlers['progress']) {
            this.uploadHandlers['progress']({ lengthComputable: true, loaded: 50, total: 100 });
        }
        this.status = 200;
        this.responseText = JSON.stringify({ url: '/uploads/mock-test.jpg' });
        if (this.listeners['load']) {
            this.listeners['load']();
        }
    }
};

// Dynamic in-memory mock database store
const mockDb = {
    school: {
        admin: {
            "9809248510": { name: "Super Admin", role: "admin" }
        },
        login_mappings: {
            "9800000001": { role: "parent", studentId: "US-2026-1234" },
            "9800000002": { role: "teacher", studentId: "UT-2083-1001" },
            "9800000003": { role: "admin", studentId: "A-001" }
        },
        students: {
            "US-2026-1234": { name: "Adarsh Rai", class: "3", parentName: "Sunita Rai" }
        },
        teachers: {
            "UT-2083-1001": {
                id: "UT-2083-1001",
                name: { first: "Sunita", last: "Rai" },
                phone: "9800000002",
                classTeacherOf: "3",
                assignedClasses: ["3"],
                subjects: ["Math"]
            }
        },
        exam_windows: {
            "EX-01": { name: "First Terminal 2026", status: "open" }
        },
        draft_results: {
            "US-2026-1234": {
                "EX-01": { "Math": { score: 95 } }
            }
        },
        results: {
            "US-2026-1234": {
                "First Terminal": { Math: 95 }
            }
        },
        attendance: {
            "3": { "2026-10-06": { "US-2026-1234": "P" } }
        },
        class_configs: {
            "3": { subjects: ["Math", "English"] }
        },
        config: {
            period_timings: {
                "period_1": { name: "Period 1", startTime: "10:00", endTime: "10:45" }
            }
        },
        notices: {
            "N-01": { title: "School Reopening", message: "Classes resume tomorrow" }
        },
        tickets: {
            "T-01": { subject: "Bus query", status: "pending" }
        },
        suggestions: {
            "S-01": { text: "Add more sports", author: "Parent" }
        },
        class_change_requests: {
            "REQ-01": { teacherId: "UT-2083-1001", requestedClass: "4", status: "pending" }
        },
        archives: {
            students: {}
        },
        student_status_history: {}
    }
};

function getDbValue(pathStr) {
    const parts = (pathStr || '').split('/').filter(Boolean);
    let curr = mockDb;
    for (const part of parts) {
        if (!curr || typeof curr !== 'object') return null;
        curr = curr[part];
    }
    return curr !== undefined ? curr : null;
}

function setDbValue(pathStr, val) {
    const parts = (pathStr || '').split('/').filter(Boolean);
    let curr = mockDb;
    for (let i = 0; i < parts.length - 1; i++) {
        if (!curr[parts[i]] || typeof curr[parts[i]] !== 'object') curr[parts[i]] = {};
        curr = curr[parts[i]];
    }
    const last = parts[parts.length - 1];
    if (val === null) delete curr[last];
    else curr[last] = val;
}

// Polyfill fetch for Database API routes
global.fetch = async (url, options = {}) => {
    const method = (options.method || 'GET').toUpperCase();
    const parsedUrl = new URL(url, 'http://localhost:5050');
    const path = parsedUrl.searchParams.get('path') || '';

    if (parsedUrl.pathname.includes('/api/db')) {
        if (method === 'GET') {
            const val = getDbValue(path);
            return {
                ok: true,
                status: 200,
                json: async () => val
            };
        }
        if (method === 'POST') {
            const body = JSON.parse(options.body || '{}');
            setDbValue(body.path, body.value);
            return {
                ok: true,
                status: 200,
                json: async () => ({ success: true, path: body.path })
            };
        }
        if (method === 'PATCH') {
            const body = JSON.parse(options.body || '{}');
            let parent = body.path ? getDbValue(body.path) : mockDb;
            if (!parent || typeof parent !== 'object') {
                parent = {};
                setDbValue(body.path, parent);
            }
            if (body.value) {
                for (const [k, v] of Object.entries(body.value)) {
                    if (k.includes('/')) {
                        const targetPath = body.path ? `${body.path}/${k}` : k;
                        setDbValue(targetPath, v);
                    } else {
                        if (v === null) delete parent[k];
                        else parent[k] = v;
                    }
                }
            }
            return {
                ok: true,
                status: 200,
                json: async () => ({ success: true })
            };
        }
        if (method === 'DELETE') {
            setDbValue(path, null);
            return {
                ok: true,
                status: 200,
                json: async () => ({ success: true })
            };
        }
    }

    if (parsedUrl.pathname.includes('/api/auth/stamp')) {
        const stampData = SmsSecurityService.generateStamp();
        return {
            ok: true,
            status: 200,
            json: async () => ({ success: true, ...stampData })
        };
    }

        if (parsedUrl.pathname.includes('/api/auth/otp/send')) {
        const body = JSON.parse(options.body || '{}');
        const stampVal = SmsSecurityService.validateStamp(body.stamp);
        if (!stampVal.valid) {
            return {
                ok: false,
                status: 403,
                json: async () => ({ success: false, error: stampVal.error })
            };
        }
        const rawDigits = String(body.phone || '').replace(/\D/g, '');
        const isTestMode = rawDigits.startsWith('000');
        const phone = isTestMode ? rawDigits.replace(/^000+/, '') : rawDigits;

        const reg = SmsSecurityService.isPhoneRegistered(mockDb, phone);
        if (!reg.registered) {
            return {
                ok: false,
                status: 403,
                json: async () => ({ success: false, error: 'Mobile number not registered.' })
            };
        }
        if (isTestMode) {
            return {
                ok: true,
                status: 200,
                json: async () => ({ success: true, sms_job_id: 999999, cooldown_seconds: 3, test_mode: true })
            };
        }
        return {
            ok: true,
            status: 200,
            json: async () => ({ success: true, sms_job_id: 1001, cooldown_seconds: 60 })
        };
    }

    if (parsedUrl.pathname.includes('/api/auth/otp/verify')) {
        const body = JSON.parse(options.body || '{}');
        const rawDigits = String(body.phone || '').replace(/\D/g, '');
        const phone = rawDigits.replace(/^000+/, '');
        const cleanOtp = String(body.otp || '').trim();

        if (cleanOtp !== '245510' && cleanOtp !== '000000' && cleanOtp !== '0000' && cleanOtp !== '123456') {
            return {
                ok: false,
                status: 400,
                json: async () => ({ success: false, error: 'Invalid verification code.' })
            };
        }
        const user = { phone: phone, role: 'admin', id: 'ADM-8510', name: 'Super Admin' };
        const token = SmsSecurityService.createSessionToken(user);
        return {
            ok: true,
            status: 200,
            json: async () => ({ success: true, token, user })
        };
    }

    if (parsedUrl.pathname.includes('/api/auth/verify-session')) {
        const auth = options.headers && options.headers.Authorization;
        const token = auth ? auth.replace('Bearer ', '').trim() : '';
        const user = SmsSecurityService.verifySessionToken(token);
        if (!user) {
            return {
                ok: false,
                status: 401,
                json: async () => ({ success: false, valid: false })
            };
        }
        return {
            ok: true,
            status: 200,
            json: async () => ({ success: true, valid: true, user })
        };
    }

    return {
        ok: true,
        status: 200,
        json: async () => null
    };
};

// Test Suite Harness
const suite = {
    tests: [],
    add(name, fn) {
        this.tests.push({ name, fn });
    },
    async run() {
        console.log("\x1b[35m=== RUNNING MODULAR ARCHITECTURE TEST SUITE ===\x1b[0m\n");
        let passed = 0;
        let failed = 0;

        for (const test of this.tests) {
            try {
                await test.fn();
                console.log(`\x1b[32m✔ PASS:\x1b[0m ${test.name}`);
                passed++;
            } catch (e) {
                console.error(`\x1b[31m✘ FAIL:\x1b[0m ${test.name}`);
                console.error(e);
                failed++;
            }
        }

        console.log(`\n\x1b[35m=== SUMMARY: Passed ${passed}/${passed + failed} Tests ===\x1b[0m`);
        if (failed > 0) {
            process.exit(1);
        }
    }
};

// ==========================================
// 1. APIService Unit Tests
// ==========================================
suite.add("APIService: get() successfully retrieves data", async () => {
    const res = await APIService.get("school/admin/9809248510");
    if (!res || res.role !== 'admin') {
        throw new Error(`Expected admin, got ${JSON.stringify(res)}`);
    }
});

suite.add("APIService: post() correctly stores data", async () => {
    await APIService.post("school/config/test_key", { test: 123 });
    const res = await APIService.get("school/config/test_key");
    if (!res || res.test !== 123) {
        throw new Error(`Expected test 123, got ${JSON.stringify(res)}`);
    }
});

suite.add("APIService: patch() modifies existing properties", async () => {
    await APIService.patch("school/config/test_key", { updated: true });
    const res = await APIService.get("school/config/test_key");
    if (!res || res.test !== 123 || res.updated !== true) {
        throw new Error(`Expected patch merge, got ${JSON.stringify(res)}`);
    }
});

suite.add("APIService: delete() removes entry", async () => {
    await APIService.delete("school/config/test_key");
    const res = await APIService.get("school/config/test_key");
    if (res !== null) {
        throw new Error(`Expected deleted entry to be null, got ${JSON.stringify(res)}`);
    }
});

suite.add("APIService: upload() handles file upload and progress event", async () => {
    let progressFired = false;
    const url = await APIService.upload("uploads", "fake-file-data", (loaded, total) => {
        if (loaded > 0 && total > 0) progressFired = true;
    });
    if (url !== '/uploads/mock-test.jpg') {
        throw new Error(`Expected /uploads/mock-test.jpg, got ${url}`);
    }
    if (!progressFired) {
        throw new Error("Upload progress callback was not invoked");
    }
});

suite.add("APIService: showNetworkWarning() creates DOM toast element", async () => {
    APIService.showNetworkWarning("Test warning message");
    const toast = global.document.getElementById('network-warning-toast');
    if (!toast || !toast.innerHTML.includes("Test warning message")) {
        throw new Error("Network warning toast element was not rendered into document");
    }
});

suite.add("APIService: handles offline gracefully with error", async () => {
    global.navigator.onLine = false;
    try {
        await APIService.get("school/admin/9809248510");
        throw new Error("Expected request to throw when offline");
    } catch (e) {
        if (!e.message.includes("offline")) {
            throw new Error(`Unexpected error message: ${e.message}`);
        }
    } finally {
        global.navigator.onLine = true;
    }
});

// ==========================================
// 2. AuthService Unit Tests
// ==========================================
suite.add("AuthService: getRoles() returns valid constants", async () => {
    const roles = AuthService.getRoles();
    if (roles.PARENT !== 'parent' || roles.TEACHER !== 'teacher' || roles.ADMIN !== 'admin') {
        throw new Error(`Roles structure mismatch: ${JSON.stringify(roles)}`);
    }
});

suite.add("AuthService: session storage getter and setter work accurately", async () => {
    const testUser = { role: 'teacher', id: 'T-99', name: 'Teacher 99' };
    AuthService.setCurrentUser(testUser);
    const retrieved = AuthService.getCurrentUser();
    if (!retrieved || retrieved.id !== 'T-99') {
        throw new Error("AuthService setCurrentUser/getCurrentUser failed");
    }
});

suite.add("AuthService: logout() clears session and redirects", async () => {
    AuthService.logout();
    if (AuthService.getCurrentUser() !== null) {
        throw new Error("User was not cleared on logout");
    }
    if (global.window.location.href !== 'index.html') {
        throw new Error("Logout did not redirect to index.html");
    }
});

suite.add("AuthService: checkAuth() enforces allowed roles", async () => {
    // 1. Not logged in
    AuthService.setCurrentUser(null);
    const allowed = AuthService.checkAuth(['admin']);
    if (allowed !== false || global.window.location.href !== 'index.html') {
        throw new Error("Unauthorized access check failed to reject unauthenticated session");
    }

    // 2. Logged in with right role
    AuthService.setCurrentUser({ role: 'admin' });
    const adminAllowed = AuthService.checkAuth(['admin']);
    if (adminAllowed !== true) {
        throw new Error("checkAuth failed to accept matching role");
    }

    // 3. Logged in with mismatched role redirects to own role dashboard
    AuthService.setCurrentUser({ role: 'teacher' });
    const teacherBlockedFromAdmin = AuthService.checkAuth(['admin']);
    if (teacherBlockedFromAdmin !== false || global.window.location.href !== 'teacher.html') {
        throw new Error("checkAuth failed to redirect mismatched role to teacher.html");
    }
});

suite.add("AuthService: redirectUserToRoleDashboard() navigates to respective portals", async () => {
    AuthService.redirectUserToRoleDashboard('parent');
    if (global.window.location.href !== 'parent.html') throw new Error("Failed parent redirect");

    AuthService.redirectUserToRoleDashboard('teacher');
    if (global.window.location.href !== 'teacher.html') throw new Error("Failed teacher redirect");

    AuthService.redirectUserToRoleDashboard('admin');
    if (global.window.location.href !== 'admin.html') throw new Error("Failed admin redirect");
});

suite.add("AuthService: verifyPhoneRegistered() returns proper status for all roles", async () => {
    const admin = await AuthService.verifyPhoneRegistered("9809248510");
    if (!admin.isRegistered || admin.role !== 'admin') throw new Error("Admin verify mismatch");

    const parent = await AuthService.verifyPhoneRegistered("9800000001");
    if (!parent.isRegistered || parent.role !== 'parent') throw new Error("Parent verify mismatch");

    const teacher = await AuthService.verifyPhoneRegistered("9800000002");
    if (!teacher.isRegistered || teacher.role !== 'teacher') throw new Error("Teacher verify mismatch");

    const unknown = await AuthService.verifyPhoneRegistered("9999999999");
    if (unknown.isRegistered !== false) throw new Error("Unregistered phone returned true");
});

suite.add("AuthService: executeLogin() validates PIN code and builds session", async () => {
    // Invalid PIN
    try {
        await AuthService.executeLogin("9809248510", "1234");
        throw new Error("Should reject incorrect PIN");
    } catch (e) {
        if (!e.message.includes("Invalid verification code")) throw e;
    }

    // Valid Admin Login
    const adminSession = await AuthService.executeLogin("9809248510", "0000");
    if (!adminSession || adminSession.role !== 'admin') throw new Error("Failed admin login");

    // Valid Teacher Login
    const teacherSession = await AuthService.executeLogin("9800000002", "0000");
    if (!teacherSession || teacherSession.role !== 'teacher' || teacherSession.classTeacherOf !== '3') {
        throw new Error(`Teacher session validation failed: ${JSON.stringify(teacherSession)}`);
    }

    // Valid Parent Login
    const parentSession = await AuthService.executeLogin("9800000001", "0000");
    if (!parentSession || parentSession.role !== 'parent' || parentSession.studentId !== 'US-2026-1234') {
        throw new Error(`Parent session validation failed: ${JSON.stringify(parentSession)}`);
    }
});

// ==========================================
// 3. DatabaseService Unit Tests
// ==========================================

// Students
suite.add("DatabaseService: Student operations (get, save, update, remove)", async () => {
    // getStudents
    const students = await DatabaseService.getStudents();
    if (!Array.isArray(students) || students.length === 0) throw new Error("getStudents failed");

    // saveStudent
    await DatabaseService.saveStudent("US-TEST-01", { name: "Test Pupil", class: "2" });
    const student = await DatabaseService.getStudent("US-TEST-01");
    if (!student || student.name !== 'Test Pupil') throw new Error("saveStudent failed");

    // updateStudent
    await DatabaseService.updateStudent("US-TEST-01", { class: "3" });
    const updated = await DatabaseService.getStudent("US-TEST-01");
    if (updated.class !== "3") throw new Error("updateStudent failed");

    // removeStudent
    await DatabaseService.removeStudent("US-TEST-01");
    const removed = await DatabaseService.getStudent("US-TEST-01");
    if (removed !== null) throw new Error("removeStudent failed");
});

// Teachers
suite.add("DatabaseService: Teacher operations (get, save, update, remove)", async () => {
    // getTeachers
    const teachers = await DatabaseService.getTeachers();
    if (!Array.isArray(teachers) || teachers.length === 0) throw new Error("getTeachers failed");

    // saveTeacher
    await DatabaseService.saveTeacher("UT-TEST-01", { name: "Test Teacher", classTeacherOf: "1" });
    const teacher = await DatabaseService.getTeacher("UT-TEST-01");
    if (!teacher || teacher.name !== 'Test Teacher') throw new Error("saveTeacher failed");

    // updateTeacher
    await DatabaseService.updateTeacher("UT-TEST-01", { classTeacherOf: "2" });
    const updated = await DatabaseService.getTeacher("UT-TEST-01");
    if (updated.classTeacherOf !== "2") throw new Error("updateTeacher failed");

    // removeTeacher
    await DatabaseService.removeTeacher("UT-TEST-01");
    const removed = await DatabaseService.getTeacher("UT-TEST-01");
    if (removed !== null) throw new Error("removeTeacher failed");
});

// Login mappings
suite.add("DatabaseService: Login mapping operations", async () => {
    await DatabaseService.saveLoginMapping("9899999999", { role: "parent", studentId: "US-999" });
    const map = await APIService.get("school/login_mappings/9899999999");
    if (!map || map.studentId !== "US-999") throw new Error("saveLoginMapping failed");

    await DatabaseService.removeLoginMapping("9899999999");
    const removed = await APIService.get("school/login_mappings/9899999999");
    if (removed !== null) throw new Error("removeLoginMapping failed");
});

// Archive and History
suite.add("DatabaseService: Archive and Status History", async () => {
    await DatabaseService.archiveStudent("US-ARCHIVE-01", { name: "Graduated Student" });
    const archived = await APIService.get("school/archives/students/US-ARCHIVE-01");
    if (!archived || archived.name !== "Graduated Student") throw new Error("archiveStudent failed");

    await DatabaseService.logStudentStatusHistory({ studentId: "US-ARCHIVE-01", status: "graduated" });
    const history = await APIService.get("school/student_status_history");
    if (!history || Object.keys(history).length === 0) throw new Error("logStudentStatusHistory failed");
});

// Exam Windows
suite.add("DatabaseService: Exam Window operations", async () => {
    const list = await DatabaseService.getExamWindows();
    if (!Array.isArray(list) || list.length === 0) throw new Error("getExamWindows failed");

    await DatabaseService.saveExamWindow("EX-TEST", { name: "Unit Test Exam", status: "draft" });
    await DatabaseService.updateExamStatus("EX-TEST", "published");
    const exam = await APIService.get("school/exam_windows/EX-TEST");
    if (!exam || exam.status !== 'published') throw new Error("updateExamStatus failed");

    await DatabaseService.removeExamWindow("EX-TEST");
    const deleted = await APIService.get("school/exam_windows/EX-TEST");
    if (deleted !== null) throw new Error("removeExamWindow failed");
});

// Results and Marks
suite.add("DatabaseService: Results and Marks operations", async () => {
    const draft = await DatabaseService.getDraftResults();
    if (typeof draft !== 'object') throw new Error("getDraftResults failed");

    const studentResults = await DatabaseService.getStudentResults("US-2026-1234", "First Terminal");
    if (!studentResults || studentResults.Math !== 95) throw new Error("getStudentResults failed");

    await DatabaseService.saveDraftMark("US-2026-1234", "EX-01", "English", { score: 88 });
    const draftMark = await APIService.get("school/draft_results/US-2026-1234/EX-01/English");
    if (!draftMark || draftMark.score !== 88) throw new Error("saveDraftMark failed");

    await DatabaseService.savePublishedMark("US-2026-1234", "EX-01", "English", { score: 88 });
    const pubMark = await APIService.get("school/results/US-2026-1234/EX-01/English");
    if (!pubMark || pubMark.score !== 88) throw new Error("savePublishedMark failed");

    await DatabaseService.batchUpdate({ "school/config/batch_flag": true });
    const batchFlag = await APIService.get("school/config/batch_flag");
    if (!batchFlag) throw new Error("batchUpdate failed");
});

// Attendance, Class Configs, and Period Timings
suite.add("DatabaseService: Attendance, Class Configs, and Period Timings", async () => {
    const att = await DatabaseService.getAttendance("3");
    if (!att || typeof att !== 'object') throw new Error("getAttendance failed");

    const configs = await DatabaseService.getClassConfigs("3");
    if (!configs || !Array.isArray(configs.subjects)) throw new Error("getClassConfigs failed");

    const periods = await DatabaseService.getPeriodTimings();
    if (!Array.isArray(periods) || periods.length === 0) throw new Error("getPeriodTimings failed");

    await DatabaseService.savePeriodTiming("period_2", { name: "Period 2", startTime: "10:50", endTime: "11:35" });
    const p2 = await APIService.get("school/config/period_timings/period_2");
    if (!p2 || p2.name !== "Period 2") throw new Error("savePeriodTiming failed");

    await DatabaseService.removePeriodTiming("period_2");
    const p2Removed = await APIService.get("school/config/period_timings/period_2");
    if (p2Removed !== null) throw new Error("removePeriodTiming failed");
});

// Notices, Tickets, Suggestions, and Class Change Requests
suite.add("DatabaseService: Notices, Tickets, Suggestions, and Requests", async () => {
    // Notices
    const notices = await DatabaseService.getNotices();
    if (!Array.isArray(notices) || notices.length === 0) throw new Error("getNotices failed");
    await DatabaseService.saveNotice({ title: "Holiday Notice", message: "School closed on Friday" });

    // Tickets
    const tickets = await DatabaseService.getTickets();
    if (!Array.isArray(tickets) || tickets.length === 0) throw new Error("getTickets failed");
    await DatabaseService.saveTicket("T-TEST", { subject: "Uniform", status: "open" });
    const ticket = await APIService.get("school/tickets/T-TEST");
    if (!ticket || ticket.status !== 'open') throw new Error("saveTicket failed");

    // Suggestions
    const suggestions = await DatabaseService.getSuggestions();
    if (!Array.isArray(suggestions) || suggestions.length === 0) throw new Error("getSuggestions failed");
    await DatabaseService.saveSuggestion("S-TEST", { text: "Library books", author: "Student" });
    const suggestion = await APIService.get("school/suggestions/S-TEST");
    if (!suggestion || suggestion.author !== "Student") throw new Error("saveSuggestion failed");

    // Class change requests
    const reqs = await DatabaseService.getClassChangeRequests();
    if (!Array.isArray(reqs) || reqs.length === 0) throw new Error("getClassChangeRequests failed");
    await DatabaseService.saveClassChangeRequest("REQ-02", { teacherId: "UT-1", status: "pending" });
    await DatabaseService.updateClassChangeRequestStatus("REQ-02", "approved");
    const req = await APIService.get("school/class_change_requests/REQ-02");
    if (!req || req.status !== "approved") throw new Error("updateClassChangeRequestStatus failed");
});

// ==========================================
// 4. SMS & Security Infrastructure Unit Tests
// ==========================================

suite.add("SmsSecurityService: Cryptographic Stamp generation and anti-tamper signature", async () => {
    const stampData = SmsSecurityService.generateStamp();
    if (!stampData.stamp || typeof stampData.stamp !== 'string') {
        throw new Error("Failed to generate stamp string");
    }
    const parts = stampData.stamp.split('.');
    if (parts.length !== 3) {
        throw new Error(`Stamp format invalid: ${stampData.stamp}`);
    }

    // Wait slightly to pass min age check (150ms)
    await new Promise(r => setTimeout(r, 150));

    // Valid stamp should pass
    const validation = SmsSecurityService.validateStamp(stampData.stamp);
    if (!validation.valid) {
        throw new Error(`Valid stamp rejected: ${validation.error}`);
    }

    // Replay attack: using the exact same stamp second time must fail
    const replay = SmsSecurityService.validateStamp(stampData.stamp);
    if (replay.valid) {
        throw new Error("Replay protection failed: consumed stamp was accepted");
    }

    // Tampered signature must fail
    const forgedStamp = `${parts[0]}.${parts[1]}.badsignature1234567890`;
    const forgedValidation = SmsSecurityService.validateStamp(forgedStamp);
    if (forgedValidation.valid) {
        throw new Error("Security check accepted forged stamp signature");
    }

    // Expired timestamp must fail
    const expiredTime = Date.now() - 400000;
    const expiredStamp = `${expiredTime}.${parts[1]}.${parts[2]}`;
    const expiredValidation = SmsSecurityService.validateStamp(expiredStamp);
    if (expiredValidation.valid) {
        throw new Error("Security check accepted expired stamp");
    }
});

suite.add("SmsSecurityService: Rate limiting and cooldown enforcement", async () => {
    const testPhone = "9809999999";
    const testIp = "192.168.1.100";

    // 1. Initial check is allowed
    const initialCheck = SmsSecurityService.checkRateLimits(testPhone, testIp);
    if (!initialCheck.allowed) {
        throw new Error("First request should be allowed");
    }

    // Record dispatch
    SmsSecurityService.recordOtpDispatch(testPhone, testIp);

    // 2. Immediate second request within 60s cooldown MUST be blocked
    const cooldownCheck = SmsSecurityService.checkRateLimits(testPhone, testIp);
    if (cooldownCheck.allowed) {
        throw new Error("Cooldown check failed: allowed request during active 60s cooldown");
    }
    if (!cooldownCheck.retry_after_seconds || cooldownCheck.retry_after_seconds <= 0) {
        throw new Error("Cooldown did not return remaining retry_after_seconds");
    }
});

suite.add("SmsSecurityService: Phone whitelist check against school database", async () => {
    // Admin check
    const adminReg = SmsSecurityService.isPhoneRegistered(mockDb, "9809248510");
    if (!adminReg.registered || adminReg.role !== 'admin') {
        throw new Error("Admin phone registration check failed");
    }

    // Login mappings check (teacher/parent)
    const parentReg = SmsSecurityService.isPhoneRegistered(mockDb, "9800000001");
    if (!parentReg.registered || parentReg.role !== 'parent') {
        throw new Error("Parent phone registration check failed");
    }

    // Unregistered phone check
    const unreg = SmsSecurityService.isPhoneRegistered(mockDb, "9841112233");
    if (unreg.registered) {
        throw new Error("Unregistered phone was accepted by whitelist");
    }
});

suite.add("SmsSecurityService: Persistent session token creation and verification", async () => {
    const userPayload = {
        id: "ADM-8510",
        phone: "9809248510",
        role: "admin",
        name: "Super Admin"
    };

    const token = SmsSecurityService.createSessionToken(userPayload);
    if (!token || typeof token !== 'string') {
        throw new Error("Failed to create session token");
    }

    // Verify valid token
    const decoded = SmsSecurityService.verifySessionToken(token);
    if (!decoded || decoded.id !== "ADM-8510" || decoded.role !== "admin") {
        throw new Error("Decoded session token did not match original payload");
    }

    // Tampered token must fail
    const tampered = token.slice(0, -4) + "abcd";
    const tamperedDecoded = SmsSecurityService.verifySessionToken(tampered);
    if (tamperedDecoded !== null) {
        throw new Error("Tampered session token signature was accepted");
    }
});

suite.add("AuthService: OTP and Persistent Session integration", async () => {
    // 1. Fetch stamp
    const stamp = await AuthService.fetchStamp();
    if (!stamp || typeof stamp !== 'string') throw new Error("fetchStamp failed");

    // 2. Send OTP
    const sendRes = await AuthService.sendOtp("9809248510");
    if (!sendRes.success || sendRes.cooldown_seconds !== 60) {
        throw new Error("AuthService.sendOtp failed");
    }

    // 3. Verify OTP and store persistent session
    const verifyRes = await AuthService.verifyOtp("9809248510", "245510");
    if (!verifyRes.success || !verifyRes.token) {
        throw new Error("AuthService.verifyOtp failed");
    }

    // Check localStorage persistence
    const savedToken = AuthService.getAuthToken();
    if (!savedToken || savedToken !== verifyRes.token) {
        throw new Error("Auth token was not stored in persistent storage");
    }

        // 4. Validate session without re-authentication
    const isValidSession = await AuthService.validateSession();
    if (!isValidSession) {
        throw new Error("Persistent session validation failed (user prompted to re-authenticate)");
    }
});

// ==========================================
// 6. ValidationService Unit Tests
// ==========================================
suite.add("ValidationService: Phone normalization and test bypass detection", async () => {
    // Normal 10-digit number
    if (ValidationService.cleanDigits("+977 980-924-8510") !== "9779809248510") {
        throw new Error("cleanDigits did not extract numbers properly");
    }

    if (ValidationService.normalizePhone("+977 980-924-8510") !== "9809248510") {
        throw new Error("normalizePhone did not strip +977 prefix");
    }

    // Zero-cost test bypass number
    if (!ValidationService.isTestMode("0009809248510")) {
        throw new Error("isTestMode failed to detect 000 prefix");
    }

    if (ValidationService.normalizePhone("0009809248510") !== "9809248510") {
        throw new Error("normalizePhone failed to extract underlying phone from test mode input");
    }

    // National 10-digit validator
    if (!ValidationService.isValidPhone("9809248510")) {
        throw new Error("isValidPhone rejected valid 10-digit number");
    }
    if (ValidationService.isValidPhone("980924851") || ValidationService.isValidPhone("abcdefghij")) {
        throw new Error("isValidPhone accepted invalid length or characters");
    }

    // Test bypass OTP verification
    if (!ValidationService.isTestOtpCode("000000") || !ValidationService.isTestOtpCode("0000")) {
        throw new Error("isTestOtpCode failed to recognize 000000 / 0000");
    }
    if (ValidationService.isTestOtpCode("123456")) {
        throw new Error("isTestOtpCode falsely flagged live code 123456 as test code");
    }

    // Server-side validator sync check
    if (ServerValidation.normalizePhone("0009809248510") !== "9809248510") {
        throw new Error("ServerValidation did not match client-side normalizer output");
    }
});

// ==========================================
// 7. DbStorageService Unit Tests
// ==========================================
suite.add("DbStorageService: Deep path get, set, patch, and delete operations", async () => {
    // Instantiate test database in memory / isolated temp path
    const testDbPath = `/tmp/test-school-db-${Date.now()}.json`;
    const storage = new DbStorageService(testDbPath);

    // Initial state
    if (!storage.getRawData() || !storage.getRawData().school) {
        throw new Error("Initial DB state missing school root object");
    }

    // Deep nested set
    storage.set("school/config/branding/primaryColor", "#1d4ed8");
    const retrievedColor = storage.get("school/config/branding/primaryColor");
    if (retrievedColor !== "#1d4ed8") {
        throw new Error(`Expected #1d4ed8, got ${retrievedColor}`);
    }

    // Deep patch with nested keys
    storage.patch("school/config/branding", {
        logoUrl: "/logo.png",
        "theme/font": "Inter"
    });
    if (storage.get("school/config/branding/logoUrl") !== "/logo.png") {
        throw new Error("Patch failed to set shallow property");
    }
    if (storage.get("school/config/branding/theme/font") !== "Inter") {
        throw new Error("Patch failed to set nested property with slash syntax");
    }

    // Non-existent path returns null
    if (storage.get("school/non_existent_key") !== null) {
        throw new Error("Querying non-existent key did not return null");
    }

    // Delete path
    storage.delete("school/config/branding/theme");
    if (storage.get("school/config/branding/theme") !== null) {
        throw new Error("Deleted path was still accessible");
    }
});

// ==========================================
// 8. Google Play Store Compliance & Upload MIME Safety
// ==========================================
suite.add("UploadController: Play Store Compliance & Dangerous Executable Rejection", async () => {
    // Safe media types must be accepted
    if (!ALLOWED_MIME_TYPES.has("image/jpeg") || !ALLOWED_MIME_TYPES.has("image/png") || !ALLOWED_MIME_TYPES.has("application/pdf")) {
        throw new Error("Standard document and image MIME types missing from whitelist");
    }

    // Dangerous executable binaries must be rejected (Google Play Device Abuse Policy)
    const dangerousTypes = [
        "application/vnd.android.package-archive", // APK files
        "application/x-msdownload",              // EXE / DLL
        "application/x-sh",                      // Shell scripts
        "text/javascript",                       // Untrusted JS uploads
        "application/octet-stream"               // Raw generic binaries
    ];

    for (const danger of dangerousTypes) {
        if (ALLOWED_MIME_TYPES.has(danger)) {
            throw new Error(`Dangerous executable MIME type ${danger} was permitted by upload policy!`);
        }
    }
});

// ==========================================
// 9. Zero-Cost Test Bypass End-to-End Integration
// ==========================================
suite.add("Zero-Cost Test Mode: 000 prefix bypass with 000000 OTP", async () => {
    // 1. Acquire cryptographic stamp
    const stampRes = await global.fetch("/api/auth/stamp");
    const stampData = await stampRes.json();

    // 2. Send OTP with 000 prefix on registered number (9809248510 exists in mockDb)
    const sendRes = await global.fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: "0009809248510", stamp: stampData.stamp })
    });
    const sendJson = await sendRes.json();
    if (!sendJson.success || sendJson.cooldown_seconds > 5) {
        throw new Error(`Test mode OTP send failed: ${JSON.stringify(sendJson)}`);
    }

    // 3. Verify using test code 000000
    const verifyRes = await global.fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: "9809248510", otp: "000000" })
    });
    const verifyJson = await verifyRes.json();
    if (!verifyJson.success || !verifyJson.token || verifyJson.user.role !== "admin") {
        throw new Error(`Test mode OTP verify failed: ${JSON.stringify(verifyJson)}`);
    }

    // 4. Verify that session token resolves properly
    const sessionRes = await global.fetch("/api/auth/verify-session", {
        headers: { Authorization: `Bearer ${verifyJson.token}` }
    });
    const sessionJson = await sessionRes.json();
    if (!sessionJson.success || !sessionJson.valid || sessionJson.user.phone !== "9809248510") {
        throw new Error("Session generated via test bypass could not be verified");
    }
});

// ==========================================
// 10. OfflineStore Unit Tests
// ==========================================
suite.add("OfflineStore: Cache and retrieve offline student and teacher data", async () => {
    const studentData = {
        id: "STU-999",
        name: { first: "Kiran", last: "Gurung" },
        class: "10",
        results: { GPA: "3.90" }
    };

    const saved = OfflineStore.cacheStudentRecord("STU-999", studentData);
    if (!saved) throw new Error("OfflineStore.cacheStudentRecord returned false");

    const record = OfflineStore.getStudentRecord("STU-999");
    if (!record || !record.data || record.data.id !== "STU-999") {
        throw new Error("OfflineStore.getStudentRecord failed to retrieve cached student");
    }
    if (typeof record.cachedAt !== 'number') {
        throw new Error("OfflineStore record missing cachedAt timestamp");
    }
});

// Run test runner
suite.run();
