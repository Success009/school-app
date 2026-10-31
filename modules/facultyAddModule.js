// modules/facultyAddModule.js - Isolated Faculty Onboarding Module (Zero Hardcoding)
import { DatabaseService } from './db.js';

export const DEFAULT_AVATAR = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2NiZDVlMSI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg==';

export class FacultyAddModule {
    constructor(options = {}) {
        // Zero hardcoded classes or subjects - strictly sourced from DB or options
        this.classes = options.classes || [];
        this.classSubjects = options.classSubjects || {};
        this.existingTeachers = options.existingTeachers || [];
    }

    // Dynamic Getters
    getClasses() {
        return this.classes;
    }

    getSubjectsForClass(classId) {
        const cid = String(classId);
        return this.classSubjects[cid] || [];
    }

    // Input Validation
    validate(data) {
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

        // Mobile Phone (10 digits)
        const rawPhone = String(data.phone || '').replace(/\D/g, '');
        if (!rawPhone || rawPhone.length !== 10) {
            errors.push('A valid 10-digit mobile number is required.');
        } else {
            // Check for duplicate in existing teachers
            const duplicate = this.existingTeachers.some(t => t.phone === rawPhone);
            if (duplicate) {
                errors.push('Mobile number already assigned to an existing faculty member.');
            }
        }
        clean.phone = rawPhone;

        // Professional Title
        clean.professionalTitle = typeof data.professionalTitle === 'string' && data.professionalTitle.trim() ? data.professionalTitle.trim() : 'Faculty Member';

        // Class Teacher Assignment ('unassigned' | 'none' | classId)
        if (data.classTeacherOf === 'none') {
            clean.classTeacherOf = 'none';
        } else if (data.classTeacherOf && data.classTeacherOf !== 'unassigned') {
            clean.classTeacherOf = String(data.classTeacherOf);
        } else {
            clean.classTeacherOf = 'unassigned';
        }

        // Workload: { [classId]: string[] of subject names }
        const workload = {};
        if (data.workload && typeof data.workload === 'object' && !Array.isArray(data.workload)) {
            for (const [clsId, subs] of Object.entries(data.workload)) {
                if (Array.isArray(subs) && subs.length > 0) {
                    workload[clsId] = [...new Set(subs.map(s => String(s).trim()).filter(Boolean))];
                }
            }
        }

        clean.workload = workload;
        clean.assignedClasses = Object.keys(workload);

        // Derive unique subjects
        const subjectsSet = new Set();
        Object.values(workload).forEach(subs => subs.forEach(s => subjectsSet.add(s)));
        if (Array.isArray(data.subjects)) {
            data.subjects.forEach(s => {
                if (s && typeof s === 'string' && s.trim()) subjectsSet.add(s.trim());
            });
        }
        clean.subjects = Array.from(subjectsSet);

                // Additional profile fields
        clean.gender = data.gender || 'unspecified';
        clean.email = typeof data.email === 'string' ? data.email.trim() : '';
        clean.qualification = typeof data.qualification === 'string' ? data.qualification.trim() : '';
        clean.experienceYears = data.experienceYears !== undefined && data.experienceYears !== null ? String(data.experienceYears).trim() : '0';
        
                // National ID & Verification Documents (Multiple Document Support)
        clean.nationalId = typeof data.nationalId === 'string' ? data.nationalId.trim() : '';

        const docs = [];
        if (Array.isArray(data.documents)) {
            data.documents.forEach((d, idx) => {
                if (d && typeof d === 'object' && d.url) {
                    docs.push({
                        id: d.id || `doc_${Date.now()}_${idx}`,
                        name: typeof d.name === 'string' ? d.name.trim() : 'Document',
                        type: typeof d.type === 'string' ? d.type.trim() : 'General',
                        url: String(d.url).trim(),
                        size: d.size || null,
                        uploadedAt: d.uploadedAt || Date.now()
                    });
                }
            });
        }
        if (docs.length === 0 && data.verificationDoc && typeof data.verificationDoc === 'string' && data.verificationDoc.trim()) {
            docs.push({
                id: `doc_${Date.now()}_0`,
                name: 'Verification Document',
                type: 'National ID / Certificate',
                url: data.verificationDoc.trim(),
                uploadedAt: Date.now()
            });
        }
        clean.documents = docs;
        clean.verificationDoc = docs.length > 0 ? docs[0].url : null;
        clean.verificationStatus = data.verificationStatus || (clean.nationalId || docs.length > 0 ? 'verified' : 'pending_review');

        // System defaults (Availability is managed strictly by the faculty member later)
        clean.statusLabel = 'Active';
        clean.isAvailable = true;
        clean.sortOrder = 10;
        clean.photo = data.photo || DEFAULT_AVATAR;

        return {
            isValid: errors.length === 0,
            errors,
            cleanData: clean
        };
    }

    // Register Single Faculty Member
    async registerTeacher(rawData) {
        const validation = this.validate(rawData);
        if (!validation.isValid) {
            return { success: false, errors: validation.errors };
        }

        const data = validation.cleanData;
        const currentYear = 2083;
        const teacherId = `UT-${currentYear}-${Math.floor(1000 + Math.random() * 9000)}`;

        const teacherRecord = {
            id: teacherId,
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
            nationalId: data.nationalId,
            documents: data.documents,
            verificationDoc: data.verificationDoc,
            verificationStatus: data.verificationStatus,
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

        const loginMapping = {
            id: teacherId,
            role: 'teacher',
            phone: data.phone,
            name: `${data.firstName} ${data.lastName}`.trim()
        };

        // Persist directly to database
        if (typeof DatabaseService !== 'undefined' && DatabaseService && DatabaseService.saveTeacher) {
            await DatabaseService.saveTeacher(teacherId, teacherRecord);
            await DatabaseService.saveLoginMapping(data.phone, loginMapping);
        }

        // Add to in-memory existing list to prevent duplicates
        this.existingTeachers.push(teacherRecord);

        // Update local cache
        try {
            if (typeof localStorage !== 'undefined') {
                const cached = localStorage.getItem('school_teachers_cache');
                const list = cached ? JSON.parse(cached) : [];
                list.push(teacherRecord);
                localStorage.setItem('school_teachers_cache', JSON.stringify(list));
            }
        } catch (_) {}

        return { success: true, teacher: teacherRecord };
    }

    // Load Classes, Subjects, and Existing Roster from Database
    async loadFromDatabase() {
        this.classes = [];
        this.classSubjects = {};

        try {
            // 1. Load Classes from DB
            if (typeof DatabaseService !== 'undefined' && DatabaseService && DatabaseService.getClasses) {
                const dbClasses = await DatabaseService.getClasses();
                if (dbClasses && Array.isArray(dbClasses)) {
                    this.classes = dbClasses.sort((a, b) => (a.order || 0) - (b.order || 0));
                }

                // 2. Load Subjects for each class from DB
                for (const c of this.classes) {
                    const cfg = await DatabaseService.getClassConfigs(c.id);
                    if (cfg && cfg.subjects && cfg.subjects.compulsory) {
                        const subs = Object.values(cfg.subjects.compulsory).map(val => {
                            return typeof val === 'object' && val !== null ? val.name : val;
                        }).filter(Boolean);
                        this.classSubjects[String(c.id)] = subs;
                    } else {
                        this.classSubjects[String(c.id)] = [];
                    }
                }

                // 3. Load Existing Teachers for Duplicate Mobile Detection
                const dbTeachers = await DatabaseService.getTeachers();
                if (dbTeachers) {
                    this.existingTeachers = Array.isArray(dbTeachers) ? dbTeachers : Object.values(dbTeachers);
                }
            }
        } catch (e) {
            console.warn("FacultyAddModule: Database load exception:", e.message);
        }
    }
}