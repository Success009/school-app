// modules/setupModule.js - Modular School Setup Engine (Classes & Compulsory Subjects)
import { DatabaseService } from './db.js';

export class SetupModule {
    constructor(containerId = null, options = {}) {
        this.containerId = containerId;
        this.step = 1; // 1: Classes, 2: Class Subjects & Books
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
        if (!name || !name.trim()) return null;
        const cleanName = name.trim();
        const id = cleanName.toLowerCase().replace(/\s+/g, '_');
        if (this.classes.some(c => c.id === id)) return null;

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
        this.classes = this.classes.filter(c => c.id !== classId);
        delete this.assignments[classId];
        if (this.activeClassId === classId) {
            this.activeClassId = this.classes.length > 0 ? this.classes[0].id : null;
        }
    }

    // Subject Operations
    addSubject(classId, name, publisher = '') {
        if (!classId || !name || !name.trim()) return null;
        if (!this.assignments[classId]) this.assignments[classId] = [];

        const cleanName = name.trim();
        const subId = 'sub_' + cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_');
        
        // Prevent duplicate subject in the same class
        if (this.assignments[classId].some(s => s.name.toLowerCase() === cleanName.toLowerCase())) {
            return null;
        }

        const newSub = {
            id: subId,
            name: cleanName,
            publisher: (publisher || '').trim()
        };
        this.assignments[classId].push(newSub);
        return newSub;
    }

    removeSubject(classId, subjectId) {
        if (!this.assignments[classId]) return;
        this.assignments[classId] = this.assignments[classId].filter(s => s.id !== subjectId);
    }

    getSubjectsForClass(classId) {
        return this.assignments[classId] || [];
    }

    // Clone subjects from one class to another (e.g. Class 1 subjects copied to Class 2)
    cloneSubjects(sourceClassId, targetClassId) {
        if (!this.assignments[sourceClassId] || !this.assignments[targetClassId]) return 0;
        const sourceSubs = this.assignments[sourceClassId];
        let addedCount = 0;
        for (const sub of sourceSubs) {
            if (!this.assignments[targetClassId].some(s => s.name.toLowerCase() === sub.name.toLowerCase())) {
                this.assignments[targetClassId].push({
                    id: sub.id,
                    name: sub.name,
                    publisher: sub.publisher
                });
                addedCount++;
            }
        }
        return addedCount;
    }

    // Async Database Sync
    async loadFromDatabase() {
        try {
            const dbClasses = await DatabaseService.getClasses();
            if (dbClasses && dbClasses.length > 0) {
                this.classes = dbClasses;
            }
            // Load subjects for each class
            for (const c of this.classes) {
                const cfg = await DatabaseService.getClassConfigs(c.id);
                if (cfg && cfg.subjects && cfg.subjects.compulsory) {
                    this.assignments[c.id] = Object.entries(cfg.subjects.compulsory).map(([id, val]) => {
                        return typeof val === 'object' && val !== null ? { id, ...val } : { id, name: val, publisher: '' };
                    });
                }
            }
        } catch (e) {
            console.warn("SetupModule: using local defaults", e.message);
        }
    }

    async saveToDatabase() {
        for (const c of this.classes) {
            await DatabaseService.saveClass(c.id, { name: c.name, order: c.order });
            const subs = this.assignments[c.id] || [];
            const subMap = {};
            for (const s of subs) {
                subMap[s.id] = { name: s.name, publisher: s.publisher || '' };
            }
            await DatabaseService.saveClassSubject(c.id, 'all', subMap);
        }
        return { success: true };
    }
}
