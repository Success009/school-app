// modules/teacherModule.js - Isolated Teacher Directory & Onboarding Engine
import { DatabaseService } from './db.js';

export const DEFAULT_AVATAR = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2NiZDVlMSI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg==';

// Standard national curriculum subjects as default per class if none configured yet
export const DEFAULT_CLASS_SUBJECTS = {
    '1': ['English', 'Nepali', 'Mathematics', 'Our Surroundings (Science & Social)'],
    '2': ['English', 'Nepali', 'Mathematics', 'Our Surroundings (Science & Social)'],
    '3': ['English', 'Nepali', 'Mathematics', 'Our Surroundings (Science & Social)'],
    '4': ['English', 'Nepali', 'Mathematics', 'Science', 'Social Studies', 'Health & Physical'],
    '5': ['English', 'Nepali', 'Mathematics', 'Science', 'Social Studies', 'Health & Physical'],
    '6': ['English', 'Nepali', 'Mathematics', 'Science', 'Social Studies', 'Computer Science', 'Occupation & Technology'],
    '7': ['English', 'Nepali', 'Mathematics', 'Science', 'Social Studies', 'Computer Science', 'Occupation & Technology'],
    '8': ['English', 'Nepali', 'Mathematics', 'Science', 'Social Studies', 'Computer Science', 'Moral Education', 'Health & Physical']
};

export class TeacherModule {
    constructor(options = {}) {
        this.teachers = options.teachers || [];
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
        this.classSubjects = options.classSubjects || { ...DEFAULT_CLASS_SUBJECTS };
        this.activeTeacherId = null;
        this.filterQuery = '';
    }

    // Input Validation
    validate(data, isEditingId = null) {
        const errors = [];
        const clean = {};

        // First Name
        const fname = typeof data.firstName === 'string' ? data.firstName.trim() : (data.name && typeof data.name.first === 'string' ? data.name.first.trim() : '');
        if (!fname) errors.push('First name is required.');
        clean.firstName = fname;

        // Middle Name
        clean.middleName = typeof data.middleName === 'string' ? data.middleName.trim() : (data.name && typeof data.name.middle === 'string' ? data.name.middle.trim() : '');

        // Last Name
        const lname = typeof data.lastName === 'string' ? data.lastName.trim() : (data.name && typeof data.name.last === 'string' ? data.name.last.trim() : '');
        if (!lname) errors.push('Last name is required.');
        clean.lastName = lname;

        // Phone Validation (10 digits)
        const rawPhone = String(data.phone || '').replace(/\D/g, '');
        if (!rawPhone || rawPhone.length !== 10) {
            errors.push('A valid 10-digit mobile number is required.');
        } else {
            // Duplicate phone check
            const duplicate = this.teachers.some(t => t.phone === rawPhone && t.id !== isEditingId);
            if (duplicate) {
                errors.push('Mobile number already assigned to another faculty member.');
            }
        }
        clean.phone = rawPhone;

        // Professional Title
        clean.professionalTitle = typeof data.professionalTitle === 'string' && data.professionalTitle.trim() ? data.professionalTitle.trim() : 'Faculty Member';

        // Class Teacher Assignment ('unassigned' | 'none' | classId)
        if (data.classTeacherOf === 'unassigned') {
            clean.classTeacherOf = 'unassigned';
        } else if (data.classTeacherOf && data.classTeacherOf !== 'none') {
            clean.classTeacherOf = String(data.classTeacherOf);
        } else {
            clean.classTeacherOf = 'none';
        }

        // Workload: { [classId]: string[] of subject names }
        let workload = {};
        if (data.workload && typeof data.workload === 'object' && !Array.isArray(data.workload)) {
            for (const [clsId, subs] of Object.entries(data.workload)) {
                if (Array.isArray(subs) && subs.length > 0) {
                    workload[clsId] = [...new Set(subs.map(s => String(s).trim()).filter(Boolean))];
                }
            }
        } else if (Array.isArray(data.assignedClasses)) {
            // Fallback for flat assignedClasses & subjects
            const defaultSubs = Array.isArray(data.subjects) ? data.subjects : [];
            for (const c of data.assignedClasses) {
                workload[String(c)] = [...defaultSubs];
            }
        }

        clean.workload = workload;
        clean.assignedClasses = Object.keys(workload);

        // Compute flattened unique subjects
        const subjectsSet = new Set();
        Object.values(workload).forEach(subs => subs.forEach(s => subjectsSet.add(s)));
        if (Array.isArray(data.subjects)) {
            data.subjects.forEach(s => {
                if (s && typeof s === "string" && s.trim()) subjectsSet.add(s.trim());
            });
        } else if (typeof data.subjects === "string") {
            data.subjects.split(",").forEach(s => {
                if (s && s.trim()) subjectsSet.add(s.trim());
            });
        }
        clean.subjects = Array.from(subjectsSet);

        // Optional Fields
        clean.gender = data.gender || 'unspecified';
        clean.email = typeof data.email === 'string' ? data.email.trim() : '';
        clean.qualification = typeof data.qualification === 'string' ? data.qualification.trim() : '';
        clean.experienceYears = data.experienceYears !== undefined && data.experienceYears !== null ? String(data.experienceYears).trim() : '0';
        
        // Status defaults to Active; managed dynamically by teacher itself
        clean.statusLabel = 'Active';
        clean.isAvailable = true;
        clean.sortOrder = typeof data.sortOrder === 'number' ? data.sortOrder : 10;
        clean.photo = data.photo || DEFAULT_AVATAR;

        return {
            isValid: errors.length === 0,
            errors,
            cleanData: clean
        };
    }

    // Add Teacher
    addTeacher(rawData) {
        const validation = this.validate(rawData);
        if (!validation.isValid) {
            return { success: false, errors: validation.errors };
        }

        const data = validation.cleanData;
        const currentYear = 2083;
        const id = `UT-${currentYear}-${Math.floor(1000 + Math.random() * 9000)}`;

        const newTeacher = {
            id,
            name: {
                first: data.firstName,
                middle: data.middleName,
                last: data.lastName
            },
            gender: data.gender,
            phone: data.phone,
            email: data.email || 'N/A',
            role: 'teacher',
            qualification: data.qualification,
            experienceYears: data.experienceYears,
            professionalTitle: data.professionalTitle,
            sortOrder: data.sortOrder,
            statusLabel: data.statusLabel,
            isAvailable: data.isAvailable,
            classTeacherOf: data.classTeacherOf,
            workload: data.workload,
            assignedClasses: data.assignedClasses,
            subjects: data.subjects,
            photo: data.photo,
            createdAt: Date.now()
        };

        this.teachers.push(newTeacher);
        this.teachers.sort((a, b) => (a.sortOrder || 10) - (b.sortOrder || 10));
        this.activeTeacherId = id;

        return { success: true, teacher: newTeacher };
    }

    // Update Teacher
    updateTeacher(id, rawData) {
        const index = this.teachers.findIndex(t => t.id === id);
        if (index === -1) {
            return { success: false, errors: ['Faculty member not found.'] };
        }

        const validation = this.validate(rawData, id);
        if (!validation.isValid) {
            return { success: false, errors: validation.errors };
        }

        const data = validation.cleanData;
        const existing = this.teachers[index];

        const updatedTeacher = {
            ...existing,
            name: {
                first: data.firstName,
                middle: data.middleName,
                last: data.lastName
            },
            gender: data.gender,
            phone: data.phone,
            email: data.email || existing.email,
            qualification: data.qualification,
            experienceYears: data.experienceYears,
            professionalTitle: data.professionalTitle,
            classTeacherOf: data.classTeacherOf,
            workload: data.workload,
            assignedClasses: data.assignedClasses,
            subjects: data.subjects,
            photo: data.photo || existing.photo,
            updatedAt: Date.now()
        };

        this.teachers[index] = updatedTeacher;
        this.teachers.sort((a, b) => (a.sortOrder || 10) - (b.sortOrder || 10));

        return { success: true, teacher: updatedTeacher };
    }

    // Remove Teacher
    removeTeacher(id) {
        if (!id) return false;
        const initialLen = this.teachers.length;
        this.teachers = this.teachers.filter(t => t.id !== id);
        if (this.activeTeacherId === id) {
            this.activeTeacherId = this.teachers.length > 0 ? this.teachers[0].id : null;
        }
        return this.teachers.length < initialLen;
    }

    // Subject Management per Class
    getSubjectsForClass(classId) {
        const cid = String(classId);
        if (this.classSubjects[cid] && this.classSubjects[cid].length > 0) {
            return this.classSubjects[cid];
        }
        return DEFAULT_CLASS_SUBJECTS[cid] || ['Mathematics', 'English', 'Nepali', 'Science'];
    }

    // Queries
    getTeacher(id) {
        return this.teachers.find(t => t.id === id) || null;
    }

    getFilteredTeachers(query = '') {
        const q = (query || this.filterQuery || '').toLowerCase().trim();
        if (!q) return this.teachers;
        return this.teachers.filter(t => {
            const fullName = `${t.name?.first || ''} ${t.name?.middle || ''} ${t.name?.last || ''}`.toLowerCase();
            const phone = (t.phone || '').toLowerCase();
            const title = (t.professionalTitle || '').toLowerCase();
            const subjects = Array.isArray(t.subjects) ? t.subjects.join(' ').toLowerCase() : '';
            return fullName.includes(q) || phone.includes(q) || title.includes(q) || subjects.includes(q);
        });
    }

    // Async Database Sync
    async loadFromDatabase() {
        try {
            if (typeof localStorage !== 'undefined') {
                const cached = localStorage.getItem('school_teachers_cache');
                if (cached) {
                    this.teachers = JSON.parse(cached);
                    if (this.teachers.length > 0 && !this.activeTeacherId) {
                        this.activeTeacherId = this.teachers[0].id;
                    }
                }
                const cachedSetup = localStorage.getItem('school_setup_assignments');
                if (cachedSetup) {
                    const parsed = JSON.parse(cachedSetup);
                    for (const [clsId, subs] of Object.entries(parsed)) {
                        if (Array.isArray(subs) && subs.length > 0) {
                            this.classSubjects[clsId] = subs.map(s => typeof s === 'object' ? s.name : s);
                        }
                    }
                }
            }
        } catch (_) {}

        try {
            if (typeof DatabaseService !== 'undefined' && DatabaseService && DatabaseService.getTeachers) {
                const dbTeachers = await DatabaseService.getTeachers();
                if (dbTeachers) {
                    this.teachers = Array.isArray(dbTeachers) ? dbTeachers : Object.values(dbTeachers);
                    this.teachers.sort((a, b) => (a.sortOrder || 10) - (b.sortOrder || 10));
                    if (this.teachers.length > 0 && !this.activeTeacherId) {
                        this.activeTeacherId = this.teachers[0].id;
                    }
                }
            }
            if (typeof DatabaseService !== 'undefined' && DatabaseService && DatabaseService.getClasses) {
                const dbClasses = await DatabaseService.getClasses();
                if (dbClasses && dbClasses.length > 0) {
                    this.classes = dbClasses;
                }
                for (const c of this.classes) {
                    const cfg = await DatabaseService.getClassConfigs(c.id);
                    if (cfg && cfg.subjects && cfg.subjects.compulsory) {
                        const subs = Object.values(cfg.subjects.compulsory).map(val => {
                            return typeof val === 'object' && val !== null ? val.name : val;
                        }).filter(Boolean);
                        if (subs.length > 0) {
                            this.classSubjects[String(c.id)] = subs;
                        }
                    }
                }
            }
        } catch (e) {
            console.warn("TeacherModule: using local defaults", e.message);
        }
    }

    async saveToDatabase() {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('school_teachers_cache', JSON.stringify(this.teachers));
            }
            if (typeof DatabaseService !== 'undefined' && DatabaseService && DatabaseService.saveTeacher) {
                for (const t of this.teachers) {
                    await DatabaseService.saveTeacher(t.id, t);
                    if (t.phone) {
                        await DatabaseService.saveLoginMapping(t.phone, {
                            id: t.id,
                            role: 'teacher',
                            phone: t.phone,
                            name: `${t.name?.first || ''} ${t.name?.last || ''}`.trim()
                        });
                    }
                }
            }
            return { success: true };
        } catch (e) {
            console.warn("TeacherModule: saved locally, remote offline:", e.message);
            return { success: true, localOnly: true, error: e.message };
        }
    }
}