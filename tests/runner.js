// tests/runner.js - Polyfill-based headless test runner for browser modules
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const fs = require('fs');

import { APIService } from '../modules/api.js';
import { AuthService } from '../modules/auth.js';
import { DatabaseService } from '../modules/db.js';
import { ValidationService } from '../modules/validation.js';
import { OfflineStore } from '../modules/offlineStore.js';
import { SetupModule } from '../modules/setupModule.js';
import { TeacherModule, DEFAULT_AVATAR } from '../modules/teacherModule.js';
import { FacultyAddModule } from '../modules/facultyAddModule.js';
import { StudentAddModule, DEFAULT_STUDENT_AVATAR } from '../modules/studentAddModule.js';
import { StudentViewModule } from '../modules/studentViewModule.js';
import { TeacherViewModule } from '../modules/teacherViewModule.js';
import { StudentEditModule } from '../modules/studentEditModule.js';
import { TeacherEditModule } from '../modules/teacherEditModule.js';
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
        classes: {
            "1": { name: "Class 1", order: 1 },
            "2": { name: "Class 2", order: 2 }
        },
        class_configs: {
            "1": { subjects: { compulsory: { "sub_play": { name: "Play & Activity" }, "sub_fun": { name: "Fun & Games" } } } },
            "2": { subjects: { compulsory: { "sub_math": { name: "Math" }, "sub_sci": { name: "Science" } } } },
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
        const rawPhone = String(body.phone || '').trim();
        const isTestMode = rawPhone.startsWith('..');
        const phone = isTestMode ? rawPhone.slice(2).replace(/\D/g, '') : rawPhone.replace(/\D/g, '');

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
        const rawPhone = String(body.phone || '').trim();
        const isTestMode = rawPhone.startsWith('..');
        const phone = isTestMode ? rawPhone.slice(2).replace(/\D/g, '') : rawPhone.replace(/\D/g, '');
        const cleanOtp = String(body.otp || '').trim();
        const isTestOtp = isTestMode && /^0{4,6}$/.test(cleanOtp);

        if (!isTestOtp && cleanOtp !== '245510' && cleanOtp !== '123456') {
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
    add(name, fn, group = 'general') {
        this.tests.push({ name, fn, group: group.toLowerCase() });
    },
    async run() {
        const args = process.argv.slice(2);
        let targetGroup = null;
        let filterPattern = null;
        let listOnly = false;

        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            if (arg === '--server-data' || arg === '--live-data') {
                try {
                    const serverDb = JSON.parse(fs.readFileSync('db.json', 'utf8'));
                    if (serverDb && serverDb.school) {
                        mockDb.school = { ...mockDb.school, ...serverDb.school };
                        console.log("[36m[Info] Injected live server dataset into isolated test memory.[0m");
                    }
                } catch (e) {
                    console.warn("Could not load db.json for server-data flag:", e.message);
                }
            } else if (arg.startsWith('--group=')) targetGroup = arg.split('=')[1].toLowerCase();
            else if (arg.startsWith('-g=')) targetGroup = arg.split('=')[1].toLowerCase();
            else if (arg === '-g' || arg === '--group') {
                targetGroup = args[i + 1] ? args[i + 1].toLowerCase() : null;
            } else if (arg.startsWith('--filter=')) filterPattern = arg.split('=')[1].toLowerCase();
            else if (arg === '-f' || arg === '--filter') {
                filterPattern = args[i + 1] ? args[i + 1].toLowerCase() : null;
            } else if (arg === '--list' || arg === '-l') listOnly = true;
        }

        if (listOnly) {
            console.log("\x1b[35m=== AVAILABLE TEST MODULE GROUPS ===\x1b[0m\n");
            const groupCounts = {};
            for (const t of this.tests) {
                groupCounts[t.group] = (groupCounts[t.group] || 0) + 1;
            }
            for (const [grp, count] of Object.entries(groupCounts)) {
                console.log(`  \x1b[36m• ${grp.padEnd(16)}\x1b[0m (${count} tests)`);
            }
            console.log(`\nTotal registered: ${this.tests.length} tests.\nRun with: node tests/runner.js --group=<group_name>`);
            return;
        }

        let runList = this.tests;
        if (targetGroup) {
            runList = runList.filter(t => t.group === targetGroup);
            console.log(`\x1b[35m=== RUNNING TEST GROUP: [${targetGroup.toUpperCase()}] (${runList.length} Tests) ===\x1b[0m\n`);
        } else if (filterPattern) {
            runList = runList.filter(t => t.name.toLowerCase().includes(filterPattern));
            console.log(`\x1b[35m=== RUNNING FILTERED TESTS: "${filterPattern}" (${runList.length} Tests) ===\x1b[0m\n`);
        } else {
            console.log(`\x1b[35m=== RUNNING COMPLETE TEST SUITE (${runList.length} Tests) ===\x1b[0m\n`);
        }

        if (runList.length === 0) {
            console.warn(`\x1b[33mWarning: No tests found matching criteria (group="${targetGroup || '*'}", filter="${filterPattern || '*'}")\x1b[0m`);
            return;
        }

        let passed = 0;
        let failed = 0;

        for (const test of runList) {
            try {
                await test.fn();
                console.log(`\x1b[32m✔ PASS:\x1b[0m [${test.group}] ${test.name}`);
                passed++;
            } catch (e) {
                console.error(`\x1b[31m✘ FAIL:\x1b[0m [${test.group}] ${test.name}`);
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

    // Modular Class & Subject Setup Verification
    await DatabaseService.saveClass("class_8", { name: "Class 8", order: 8 });
    const classList = await DatabaseService.getClasses();
    if (!classList.find(c => c.id === "class_8")) throw new Error("saveClass or getClasses failed");

    await DatabaseService.saveClassSubject("class_8", "sub_sci", { name: "Science", publisher: "Vedanta" });
    const class8Cfg = await DatabaseService.getClassConfigs("class_8");
    if (!class8Cfg.subjects || !class8Cfg.subjects.compulsory || !class8Cfg.subjects.compulsory.sub_sci) {
        throw new Error("saveClassSubject failed");
    }

    await DatabaseService.removeClassSubject("class_8", "sub_sci");
    const class8AfterSubDel = await DatabaseService.getClassConfigs("class_8");
    if (class8AfterSubDel.subjects && class8AfterSubDel.subjects.compulsory && class8AfterSubDel.subjects.compulsory.sub_sci) {
        throw new Error("removeClassSubject failed");
    }

    await DatabaseService.removeClass("class_8");
    const classListAfterDel = await DatabaseService.getClasses();
    if (classListAfterDel.find(c => c.id === "class_8")) throw new Error("removeClass failed");
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

    // Developer test bypass prefix ('..')
    if (!ValidationService.isTestMode("..9809248510")) {
        throw new Error("isTestMode failed to detect .. prefix");
    }
    if (ValidationService.isTestMode("9809248510") || ValidationService.isTestMode(".#9809248510") || ValidationService.isTestMode("0009809248510")) {
        throw new Error("isTestMode falsely flagged regular or legacy prefix as active test mode");
    }

    if (ValidationService.normalizePhone("..9809248510") !== "9809248510") {
        throw new Error("normalizePhone failed to extract underlying phone from test mode input");
    }

    // National 10-digit validator
    if (!ValidationService.isValidPhone("9809248510")) {
        throw new Error("isValidPhone rejected valid 10-digit number");
    }
    if (ValidationService.isValidPhone("980924851") || ValidationService.isValidPhone("abcdefghij")) {
        throw new Error("isValidPhone accepted invalid length or characters");
    }

    // Test bypass OTP verification (accepts 4, 5, or 6 zeros)
    if (!ValidationService.isTestOtpCode("000000") || !ValidationService.isTestOtpCode("00000") || !ValidationService.isTestOtpCode("0000")) {
        throw new Error("isTestOtpCode failed to recognize 4, 5, or 6 zeros");
    }
    if (ValidationService.isTestOtpCode("123456") || ValidationService.isTestOtpCode("000")) {
        throw new Error("isTestOtpCode accepted invalid or live codes");
    }

    // Server-side validator sync check
    if (ServerValidation.normalizePhone("..9809248510") !== "9809248510") {
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
suite.add("Zero-Cost Test Mode: '..' prefix bypass with 4, 5, or 6 zero OTP", async () => {
    // 1. Acquire cryptographic stamp
    const stampRes = await global.fetch("/api/auth/stamp");
    const stampData = await stampRes.json();

    // 2. Reject 000000 on standard consumer numbers (prevents unauthorized access)
    const unauthorizedRes = await global.fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: "9809248510", otp: "000000" })
    });
    if (unauthorizedRes.ok) {
        throw new Error("Test OTP 000000 was dangerously accepted on a standard consumer phone number!");
    }

    // 3. Send OTP with '..' developer prefix on registered number
    const sendRes = await global.fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: "..9809248510", stamp: stampData.stamp })
    });
    const sendJson = await sendRes.json();
    if (!sendJson.success || sendJson.cooldown_seconds > 5) {
        throw new Error(`Test mode OTP send failed: ${JSON.stringify(sendJson)}`);
    }

    // 4. Verify using test prefix and 4 zeros (0000)
    const verify4Res = await global.fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: "..9809248510", otp: "0000" })
    });
    const verify4Json = await verify4Res.json();
    if (!verify4Json.success || !verify4Json.token || verify4Json.user.role !== "admin") {
        throw new Error(`Test mode OTP verify with 0000 failed: ${JSON.stringify(verify4Json)}`);
    }

    // 5. Verify using test prefix and 5 zeros (00000)
    const verify5Res = await global.fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: "..9809248510", otp: "00000" })
    });
    const verify5Json = await verify5Res.json();
    if (!verify5Json.success || !verify5Json.token) {
        throw new Error(`Test mode OTP verify with 00000 failed: ${JSON.stringify(verify5Json)}`);
    }

    // 6. Verify using test prefix and 6 zeros (000000)
    const verify6Res = await global.fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: "..9809248510", otp: "000000" })
    });
    const verify6Json = await verify6Res.json();
    if (!verify6Json.success || !verify6Json.token) {
        throw new Error(`Test mode OTP verify with 000000 failed: ${JSON.stringify(verify6Json)}`);
    }

    // 7. Verify that session token resolves properly
    const sessionRes = await global.fetch("/api/auth/verify-session", {
        headers: { Authorization: `Bearer ${verify6Json.token}` }
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

// ==========================================
// 11. Security & Platform Authentication Tests
// ==========================================
suite.add("Security: Platform-aware token generation and differentiation (Web vs App)", async () => {
    const user = { phone: "9809248510", role: "admin", id: "ADM-8510", name: "Super Admin" };

    const webToken = SmsSecurityService.createSessionToken(user, "web");
    const appToken = SmsSecurityService.createSessionToken(user, "android_app");

    if (!webToken || !appToken) throw new Error("Failed to generate platform session tokens");
    if (webToken === appToken) throw new Error("Platform tokens should be cryptographically distinct across platforms");

    const verifiedWeb = SmsSecurityService.verifySessionToken(webToken);
    const verifiedApp = SmsSecurityService.verifySessionToken(appToken);

    if (!verifiedWeb || verifiedWeb.platform !== "web") {
        throw new Error("Web token failed platform verification");
    }
    if (!verifiedApp || verifiedApp.platform !== "android_app") {
        throw new Error("App token failed platform verification");
    }
});

suite.add("NotificationController: Modular notification and notice synchronization", async () => {
    const { createNotificationRouter } = require('../controllers/notificationController.js');
    if (typeof createNotificationRouter !== 'function') {
        throw new Error("createNotificationRouter is not exported properly");
    }
});

// ==========================================
// ==========================================
// 12. Modular School Setup Module Tests
// ==========================================
suite.add("SetupModule: Class creation, subject addition, and order sorting", () => {
    const setup = new SetupModule();

    // 1. Initial State
    if (setup.classes.length !== 8) throw new Error("Default classes should be 1 through 8");

    // 2. Add Class with custom order (Pre-primary order 0, Class 9 order 9)
    const nursery = setup.addClass("Nursery", 0);
    const class9 = setup.addClass("Class 9", 9);
    if (!nursery || !class9) throw new Error("addClass failed");

    // Verify ordering
    if (setup.classes[0].id !== "nursery" || setup.classes[0].order !== 0) {
        throw new Error("Order sorting failed: Nursery should be at index 0");
    }
    const lastClass = setup.classes[setup.classes.length - 1];
    if (lastClass.id !== "class_9" || lastClass.order !== 9) {
        throw new Error("Order sorting failed: Class 9 should be at the end");
    }

    // 3. Add Compulsory Subject with Publisher
    const sub = setup.addSubject("class_9", "Computer Science", "KEC Publications");
    if (!sub || sub.name !== "Computer Science" || sub.publisher !== "KEC Publications") {
        throw new Error("addSubject failed");
    }

    const classSubjects = setup.getSubjectsForClass("class_9");
    if (classSubjects.length !== 1 || classSubjects[0].name !== "Computer Science") {
        throw new Error("getSubjectsForClass failed");
    }
}, 'setup');

suite.add("SetupModule: Edge case validation and duplicate prevention", () => {
    const setup = new SetupModule();

    // 1. Rejects empty class names
    if (setup.addClass("") !== null) throw new Error("Should reject empty class name");
    if (setup.addClass("   ") !== null) throw new Error("Should reject whitespace class name");

    // 2. Rejects duplicate class
    const added1 = setup.addClass("Class 11");
    if (!added1) throw new Error("Should allow new class");
    const added2 = setup.addClass("Class 11");
    if (added2 !== null) throw new Error("Should reject duplicate class");

    // 3. Rejects duplicate subject in same class
    const sub1 = setup.addSubject("class_11", "English", "Oxford");
    if (!sub1) throw new Error("Should allow first subject");
    const sub2 = setup.addSubject("class_11", "English", "Cambridge");
    if (sub2 !== null) throw new Error("Should reject duplicate subject name in same class");

    // 4. Trims whitespace properly
    const sub3 = setup.addSubject("class_11", "  Mathematics  ", "  Janak Education  ");
    if (!sub3 || sub3.name !== "Mathematics" || sub3.publisher !== "Janak Education") {
        throw new Error("Whitespace trimming failed");
    }
}, 'setup');

suite.add("SetupModule: Storage persistence and local serialization", async () => {
    const setup = new SetupModule();
    const addedClass = setup.addClass("Pre-School", 0);
    setup.addSubject(addedClass.id, "Rhymes & Drawing", "Childcraft Books");

    const saveResult = await setup.saveToDatabase();
    if (!saveResult || !saveResult.success) throw new Error("saveToDatabase failed");

    // Create fresh instance and load
    const freshSetup = new SetupModule();
    await freshSetup.loadFromDatabase();

    const loadedPreSchool = freshSetup.classes.find(c => c.id === addedClass.id);
    if (!loadedPreSchool) throw new Error("Failed to load saved class from local persistence");
    const preSchoolSubs = freshSetup.getSubjectsForClass(addedClass.id);
    if (preSchoolSubs.length !== 1 || preSchoolSubs[0].name !== "Rhymes & Drawing") {
        throw new Error("Failed to load saved subjects from local persistence");
    }
}, 'setup');

suite.add("SetupModule: Database POST operations and schema verification", async () => {
    const setup = new SetupModule();
    const lkg = setup.addClass("LKG", 0);
    if (!lkg) throw new Error("Failed to create LKG");
    setup.addSubject(lkg.id, "English Phonics", "Cambridge University Press");
    setup.addSubject(lkg.id, "Nepali Varnamala", "Janak Sikshya");

    await setup.saveToDatabase();

    // Verify stored classes in mockDb
    const storedClasses = getDbValue('school/classes');
    if (!storedClasses || !storedClasses[lkg.id]) {
        throw new Error("Class was not posted to school/classes in database");
    }

    // Verify stored compulsory subjects in mockDb
    const storedSubjectPhonics = getDbValue(`school/class_configs/${lkg.id}/subjects/compulsory/sub_english_phonics`);
    if (!storedSubjectPhonics || storedSubjectPhonics.name !== "English Phonics") {
        throw new Error("Compulsory subject was not posted to school/class_configs in database");
    }
}, 'setup');

suite.add("SetupModule: Database loading and state reconstruction", async () => {
    // Write test class directly to DB
    setDbValue('school/classes/test_class_ukg', { name: 'UKG Test', order: 0.8 });
    setDbValue('school/class_configs/test_class_ukg/subjects/compulsory/sub_science', {
        name: 'Early Science',
        publisher: 'Pearson'
    });

    const setup = new SetupModule();
    await setup.loadFromDatabase();

    const ukg = setup.classes.find(c => c.id === 'test_class_ukg');
    if (!ukg || ukg.name !== 'UKG Test') {
        throw new Error("loadFromDatabase failed to reconstruct class from DB");
    }

    const ukgSubs = setup.getSubjectsForClass('test_class_ukg');
    if (ukgSubs.length !== 1 || ukgSubs[0].name !== 'Early Science' || ukgSubs[0].publisher !== 'Pearson') {
        throw new Error("loadFromDatabase failed to reconstruct compulsory subjects from DB");
    }
}, 'setup');

suite.add("SetupModule: Cascade class and subject removal", () => {
    const setup = new SetupModule();
    const c = setup.addClass("Temp Class");
    setup.addSubject(c.id, "Temp Subject", "Temp Pub");

    if (setup.getSubjectsForClass(c.id).length !== 1) throw new Error("Failed to setup test subjects");

    const removed = setup.removeClass(c.id);
    if (!removed) throw new Error("removeClass returned false");

    // Class should be gone from classes list
    if (setup.classes.some(cls => cls.id === c.id)) {
        throw new Error("Class still present in classes array after removal");
    }

    // Associated subjects should be cleared out
    if (setup.getSubjectsForClass(c.id).length !== 0) {
        throw new Error("Class subjects not cleared from assignments on class removal");
    }
}, 'setup');


// ==========================================
// 13. Modular Teacher Management Module Tests
// ==========================================
suite.add("TeacherModule: Validation and duplicate mobile rejection", () => {
    const tm = new TeacherModule();

    // 1. Rejects missing first or last name
    const res1 = tm.addTeacher({ firstName: "", lastName: "Sharma", phone: "9801234567" });
    if (res1.success) throw new Error("Should reject missing first name");

    const res2 = tm.addTeacher({ firstName: "Ramesh", lastName: "", phone: "9801234567" });
    if (res2.success) throw new Error("Should reject missing last name");

    // 2. Rejects invalid phone numbers
    const res3 = tm.addTeacher({ firstName: "Ramesh", lastName: "Sharma", phone: "12345" });
    if (res3.success) throw new Error("Should reject short phone number");

    // 3. Accepts valid teacher
    const res4 = tm.addTeacher({
        firstName: "Ramesh",
        lastName: "Sharma",
        phone: "9801234567",
        professionalTitle: "Senior Mathematics Faculty",
        classTeacherOf: "5",
        assignedClasses: ["4", "5", "6"],
        subjects: ["Mathematics"]
    });
    if (!res4.success || !res4.teacher) throw new Error("Failed to add valid teacher: " + (res4.errors || []).join(", "));

    // 4. Rejects duplicate phone number for new teacher
    const res5 = tm.addTeacher({ firstName: "Suresh", lastName: "Adhikari", phone: "9801234567" });
    if (res5.success) throw new Error("Should reject duplicate phone number");

    // 5. Allows update with same phone for the same teacher
    const updateRes = tm.updateTeacher(res4.teacher.id, {
        firstName: "Ramesh",
        lastName: "Sharma",
        phone: "9801234567",
        professionalTitle: "HOD Mathematics"
    });
    if (!updateRes.success) throw new Error("Should allow updating existing teacher with same phone");
}, "teacher");

suite.add("TeacherModule: Workload mapping, class teacher authority, and default avatar", () => {
    const tm = new TeacherModule();
    
    // 1. Hierarchical Workload by Class
    const res = tm.addTeacher({
        firstName: "Anjali",
        lastName: "Thapa",
        phone: "9841223344",
        classTeacherOf: "unassigned",
        workload: {
            "3": ["Mathematics", "Science"],
            "5": ["Mathematics"]
        }
    });

    if (!res.success) throw new Error("Failed to add teacher: " + (res.errors || []).join(", "));
    const t = res.teacher;

    if (!t.id.startsWith("UT-2083-")) throw new Error("Teacher ID format invalid: " + t.id);
    if (t.classTeacherOf !== "unassigned") throw new Error("classTeacherOf should be unassigned");
    if (t.assignedClasses.length !== 2 || !t.assignedClasses.includes("3") || !t.assignedClasses.includes("5")) {
        throw new Error("assignedClasses not derived correctly from workload: " + JSON.stringify(t.assignedClasses));
    }
    if (t.subjects.length !== 2 || !t.subjects.includes("Mathematics") || !t.subjects.includes("Science")) {
        throw new Error("Unique subjects not derived correctly from workload: " + JSON.stringify(t.subjects));
    }
    if (t.photo !== DEFAULT_AVATAR) throw new Error("Should use inline SVG fallback avatar");
    if (t.role !== "teacher") throw new Error("Role should be teacher");
    if (t.statusLabel !== "Active") throw new Error("statusLabel should default to Active");

    // 2. Class Subject Retrieval
    const class3Subjects = tm.getSubjectsForClass("3");
    if (!Array.isArray(class3Subjects) || class3Subjects.length === 0) {
        throw new Error("getSubjectsForClass should return available curriculum subjects");
    }
}, "teacher");

suite.add("TeacherModule: Search and filter functionality", () => {
    const tm = new TeacherModule();
    tm.addTeacher({ firstName: "Bikash", lastName: "Karki", phone: "9811111111", subjects: ["Science", "Health"] });
    tm.addTeacher({ firstName: "Gita", lastName: " श्रेष्ठ", phone: "9822222222", subjects: ["Nepali"] });

    // Filter by name
    const nameMatch = tm.getFilteredTeachers("Bikash");
    if (nameMatch.length !== 1 || nameMatch[0].name.first !== "Bikash") throw new Error("Filter by first name failed");

    // Filter by phone
    const phoneMatch = tm.getFilteredTeachers("9822222222");
    if (phoneMatch.length !== 1 || phoneMatch[0].name.first !== "Gita") throw new Error("Filter by phone failed");

    // Filter by subject
    const subjectMatch = tm.getFilteredTeachers("Science");
    if (subjectMatch.length !== 1 || subjectMatch[0].name.first !== "Bikash") throw new Error("Filter by subject failed");
}, "teacher");

suite.add("TeacherModule: Local persistence and cache serialization", async () => {
    const tm = new TeacherModule();
    const res = tm.addTeacher({
        firstName: "Hari",
        lastName: "Prasad",
        phone: "9855555555",
        professionalTitle: "Science Faculty"
    });
    if (!res.success) throw new Error("Failed to add teacher");

    const saveRes = await tm.saveToDatabase();
    if (!saveRes.success) throw new Error("saveToDatabase failed");

    const fresh = new TeacherModule();
    await fresh.loadFromDatabase();
    const loaded = fresh.getTeacher(res.teacher.id);
    if (!loaded || loaded.name.first !== "Hari") {
        throw new Error("Failed to reconstruct teacher from local cache persistence");
    }
}, "teacher");

suite.add("TeacherModule: Database schema and login_mapping synchronization", async () => {
    const tm = new TeacherModule();
    const res = tm.addTeacher({
        firstName: "Pooja",
        lastName: "Rana",
        phone: "9866666666",
        classTeacherOf: "1"
    });
    if (!res.success) throw new Error("Failed to add teacher");

    await tm.saveToDatabase();

    // Check teacher in mockDb
    const storedTeacher = getDbValue("school/teachers/" + res.teacher.id);
    if (!storedTeacher || storedTeacher.name.first !== "Pooja") {
        throw new Error("Teacher record not saved in school/teachers in database");
    }

    // Check login mapping in mockDb
    const storedMapping = getDbValue("school/login_mappings/9866666666");
    if (!storedMapping || storedMapping.role !== "teacher" || storedMapping.id !== res.teacher.id) {
        throw new Error("Login mapping not saved in school/login_mappings for phone");
    }
}, "teacher");

suite.add("TeacherModule: Faculty removal and deletion", () => {
    const tm = new TeacherModule();
    const res = tm.addTeacher({ firstName: "Temporary", lastName: "Teacher", phone: "9877777777" });
    if (!res.success) throw new Error("Failed to add teacher");

    if (tm.teachers.length !== 1) throw new Error("Teacher count mismatch");
    const removed = tm.removeTeacher(res.teacher.id);
    if (!removed || tm.teachers.length !== 0) throw new Error("removeTeacher failed");
}, "teacher");


// ==========================================
// 14. Modular Faculty Onboarding Module Tests (Single Responsibility)
// ==========================================
suite.add("FacultyAddModule: Zero hardcoding and dynamic DB loading", async () => {
    // 1. Initial State has zero hardcoded classes or subjects
    const fam = new FacultyAddModule();
    if (fam.getClasses().length !== 0) throw new Error("Classes should not be hardcoded in constructor");
    if (fam.getSubjectsForClass("1").length !== 0) throw new Error("Subjects should not be hardcoded in constructor");

    // 2. Dynamic DB Loading
    await fam.loadFromDatabase();
    const loadedClasses = fam.getClasses();
    if (loadedClasses.length === 0) throw new Error("Should load classes dynamically from database");
    
    const class1Subs = fam.getSubjectsForClass("1");
    if (!Array.isArray(class1Subs)) throw new Error("getSubjectsForClass should return array");
}, "faculty-add");

suite.add("FacultyAddModule: Validation rules for onboarding", () => {
    const fam = new FacultyAddModule({
        existingTeachers: [{ phone: "9812345678", id: "UT-EXISTING" }]
    });

    // 1. Rejects missing names
    const res1 = fam.validate({ firstName: "", lastName: "Sharma", phone: "9800000001" });
    if (res1.isValid) throw new Error("Should reject missing first name");

    const res2 = fam.validate({ firstName: "Ramesh", lastName: "", phone: "9800000001" });
    if (res2.isValid) throw new Error("Should reject missing last name");

    // 2. Rejects invalid mobile numbers
    const res3 = fam.validate({ firstName: "Ramesh", lastName: "Sharma", phone: "1234" });
    if (res3.isValid) throw new Error("Should reject short mobile number");

    // 3. Rejects duplicate mobile of existing faculty
    const res4 = fam.validate({ firstName: "Ramesh", lastName: "Sharma", phone: "9812345678" });
    if (res4.isValid) throw new Error("Should reject duplicate mobile number");

    // 4. Accepts valid onboarding data
    const res5 = fam.validate({ firstName: "Ramesh", lastName: "Sharma", phone: "9800000001" });
    if (!res5.isValid) throw new Error("Valid data should pass validation");
}, "faculty-add");

suite.add("FacultyAddModule: Dynamic workload mapping and unassigned class teacher", () => {
    const fam = new FacultyAddModule();
    const validation = fam.validate({
        firstName: "Anjali",
        lastName: "Thapa",
        phone: "9841223344",
        classTeacherOf: "unassigned",
        workload: {
            "1": ["Play & Activity", "Basic Math"],
            "2": ["Math"]
        },
        nationalId: "12-01-78-05432",
        photo: "/uploads/anjali-portrait.jpg",
        verificationDoc: "/uploads/citizenship-doc.pdf"
    });

    if (!validation.isValid) throw new Error("Validation failed: " + validation.errors.join(", "));
    const clean = validation.cleanData;

    if (clean.classTeacherOf !== "unassigned") throw new Error("classTeacherOf should default to unassigned");
    if (clean.assignedClasses.length !== 2 || !clean.assignedClasses.includes("1") || !clean.assignedClasses.includes("2")) {
        throw new Error("assignedClasses not derived correctly from workload: " + JSON.stringify(clean.assignedClasses));
    }
    if (clean.subjects.length !== 3 || !clean.subjects.includes("Play & Activity") || !clean.subjects.includes("Math")) {
        throw new Error("Unique subjects not derived correctly from workload: " + JSON.stringify(clean.subjects));
    }
        if (clean.statusLabel !== "Active") throw new Error("statusLabel should default to Active");
    if (clean.nationalId !== "12-01-78-05432") throw new Error("nationalId not preserved: " + clean.nationalId);
    if (clean.photo !== "/uploads/anjali-portrait.jpg") throw new Error("photo URL not preserved: " + clean.photo);
    if (clean.verificationDoc !== "/uploads/citizenship-doc.pdf") throw new Error("verificationDoc URL not preserved: " + clean.verificationDoc);
    if (clean.verificationStatus !== "verified") throw new Error("verificationStatus should be verified when nationalId present");

    // Test multiple documents support in validation
    const multiDocVal = fam.validate({
        firstName: "Anjali",
        lastName: "Thapa",
        phone: "9841223344",
        documents: [
            { name: "Citizenship Card", type: "National ID / Citizenship", url: "/uploads/cit-front.jpg", size: 45000 },
            { name: "M.Sc Degree", type: "Academic Degree / Transcript", url: "/uploads/degree.pdf", size: 120000 }
        ]
    });
    if (!multiDocVal.isValid) throw new Error("Multiple docs validation failed");
    if (multiDocVal.cleanData.documents.length !== 2) throw new Error("Should parse exactly 2 documents");
    if (multiDocVal.cleanData.documents[0].name !== "Citizenship Card") throw new Error("Document 1 name mismatch");
    if (multiDocVal.cleanData.documents[1].name !== "M.Sc Degree") throw new Error("Document 2 name mismatch");
    if (multiDocVal.cleanData.verificationDoc !== "/uploads/cit-front.jpg") throw new Error("Primary verificationDoc fallback mismatch");
}, "faculty-add");

suite.add("FacultyAddModule: Registration persistence and duplicate mobile rejection", async () => {
    const fam = new FacultyAddModule();
    await fam.loadFromDatabase();

    const regResult = await fam.registerTeacher({
        firstName: "Sita",
        lastName: "Devi",
        phone: "9849998888",
        professionalTitle: "Primary Faculty",
        classTeacherOf: "unassigned",
        nationalId: "10-02-77-99887",
        photo: "/uploads/sita-photo-compressed.jpg",
        documents: [
            { name: "Citizenship Card", type: "National ID / Citizenship", url: "/uploads/sita-id.pdf", size: 54000 },
            { name: "Appointment Letter", type: "Appointment Letter", url: "/uploads/sita-appt.pdf", size: 32000 }
        ],
        workload: {
            "1": ["Play & Activity"]
        }
    });

    if (!regResult.success) throw new Error("registerTeacher failed: " + (regResult.errors || []).join(", "));
    const teacher = regResult.teacher;

    if (!teacher.id.startsWith("UT-2083-")) throw new Error("Teacher ID format invalid: " + teacher.id);
        if (teacher.nationalId !== "10-02-77-99887") throw new Error("teacher.nationalId not saved: " + teacher.nationalId);
    if (teacher.photo !== "/uploads/sita-photo-compressed.jpg") throw new Error("teacher.photo not saved: " + teacher.photo);
    if (teacher.verificationDoc !== "/uploads/sita-id.pdf") throw new Error("teacher.verificationDoc not saved: " + teacher.verificationDoc);
    if (teacher.documents.length !== 2) throw new Error("teacher.documents length should be 2");
    if (teacher.verificationStatus !== "verified") throw new Error("teacher.verificationStatus not set: " + teacher.verificationStatus);

    // Verify stored teacher in mockDb
    const storedTeacher = getDbValue("school/teachers/" + teacher.id);
    if (!storedTeacher || storedTeacher.name.first !== "Sita") {
        throw new Error("Teacher record not saved in school/teachers in database");
    }
    if (storedTeacher.nationalId !== "10-02-77-99887" || storedTeacher.photo !== "/uploads/sita-photo-compressed.jpg") {
        throw new Error("National ID and Photo not saved in database record");
    }
    if (!Array.isArray(storedTeacher.documents) || storedTeacher.documents.length !== 2) {
        throw new Error("Multiple documents not properly persisted in database teacher record");
    }

    // Verify stored login mapping in mockDb
    const storedMapping = getDbValue("school/login_mappings/9849998888");
    if (!storedMapping || storedMapping.role !== "teacher" || storedMapping.id !== teacher.id) {
        throw new Error("Login mapping not saved in school/login_mappings for phone");
    }

        // Subsequent registration with same phone should fail
    const dupResult = await fam.registerTeacher({
        firstName: "Another",
        lastName: "Teacher",
        phone: "9849998888"
    });
    if (dupResult.success) throw new Error("Duplicate registration with same phone should fail");
}, "faculty-add");

// ==========================================
// 15. Modular Student Enrollment Module Tests (Single Responsibility)
// ==========================================
suite.add("StudentAddModule: Zero hardcoding and dynamic DB loading", async () => {
    // 1. Initial State has zero hardcoded classes or subjects
    const sam = new StudentAddModule();
    if (sam.getClasses().length !== 0) throw new Error("Classes should not be hardcoded in constructor");
    if (sam.getSubjectsForClass("1").length !== 0) throw new Error("Subjects should not be hardcoded in constructor");

    // 2. Dynamic DB Loading
    await sam.loadFromDatabase();
    const loadedClasses = sam.getClasses();
    if (loadedClasses.length === 0) throw new Error("Should load classes dynamically from database");

    const class1Subs = sam.getSubjectsForClass("1");
    if (!Array.isArray(class1Subs)) throw new Error("getSubjectsForClass should return an array");

    // 3. Roll number generation
    const roll = sam.getNextRollNumber("1");
    if (typeof roll !== 'string' || roll.length < 2) throw new Error("getNextRollNumber should return padded string: " + roll);
}, "student-add");

suite.add("StudentAddModule: Validation rules for student enrollment", () => {
    const sam = new StudentAddModule({
        classes: [{ id: "1", name: "Class 1" }, { id: "2", name: "Class 2" }]
    });

    // 1. Rejects missing first name
    const res1 = sam.validate({ firstName: "", lastName: "Sharma", class: "1", phone: "9801234567" });
    if (res1.isValid) throw new Error("Should reject missing first name");

    // 2. Rejects missing last name
    const res2 = sam.validate({ firstName: "Aarav", lastName: "", class: "1", phone: "9801234567" });
    if (res2.isValid) throw new Error("Should reject missing last name");

    // 3. Rejects missing class
    const res3 = sam.validate({ firstName: "Aarav", lastName: "Sharma", class: "", phone: "9801234567" });
    if (res3.isValid) throw new Error("Should reject missing class");

    // 4. Rejects unrecognized class
    const res4 = sam.validate({ firstName: "Aarav", lastName: "Sharma", class: "99", phone: "9801234567" });
    if (res4.isValid) throw new Error("Should reject unrecognized class");

    // 5. Rejects invalid parent phone numbers
    const res5 = sam.validate({ firstName: "Aarav", lastName: "Sharma", class: "1", phone: "12345" });
    if (res5.isValid) throw new Error("Should reject invalid parent phone");

    // 6. Accepts valid comma-separated multiple parent phones
    const res6 = sam.validate({
        firstName: "Aarav",
        lastName: "Sharma",
        class: "1",
        phone: "+977-9801234567, 9841987654"
    });
    if (!res6.isValid) throw new Error("Should accept valid comma-separated parent phones: " + res6.errors.join(", "));
    if (res6.cleanData.phones.length !== 2) throw new Error("Should parse exactly 2 valid parent phones");
    if (!res6.cleanData.phones.includes("9801234567") || !res6.cleanData.phones.includes("9841987654")) {
        throw new Error("Phone numbers not properly cleaned and extracted: " + JSON.stringify(res6.cleanData.phones));
    }
}, "student-add");

suite.add("StudentAddModule: Dynamic class subjects, age computation, and address sync", () => {
    const sam = new StudentAddModule({
        classes: [{ id: "1", name: "Class 1" }],
        classSubjects: {
            "1": ["Basic Math", "Nepali", "English"]
        }
    });

    // 1. Age computation from BS date
    const age = StudentAddModule.calculateAgeFromBS("2075-04-12");
    if (age !== "8") throw new Error("Age calculation mismatch: expected 8, got " + age);

    // 2. Dynamic compulsory subjects assignment
    const val = sam.validate({
        firstName: "Kiran",
        lastName: "Oli",
        class: "1",
        phone: "9811223344",
        dob: "2075-04-12",
        currentAddress: { street: "Ward 4", city: "Kathmandu", district: "Kathmandu" }
    });

    if (!val.isValid) throw new Error("Validation failed: " + val.errors.join(", "));
    const clean = val.cleanData;

    if (clean.academic.subjects.length !== 3 || !clean.academic.subjects.includes("Basic Math")) {
        throw new Error("Subjects not dynamically populated from class configs: " + JSON.stringify(clean.academic.subjects));
    }
    if (clean.age !== "8") throw new Error("Age not auto-computed from dob: " + clean.age);

    // 3. Address fallback: permanent address falls back to current address
    if (clean.address.permanent.city !== "Kathmandu") {
        throw new Error("Permanent address did not fall back to current address: " + JSON.stringify(clean.address));
    }
}, "student-add");

suite.add("StudentAddModule: Registration persistence, multiple documents, and multi-parent login mappings", async () => {
    const sam = new StudentAddModule();
    await sam.loadFromDatabase();

    const regResult = await sam.registerStudent({
        firstName: "Pooja",
        lastName: "Karki",
        class: "1",
        phone: "9851122334, 9861122334",
        fatherName: "Bishnu Karki",
        motherName: "Radha Karki",
        dob: "2076-02-15",
        bloodGroup: "O+",
        photo: "/uploads/pooja-photo-compressed.jpg",
        documents: [
            { name: "Birth Certificate", type: "Birth Certificate", url: "/uploads/pooja-birth.jpg", size: 48000 },
            { name: "Grade Nursery Card", type: "Previous Marksheet", url: "/uploads/pooja-marks.pdf", size: 85000 }
        ],
        currentAddress: { street: "Main Road", city: "Damak", district: "Jhapa" }
    });

    if (!regResult.success) throw new Error("registerStudent failed: " + (regResult.errors || []).join(", "));
    const student = regResult.student;

    if (!student.id.startsWith("US-2083-")) throw new Error("Student ID format invalid: " + student.id);
    if (student.photo !== "/uploads/pooja-photo-compressed.jpg") throw new Error("Student photo not preserved");
    if (student.documents.length !== 2) throw new Error("Student documents count should be 2");
    if (student.birthCertificate !== "/uploads/pooja-birth.jpg") throw new Error("birthCertificate backward compatibility not set");

    // 1. Verify student record stored in mockDb
    const storedStudent = getDbValue("school/students/" + student.id);
    if (!storedStudent || storedStudent.name.first !== "Pooja") {
        throw new Error("Student record not saved in school/students in database");
    }
    if (storedStudent.photo !== "/uploads/pooja-photo-compressed.jpg") {
        throw new Error("Student photo not persisted in database");
    }
    if (!Array.isArray(storedStudent.documents) || storedStudent.documents.length !== 2) {
        throw new Error("Multiple documents not properly persisted in database student record");
    }

    // 2. Verify parent login mappings for both phones
    const mapping1 = getDbValue("school/login_mappings/9851122334");
    if (!mapping1 || mapping1.role !== "parent" || mapping1.studentId !== student.id) {
        throw new Error("Login mapping for parent phone 1 not created");
    }
        const mapping2 = getDbValue("school/login_mappings/9861122334");
    if (!mapping2 || mapping2.role !== "parent" || mapping2.studentId !== student.id) {
        throw new Error("Login mapping for parent phone 2 not created");
    }
}, "student-add");

suite.add("StudentAddModule: Default avatar fallback, optional fields, and special phone characters", async () => {
    const sam = new StudentAddModule({
        classes: [{ id: "2", name: "Class 2" }],
        classSubjects: { "2": ["English", "Nepali"] }
    });

    // 1. Phone number with messy spaces, parentheses, dashes
    const res = sam.validate({
        firstName: "Bikash",
        lastName: "Thapa",
        class: "2",
        phone: " (981) 234-5678 , +977 980-111-2222 "
    });
    if (!res.isValid) throw new Error("Should handle formatted phone numbers: " + res.errors.join(", "));
    if (res.cleanData.phones.length !== 2) throw new Error("Should parse both formatted phones");
    if (res.cleanData.phones[0] !== "9812345678" || res.cleanData.phones[1] !== "9801112222") {
        throw new Error("Normalized phones mismatch: " + JSON.stringify(res.cleanData.phones));
    }

    // 2. Default avatar fallback
    if (res.cleanData.photo !== DEFAULT_STUDENT_AVATAR) {
        throw new Error("Should fall back to DEFAULT_STUDENT_AVATAR when no photo provided");
    }

    // 3. Optional fields safe defaults
    if (res.cleanData.fatherName !== "N/A" || res.cleanData.motherName !== "N/A") {
        throw new Error("Missing father/mother should safely default to N/A");
    }
        if (res.cleanData.parentEmail !== "N/A") {
        throw new Error("Missing parent email should safely default to N/A");
    }
}, "student-add");

// ==========================================
// 16. Modular Student Directory & Viewer Module Tests
// ==========================================
suite.add("StudentViewModule: Zero hardcoding and dynamic DB loading", async () => {
    const svm = new StudentViewModule();
    if (svm.getClasses().length !== 0) throw new Error("Classes should be empty initially");
    if (svm.getFilteredStudents().length !== 0) throw new Error("Students should be empty initially");

    await svm.loadFromDatabase();
    if (svm.getClasses().length === 0) throw new Error("Should load classes dynamically from database");
}, "student-view");

suite.add("StudentViewModule: Class filtering, counts, and statistics", () => {
    const mockClasses = [
        { id: "1", name: "Class 1", order: 1 },
        { id: "2", name: "Class 2", order: 2 }
    ];
    const mockStudents = [
        { id: "US-01", name: { first: "Aarav", last: "Sharma" }, class: "1", roll: "01", gender: "male", phone: "9801234567" },
        { id: "US-02", name: { first: "Diya", last: "Shrestha" }, class: "1", roll: "02", gender: "female", phone: "9801234568", documents: [{ name: "Birth Cert", url: "x.jpg" }] },
        { id: "US-03", name: { first: "Kiran", last: "Tamang" }, class: "2", roll: "01", gender: "male", phone: "9801234569" }
    ];

    const svm = new StudentViewModule({ classes: mockClasses, students: mockStudents });

    // 1. Class Counts
    const counts = svm.getClassCounts();
    if (counts.all !== 3 || counts["1"] !== 2 || counts["2"] !== 1) {
        throw new Error("Class counts mismatch: " + JSON.stringify(counts));
    }

    // 2. Class Statistics
    const stats1 = svm.getClassStatistics("1");
    if (stats1.totalStudents !== 2 || stats1.maleCount !== 1 || stats1.femaleCount !== 1 || stats1.withDocsCount !== 1) {
        throw new Error("Class 1 statistics mismatch: " + JSON.stringify(stats1));
    }

    // 3. Class Filtering
    svm.setSelectedClass("1");
    const class1Students = svm.getFilteredStudents();
    if (class1Students.length !== 2) throw new Error("Should return exactly 2 students for Class 1");
    if (!class1Students.some(s => s.id === "US-01") || !class1Students.some(s => s.id === "US-02")) {
        throw new Error("Class 1 students list mismatch");
    }
}, "student-view");

suite.add("StudentViewModule: Search fuzzy matching across name, ID, phone, and parents", () => {
    const mockStudents = [
        { id: "US-2083-0001", name: { first: "Aarav", middle: "Chandra", last: "Sharma" }, class: "1", roll: "01", fatherName: "Ramesh Sharma", phone: "9801234567" },
        { id: "US-2083-0002", name: { first: "Pooja", last: "Adhikari" }, class: "2", roll: "02", motherName: "Sunita Adhikari", phone: "9841987654" }
    ];
    const svm = new StudentViewModule({ students: mockStudents });

    // 1. Search by student first name
    const res1 = svm.getFilteredStudents({ query: "aarav" });
    if (res1.length !== 1 || res1[0].id !== "US-2083-0001") throw new Error("Search by first name failed");

    // 2. Search by student ID
    const res2 = svm.getFilteredStudents({ query: "0002" });
    if (res2.length !== 1 || res2[0].id !== "US-2083-0002") throw new Error("Search by ID failed");

    // 3. Search by parent phone
    const res3 = svm.getFilteredStudents({ query: "984198" });
    if (res3.length !== 1 || res3[0].id !== "US-2083-0002") throw new Error("Search by phone failed");

    // 4. Search by parent name
    const res4 = svm.getFilteredStudents({ query: "Ramesh" });
    if (res4.length !== 1 || res4[0].id !== "US-2083-0001") throw new Error("Search by father name failed");
}, "student-view");

suite.add("StudentViewModule: Sorting and student profile formatting", () => {
    const mockStudents = [
        { id: "US-B", name: { first: "Bikash", last: "KC" }, class: "1", roll: "12", birthCertificate: "/uploads/bc.jpg" },
        { id: "US-A", name: { first: "Anil", last: "Giri" }, class: "1", roll: "03" }
    ];
    const svm = new StudentViewModule({ students: mockStudents });

    // 1. Sort by roll number
    const byRoll = svm.getFilteredStudents({ sortBy: "roll" });
    if (byRoll[0].id !== "US-A" || byRoll[1].id !== "US-B") {
        throw new Error("Sort by roll failed: expected US-A (roll 03) first");
    }

    // 2. Sort by name
    const byName = svm.getFilteredStudents({ sortBy: "name" });
    if (byName[0].fullName !== "Anil Giri") {
        throw new Error("Sort by name failed");
    }

    // 3. Profile formatting
    const formatted = svm.getStudentById("US-B");
    if (!formatted) throw new Error("getStudentById failed");
    if (formatted.fullName !== "Bikash KC") throw new Error("fullName formatting mismatch: " + formatted.fullName);
    if (formatted.roll !== "12") throw new Error("roll formatting mismatch: " + formatted.roll);
    if (formatted.documentCount !== 1 || formatted.documents[0].type !== "Birth Certificate") {
        throw new Error("Document normalization mismatch: " + JSON.stringify(formatted.documents));
    }
}, "student-view");

// ==========================================
// 17. Modular Faculty Directory & Viewer Module Tests
// ==========================================
suite.add("TeacherViewModule: Zero hardcoding and dynamic DB loading", async () => {
    const tvm = new TeacherViewModule();
    if (tvm.getClasses().length !== 0) throw new Error("Classes should be empty initially");
    if (tvm.getTeachers().length !== 0) throw new Error("Teachers should be empty initially");

    await tvm.loadFromDatabase();
    if (tvm.getClasses().length === 0) throw new Error("Should load classes dynamically from database");
    if (tvm.getTeachers().length === 0) throw new Error("Should load teachers dynamically from database");
}, "teacher-view");

suite.add("TeacherViewModule: Category and class filtering, counts, and statistics", () => {
    const mockClasses = [
        { id: "1", name: "Class 1", order: 1 },
        { id: "2", name: "Class 2", order: 2 },
        { id: "3", name: "Class 3", order: 3 }
    ];
    const mockTeachers = [
        {
            id: "TEA-01",
            name: { first: "Santosh", last: "Adhikari" },
            classTeacherOf: "1",
            workload: { "1": ["Basic Math"], "2": ["Math"] },
            isVerified: true
        },
        {
            id: "TEA-02",
            name: { first: "Puspa", last: "Dahal" },
            classTeacherOf: "None",
            workload: { "2": ["Nepali"], "3": ["Social Studies"] },
            verificationDocuments: [{ id: "d1", name: "Degree", url: "/d1.pdf" }]
        },
        {
            id: "TEA-03",
            name: { first: "Sunil", last: "Karki" },
            classTeacherOf: "2",
            workload: { "3": ["Science"] }
        }
    ];

    const tvm = new TeacherViewModule({ classes: mockClasses, teachers: mockTeachers });

    // 1. Filter Counts
    const counts = tvm.getFilterCounts();
    if (counts.all !== 3 || counts.class_teachers !== 2 || counts.subject_teachers !== 1) {
        throw new Error("Filter counts mismatch: " + JSON.stringify(counts));
    }
    // Class 1 has TEA-01 (class teacher) -> 1
    // Class 2 has TEA-01 (teaches Math), TEA-02 (teaches Nepali), TEA-03 (class teacher) -> 3
    if (counts["1"] !== 1 || counts["2"] !== 3 || counts["3"] !== 2) {
        throw new Error("Per-class counts mismatch: " + JSON.stringify(counts));
    }

    // 2. Statistics
    const stats = tvm.getStatistics();
    if (stats.totalFaculty !== 3 || stats.classTeachersCount !== 2 || stats.subjectTeachersCount !== 1) {
        throw new Error("Statistics faculty counts mismatch: " + JSON.stringify(stats));
    }
    if (stats.verifiedCount !== 2) {
        throw new Error("Verified faculty count mismatch, expected 2, got: " + stats.verifiedCount);
    }
    if (stats.totalClassesCovered !== 3) {
        throw new Error("Total classes covered mismatch, expected 3, got: " + stats.totalClassesCovered);
    }

    // 3. Category Filtering
    const ctList = tvm.getFilteredTeachers({ filter: "class_teachers" });
    if (ctList.length !== 2 || !ctList.some(t => t.id === "TEA-01") || !ctList.some(t => t.id === "TEA-03")) {
        throw new Error("class_teachers filter mismatch");
    }

    const stList = tvm.getFilteredTeachers({ filter: "subject_teachers" });
    if (stList.length !== 1 || stList[0].id !== "TEA-02") {
        throw new Error("subject_teachers filter mismatch");
    }

    // 4. Class-specific Filtering
    const c1List = tvm.getFilteredTeachers({ filter: "1" });
    if (c1List.length !== 1 || c1List[0].id !== "TEA-01") {
        throw new Error("Class 1 filter mismatch");
    }
}, "teacher-view");

suite.add("TeacherViewModule: Search fuzzy matching across name, ID, phone, subjects, and title", () => {
    const mockTeachers = [
        {
            id: "TEA-0218",
            name: { first: "Santosh", middle: "Kumar", last: "Adhikari" },
            professionalTitle: "Senior Mathematics Lecturer",
            phone: "9865000218",
            email: "santosh@school.edu.np",
            qualification: "M.Ed. Mathematics",
            workload: { "1": ["Basic Math"], "2": ["Calculus", "Geometry"] }
        },
        {
            id: "TEA-0219",
            name: { first: "Anita", last: "Rai" },
            professionalTitle: "Science Faculty",
            phone: "9842111222",
            email: "anita.rai@school.edu.np",
            qualification: "B.Sc. Physics",
            workload: { "3": ["Astrophysics", "General Science"] }
        }
    ];

    const tvm = new TeacherViewModule({ teachers: mockTeachers });

    // 1. Search by name
    const r1 = tvm.getFilteredTeachers({ query: "santosh" });
    if (r1.length !== 1 || r1[0].id !== "TEA-0218") throw new Error("Search by first name failed");

    // 2. Search by faculty ID
    const r2 = tvm.getFilteredTeachers({ query: "0219" });
    if (r2.length !== 1 || r2[0].id !== "TEA-0219") throw new Error("Search by ID failed");

    // 3. Search by phone number
    const r3 = tvm.getFilteredTeachers({ query: "9865000" });
    if (r3.length !== 1 || r3[0].id !== "TEA-0218") throw new Error("Search by phone failed");

    // 4. Search by title
    const r4 = tvm.getFilteredTeachers({ query: "Science Faculty" });
    if (r4.length !== 1 || r4[0].id !== "TEA-0219") throw new Error("Search by title failed");

    // 5. Search by subject in workload
    const r5 = tvm.getFilteredTeachers({ query: "geometry" });
    if (r5.length !== 1 || r5[0].id !== "TEA-0218") throw new Error("Search by workload subject failed");
}, "teacher-view");

suite.add("TeacherViewModule: Sorting and teacher profile formatting with workload breakdown", () => {
    const mockClasses = [
        { id: "1", name: "Class 1", order: 1 },
        { id: "2", name: "Class 2", order: 2 }
    ];
    const mockTeachers = [
        {
            id: "TEA-Z",
            name: { first: "Zenith", last: "Shrestha" },
            experience: "10 Years",
            classTeacherOf: "1",
            workload: { "1": ["English"], "2": ["Grammar"] },
            verificationDocuments: [{ id: "doc1", name: "Master Degree", type: "Certificate", url: "/d1.pdf" }]
        },
        {
            id: "TEA-A",
            name: { first: "Amod", last: "Basnet" },
            experience: "3 Years",
            classTeacherOf: "None"
        }
    ];

    const tvm = new TeacherViewModule({ classes: mockClasses, teachers: mockTeachers });

    // 1. Sort by name
    const byName = tvm.getFilteredTeachers({ sortBy: "name" });
    if (byName[0].id !== "TEA-A" || byName[1].id !== "TEA-Z") {
        throw new Error("Sort by name failed");
    }

    // 2. Sort by ID
    const byId = tvm.getFilteredTeachers({ sortBy: "id" });
    if (byId[0].id !== "TEA-A" || byId[1].id !== "TEA-Z") {
        throw new Error("Sort by ID failed");
    }

    // 3. Sort by Experience (highest first)
    const byExp = tvm.getFilteredTeachers({ sortBy: "experience" });
    if (byExp[0].id !== "TEA-Z" || byExp[1].id !== "TEA-A") {
        throw new Error("Sort by experience failed");
    }

    // 4. Profile formatting & workload breakdown
    const formatted = tvm.getTeacherById("TEA-Z");
    if (!formatted) throw new Error("getTeacherById failed");
    if (formatted.fullName !== "Zenith Shrestha") throw new Error("fullName mismatch");
    if (formatted.classTeacherBadge !== "Class Teacher (Class 1)") {
        throw new Error("classTeacherBadge mismatch: " + formatted.classTeacherBadge);
    }
    if (formatted.documentCount !== 1) throw new Error("documentCount mismatch");
    if (formatted.workload.length !== 2 || formatted.workload[0].className !== "Class 1") {
        throw new Error("workload formatting mismatch: " + JSON.stringify(formatted.workload));
    }
        if (formatted.totalSubjectsCount !== 2) throw new Error("totalSubjectsCount mismatch");
}, "teacher-view");

// ==========================================
// 18. Modular Student Record Editor Module Tests
// ==========================================
suite.add("StudentEditModule: Zero hardcoding and dynamic DB loading", async () => {
    const sem = new StudentEditModule();
    if (sem.getClasses().length !== 0) throw new Error("Classes should be empty initially");
    if (sem.existingStudents.length !== 0) throw new Error("Existing students should be empty initially");

    await sem.loadFromDatabase();
    if (sem.getClasses().length === 0) throw new Error("Should load classes dynamically from DB");
    if (sem.existingStudents.length === 0) throw new Error("Should load student records dynamically from DB");
}, "student-edit");

suite.add("StudentEditModule: Strict validation and input sanitization (XSS defense)", () => {
    const sem = new StudentEditModule({
        classes: [{ id: "1", name: "Class 1" }, { id: "2", name: "Class 2" }],
        classSubjects: { "1": ["Nepali", "English"], "2": ["Math", "Science"] }
    });

    const baseRecord = {
        id: "US-2083-0001",
        name: { first: "Aarav", last: "Sharma" },
        class: "1",
        phone: "9845212500"
    };

    // 1. Missing First Name
    const failRes = sem.validate("US-2083-0001", { firstName: "   ", lastName: "Sharma" }, baseRecord);
    if (failRes.isValid) throw new Error("Validation should fail when first name is empty");

    // 2. Missing Last Name
    const failRes2 = sem.validate("US-2083-0001", { firstName: "Aarav", lastName: "" }, baseRecord);
    if (failRes2.isValid) throw new Error("Validation should fail when last name is empty");

    // 3. XSS / Malicious Script Sanitization
    const xssRes = sem.validate("US-2083-0001", {
        firstName: "<script>alert('xss')</script>Aarav",
        lastName: "Sharma",
        fatherName: "<b>Ramesh</b>",
        phone: "9845212500"
    }, baseRecord);

    if (!xssRes.isValid) throw new Error("Validation should pass with sanitized inputs: " + JSON.stringify(xssRes.errors));
    if (xssRes.cleanData.name.first.includes("<script>")) {
        throw new Error("Script tag was not sanitized in first name: " + xssRes.cleanData.name.first);
    }
    if (xssRes.cleanData.fatherName.includes("<b>")) {
        throw new Error("HTML tags were not sanitized in fatherName: " + xssRes.cleanData.fatherName);
    }

    // 4. Invalid Phone Number
    const badPhone = sem.validate("US-2083-0001", { firstName: "Aarav", lastName: "Sharma", phone: "123" }, baseRecord);
    if (badPhone.isValid) throw new Error("Validation should reject invalid phone");

    // 5. Valid 10-digit Phone Normalization with Country Code
    const normPhone = sem.validate("US-2083-0001", { firstName: "Aarav", lastName: "Sharma", phone: "+977 9845212500, 9801234567" }, baseRecord);
    if (!normPhone.isValid) throw new Error("Failed to validate valid normalized phones: " + JSON.stringify(normPhone.errors));
    if (normPhone.cleanData.phones.length !== 2 || normPhone.cleanData.phones[0] !== "9845212500") {
        throw new Error("Phone normalization mismatch: " + JSON.stringify(normPhone.cleanData.phones));
    }
}, "student-edit");

suite.add("StudentEditModule: Dynamic class change & automatic curriculum subject reassignment", () => {
    const sem = new StudentEditModule({
        classes: [{ id: "1", name: "Class 1" }, { id: "2", name: "Class 2" }],
        classSubjects: {
            "1": ["Basic Math", "Fun & Games"],
            "2": ["Integrated Science", "Mathematics", "English II"]
        }
    });

    const studentClass1 = {
        id: "US-2083-0001",
        name: { first: "Aarav", last: "Sharma" },
        class: "1",
        phone: "9845212500",
        academic: { subjects: ["Basic Math", "Fun & Games"] }
    };

    // Promote to Class 2
    const promoted = sem.validate("US-2083-0001", { class: "2" }, studentClass1);
    if (!promoted.isValid) throw new Error("Promotion validation failed: " + JSON.stringify(promoted.errors));
    if (promoted.cleanData.class !== "2") throw new Error("Class was not updated to 2");

    // Subjects should automatically reassign to Class 2's curriculum
    const newSubjects = promoted.cleanData.academic.subjects;
    if (newSubjects.length !== 3 || !newSubjects.includes("Integrated Science")) {
        throw new Error("Subjects were not dynamically updated to Class 2 curriculum: " + JSON.stringify(newSubjects));
    }
}, "student-edit");

suite.add("StudentEditModule: Parent phone updates and atomic login mapping synchronization", async () => {
    const sem = new StudentEditModule({
        classes: [{ id: "1", name: "Class 1" }],
        classSubjects: { "1": ["Nepali"] }
    });

    const originalRecord = {
        id: "US-TEST-P1",
        name: { first: "Pooja", last: "Sharma" },
        class: "1",
        phone: "9845212550", // Old phone
        status: "active"
    };

    sem.existingStudents = [originalRecord];

    // Change parent phone from 9845212550 to 9809998877
    const result = await sem.updateStudent("US-TEST-P1", {
        phone: "9809998877"
    });

    if (!result.success) throw new Error("updateStudent failed: " + JSON.stringify(result.errors));
    if (!result.loginMappingsChanged) throw new Error("loginMappingsChanged flag should be true");
    if (!result.removedPhones.includes("9845212550")) throw new Error("Old phone 9845212550 should be in removedPhones");
    if (!result.addedPhones.includes("9809998877")) throw new Error("New phone 9809998877 should be in addedPhones");

    // Verify stored student has updated phone
    const updated = sem.existingStudents.find(s => s.id === "US-TEST-P1");
    if (updated.phone !== "9809998877") throw new Error("Student record phone was not updated");
}, "student-edit");

suite.add("StudentEditModule: Verification document management and secure URL protocol enforcement", () => {
    const sem = new StudentEditModule({
        classes: [{ id: "1", name: "Class 1" }],
        classSubjects: { "1": ["Math"] }
    });

    const baseRecord = {
        id: "US-DOC-01",
        name: { first: "Aarav", last: "Sharma" },
        class: "1",
        phone: "9845212500",
        documents: [
            { id: "d1", name: "Old Doc", type: "Birth Certificate", url: "/uploads/old.pdf" }
        ]
    };

    // 1. Insecure protocol detection (e.g. javascript:)
    const badDocRes = sem.validate("US-DOC-01", {
        documents: [
            { id: "d1", name: "Hacked", type: "Exploit", url: "javascript:alert(1)" }
        ]
    }, baseRecord);
    if (badDocRes.isValid) throw new Error("Should reject insecure javascript: protocol in document URL");

    // 2. Safe addition and update of verification documents
    const safeDocRes = sem.validate("US-DOC-01", {
        documents: [
            { id: "d1", name: "Birth Certificate", type: "Birth Certificate", url: "/uploads/birth.pdf" },
            { id: "d2", name: "Grade 1 Marksheet", type: "Previous Marksheet", url: "/uploads/marksheet.pdf" }
        ]
    }, baseRecord);

        if (!safeDocRes.isValid) throw new Error("Safe documents failed validation: " + JSON.stringify(safeDocRes.errors));
    if (safeDocRes.cleanData.documents.length !== 2) throw new Error("Should have 2 documents attached");
    if (safeDocRes.cleanData.birthCertificate !== "/uploads/birth.pdf") {
        throw new Error("Legacy birthCertificate mapping mismatch");
    }
}, "student-edit");

// ==========================================
// 19. Modular Faculty Record Editor Module Tests
// ==========================================
suite.add("TeacherEditModule: Zero hardcoding and dynamic DB loading", async () => {
    const tem = new TeacherEditModule();
    if (tem.getClasses().length !== 0) throw new Error("Classes should be empty initially");
    if (tem.existingTeachers.length !== 0) throw new Error("Existing teachers should be empty initially");

    await tem.loadFromDatabase();
    if (tem.getClasses().length === 0) throw new Error("Should load classes dynamically from DB");
    if (tem.existingTeachers.length === 0) throw new Error("Should load teacher records dynamically from DB");
}, "teacher-edit");

suite.add("TeacherEditModule: Strict validation, phone uniqueness, and XSS sanitization", () => {
    const tem = new TeacherEditModule({
        classes: [{ id: "1", name: "Class 1" }],
        existingTeachers: [
            { id: "TEA-OTHER", phone: "9841000000" }
        ]
    });

    const baseRecord = {
        id: "TEA-0218",
        name: { first: "Santosh", last: "Dahal" },
        phone: "9842686121"
    };

    // 1. Missing First Name
    const failRes = tem.validate("TEA-0218", { firstName: "", lastName: "Dahal" }, baseRecord);
    if (failRes.isValid) throw new Error("Validation should fail when first name is empty");

    // 2. Missing Last Name
    const failRes2 = tem.validate("TEA-0218", { firstName: "Santosh", lastName: "" }, baseRecord);
    if (failRes2.isValid) throw new Error("Validation should fail when last name is empty");

    // 3. Duplicate phone collision with another teacher
    const dupRes = tem.validate("TEA-0218", { firstName: "Santosh", lastName: "Dahal", phone: "9841000000" }, baseRecord);
    if (dupRes.isValid) throw new Error("Validation should reject phone collision with another faculty member");

    // 4. Same phone for self should pass
    const selfRes = tem.validate("TEA-0218", { firstName: "Santosh", lastName: "Dahal", phone: "9842686121" }, baseRecord);
    if (!selfRes.isValid) throw new Error("Retaining existing phone should pass: " + JSON.stringify(selfRes.errors));

    // 5. XSS Defense
    const xssRes = tem.validate("TEA-0218", {
        firstName: "<img src=x onerror=alert(1)>Santosh",
        lastName: "Dahal",
        qualification: "<b>M.Sc Mathematics</b>"
    }, baseRecord);

    if (!xssRes.isValid) throw new Error("XSS sanitization should pass validation: " + JSON.stringify(xssRes.errors));
    if (xssRes.cleanData.name.first.includes("<img")) {
        throw new Error("HTML tags were not sanitized in firstName: " + xssRes.cleanData.name.first);
    }
    if (xssRes.cleanData.qualification.includes("<b>")) {
        throw new Error("HTML tags were not sanitized in qualification: " + xssRes.cleanData.qualification);
    }
}, "teacher-edit");

suite.add("TeacherEditModule: Workload assignment and class teacher authority changes", () => {
    const tem = new TeacherEditModule({
        classes: [{ id: "1", name: "Class 1" }, { id: "2", name: "Class 2" }],
        classSubjects: {
            "1": ["Basic Math", "Fun & Games"],
            "2": ["Integrated Science", "Mathematics"]
        }
    });

    const baseRecord = {
        id: "TEA-0218",
        name: { first: "Santosh", last: "Dahal" },
        phone: "9842686121",
        classTeacherOf: "1",
        workload: {
            "1": ["Basic Math"]
        }
    };

    // Reassign class teacher to Class 2 and expand workload
    const res = tem.validate("TEA-0218", {
        classTeacherOf: "2",
        workload: {
            "1": ["Basic Math"],
            "2": ["Mathematics", "Integrated Science"]
        }
    }, baseRecord);

    if (!res.isValid) throw new Error("Workload update validation failed: " + JSON.stringify(res.errors));
    if (res.cleanData.classTeacherOf !== "2") throw new Error("Class teacher was not updated to Class 2");
    if (res.cleanData.assignedClasses.length !== 2) throw new Error("Assigned classes count should be 2");
    if (!res.cleanData.subjects.includes("Integrated Science")) {
        throw new Error("Derived subjects missing Integrated Science: " + JSON.stringify(res.cleanData.subjects));
    }
}, "teacher-edit");

suite.add("TeacherEditModule: Faculty phone updates and atomic login mapping synchronization", async () => {
    const tem = new TeacherEditModule();

    const originalRecord = {
        id: "TEA-SYNC-01",
        name: { first: "Bina", last: "Rai" },
        phone: "9801112233"
    };

    tem.existingTeachers = [originalRecord];

    // Change faculty mobile from 9801112233 to 9804445566
    const result = await tem.updateTeacher("TEA-SYNC-01", {
        phone: "9804445566"
    });

    if (!result.success) throw new Error("updateTeacher failed: " + JSON.stringify(result.errors));
    if (!result.loginMappingChanged) throw new Error("loginMappingChanged flag should be true");
    if (result.oldPhone !== "9801112233" || result.newPhone !== "9804445566") {
        throw new Error("Phone diff mismatch: old=" + result.oldPhone + ", new=" + result.newPhone);
    }

    // Verify stored teacher record
    const updated = tem.existingTeachers.find(t => t.id === "TEA-SYNC-01");
    if (updated.phone !== "9804445566") throw new Error("Stored teacher phone was not updated");
}, "teacher-edit");

suite.add("TeacherEditModule: Verification document management and secure URL protocol enforcement", () => {
    const tem = new TeacherEditModule();

    const baseRecord = {
        id: "TEA-DOCS-01",
        name: { first: "Santosh", last: "Dahal" },
        phone: "9842686121",
        documents: [{ id: "d1", name: "Degree", type: "Degree", url: "/uploads/deg.pdf" }]
    };

    // Insecure URL protocol rejection
    const badDocRes = tem.validate("TEA-DOCS-01", {
        documents: [{ id: "d1", name: "Malicious", type: "Certificate", url: "data:text/html,<script>alert(1)</script>" }]
    }, baseRecord);
    if (badDocRes.isValid) throw new Error("Should reject data:text/html protocol in document URL");

    // Safe document update
    const safeDocRes = tem.validate("TEA-DOCS-01", {
        documents: [
            { id: "d1", name: "Degree Certificate", type: "M.Sc Degree", url: "/uploads/msc.pdf" },
            { id: "d2", name: "Citizenship Card", type: "National ID", url: "/uploads/cit.pdf" }
        ]
    }, baseRecord);

    if (!safeDocRes.isValid) throw new Error("Safe document update failed: " + JSON.stringify(safeDocRes.errors));
    if (safeDocRes.cleanData.documents.length !== 2) throw new Error("Should have 2 verification documents");
}, "teacher-edit");

// Run test runner
suite.run();


