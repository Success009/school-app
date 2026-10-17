/**
 * Standalone Unit Tests for OfflineStore
 * 
 * RUN COMMAND:
 * node tests/offlineStore.test.js
 * 
 * CONTEXT EFFICIENCY:
 * This test file can be executed in complete isolation without running the whole
 * test runner or loading backend server routes.
 */

import { OfflineStore } from '../modules/offlineStore.js';

// Polyfills for standalone headless execution
const memoryStorage = {};
global.localStorage = {
    getItem: (k) => memoryStorage[k] || null,
    setItem: (k, v) => { memoryStorage[k] = String(v); },
    removeItem: (k) => { delete memoryStorage[k]; },
    clear: () => { Object.keys(memoryStorage).forEach(k => delete memoryStorage[k]); }
};
global.navigator = { onLine: true };

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (!condition) {
        throw new Error(message || "Assertion failed");
    }
}

async function runTest(name, fn) {
    try {
        await fn();
        console.log(`\x1b[32m✔ PASS:\x1b[0m ${name}`);
        passed++;
    } catch (e) {
        console.error(`\x1b[31m✘ FAIL:\x1b[0m ${name}`);
        console.error(e);
        failed++;
    }
}

async function main() {
    console.log("\x1b[35m=== RUNNING STANDALONE OFFLINE STORE TESTS ===\x1b[0m\n");

    await runTest("OfflineStore: Cache and retrieve student record", () => {
        const studentPayload = {
            id: "STU-101",
            name: { first: "Aarav", last: "Sharma" },
            grade: "8",
            attendance: { present: 45, total: 50 },
            terminalResults: { "1st Term": { gpa: "3.85", grade: "A" } }
        };

        const saved = OfflineStore.cacheStudentRecord("STU-101", studentPayload);
        assert(saved === true, "cacheStudentRecord failed to save");

        const cached = OfflineStore.getStudentRecord("STU-101");
        assert(cached !== null, "getStudentRecord returned null");
        assert(cached.data.id === "STU-101", "Cached student ID did not match");
        assert(cached.data.terminalResults["1st Term"].gpa === "3.85", "Cached GPA did not match");
        assert(typeof cached.cachedAt === 'number', "Missing cachedAt timestamp");
    });

    await runTest("OfflineStore: Cache and retrieve teacher class roster", () => {
        const teacherRoster = [
            { id: "STU-101", roll: "01", name: "Aarav Sharma" },
            { id: "STU-102", roll: "02", name: "Bipul Thapa" }
        ];

        OfflineStore.cacheTeacherRoster("TCH-202", teacherRoster);
        const retrieved = OfflineStore.getTeacherRoster("TCH-202");
        assert(retrieved !== null && retrieved.data.length === 2, "Failed to retrieve 2 students in roster");
        assert(retrieved.data[1].name === "Bipul Thapa", "Roster student name mismatch");
    });

    await runTest("OfflineStore: Detect offline state", () => {
        global.navigator.onLine = false;
        assert(OfflineStore.isOnline() === false, "isOnline did not report false when offline");

        const cached = OfflineStore.getStudentRecord("STU-101");
        assert(cached.isOffline === true, "isOffline flag on record was not true");
        global.navigator.onLine = true;
    });

    await runTest("OfflineStore: Non-existent record returns null", () => {
        const nonExistent = OfflineStore.getStudentRecord("NON_EXISTENT_ID");
        assert(nonExistent === null, "Non existent record must return null");
    });

    console.log(`\n\x1b[35m=== SUMMARY: Passed ${passed}/${passed + failed} Tests ===\x1b[0m`);
    if (failed > 0) process.exit(1);
}

main();
