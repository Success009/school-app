// modules/setupModule.js - Isolated School Setup Engine (Classes & Compulsory Subjects)
import { DatabaseService } from './db.js';

export class SetupModule {
    constructor(options = {}) {
        this.classes = options.classes || [
            { id: '1', name: 'Class 1', order: 1 },
            { id: '2', name: 'Class 2', order: 2 },
            { id: '3', name: 'Class 3', order: 3 },
            { id: '4', name: 'Class 4', order: 4 },
            { id: '5', name: 'Class 5', order: 5 },
            { id: '6', name: 'Class 6', order: 6 },
            { id: '7', name: 'Class 7', order: 7 },
            { id: '8', name: 'Class 8', order: 8 }
        ];
        this.assignments = options.assignments || {}; // { classId: [ { id, name, publisher } ] }
        this.activeClassId = this.classes.length > 0 ? this.classes[0].id : null;
    }

    // Class Operations
    addClass(name, order = null) {
        if (!name || typeof name !== 'string' || !name.trim()) return null;
        const cleanName = name.trim();
        const id = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
        if (!id || this.classes.some(c => c.id === id)) return null;

        const newClass = {
            id,
            name: cleanName,
            order: order !== null ? order : (this.classes.length + 1)
        };
        this.classes.push(newClass);
        this.classes.sort((a, b) => a.order - b.order);
        if (!this.assignments[id]) this.assignments[id] = [];
        return newClass;
    }

    removeClass(classId) {
        if (!classId) return false;
        const exists = this.classes.some(c => c.id === classId);
        if (!exists) return false;
        this.classes = this.classes.filter(c => c.id !== classId);
        delete this.assignments[classId];
        if (this.activeClassId === classId) {
            this.activeClassId = this.classes.length > 0 ? this.classes[0].id : null;
        }
        return true;
    }

    // Subject Operations
    addSubject(classId, name, publisher = '') {
        if (!classId || !name || typeof name !== 'string' || !name.trim()) return null;
        if (!this.assignments[classId]) this.assignments[classId] = [];

        const cleanName = name.trim();
        const subId = 'sub_' + cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

        // Prevent duplicate subject in the same class
        if (this.assignments[classId].some(s => s.name.toLowerCase() === cleanName.toLowerCase())) {
            return null;
        }

        const newSub = {
            id: subId,
            name: cleanName,
            publisher: typeof publisher === 'string' ? publisher.trim() : ''
        };
        this.assignments[classId].push(newSub);
        return newSub;
    }

    removeSubject(classId, subjectId) {
        if (!classId || !subjectId || !this.assignments[classId]) return false;
        const initialLen = this.assignments[classId].length;
        this.assignments[classId] = this.assignments[classId].filter(s => s.id !== subjectId);
        return this.assignments[classId].length < initialLen;
    }

    getSubjectsForClass(classId) {
        return this.assignments[classId] || [];
    }

    // Async Database Sync
    async loadFromDatabase() {
        try {
            if (typeof localStorage !== 'undefined') {
                const cachedClasses = localStorage.getItem('school_setup_classes');
                const cachedAssignments = localStorage.getItem('school_setup_assignments');
                if (cachedClasses) this.classes = JSON.parse(cachedClasses);
                if (cachedAssignments) this.assignments = JSON.parse(cachedAssignments);
                if (this.classes.length > 0 && !this.activeClassId) {
                    this.activeClassId = this.classes[0].id;
                }
            }
        } catch (_) {}

        try {
            if (typeof DatabaseService !== 'undefined' && DatabaseService && DatabaseService.getClasses) {
                const dbClasses = await DatabaseService.getClasses();
                if (dbClasses && dbClasses.length > 0) {
                    this.classes = dbClasses;
                }
                for (const c of this.classes) {
                    const cfg = await DatabaseService.getClassConfigs(c.id);
                    if (cfg && cfg.subjects && cfg.subjects.compulsory) {
                        this.assignments[c.id] = Object.entries(cfg.subjects.compulsory).map(([id, val]) => {
                            return typeof val === 'object' && val !== null ? { id, ...val } : { id, name: val, publisher: '' };
                        });
                    }
                }
            }
        } catch (e) {
            console.warn("SetupModule: using local defaults", e.message);
        }
    }

    async saveToDatabase() {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('school_setup_classes', JSON.stringify(this.classes));
                localStorage.setItem('school_setup_assignments', JSON.stringify(this.assignments));
            }
            if (typeof DatabaseService !== 'undefined' && DatabaseService && DatabaseService.saveClass) {
                for (const c of this.classes) {
                    await DatabaseService.saveClass(c.id, { name: c.name, order: c.order });
                    const subs = this.assignments[c.id] || [];
                    for (const s of subs) {
                        await DatabaseService.saveClassSubject(c.id, s.id, { name: s.name, publisher: s.publisher || '' });
                    }
                }
            }
            return { success: true };
        } catch (e) {
            console.warn("SetupModule: saved locally, remote offline:", e.message);
            return { success: true, localOnly: true, error: e.message };
        }
    }
}
