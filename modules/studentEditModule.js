// modules/studentEditModule.js - Student Record Editor Engine
// Pure ES module (Zero DOM Coupling) with strict input validation, security sanitization,
// class curriculum subject synchronization, and automated parent login mapping reconciliation.

import { DatabaseService } from './db.js';

export const DEFAULT_STUDENT_AVATAR = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2NiZDVlMSI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg==';

/**
 * StudentEditModule
 * 
 * ARCHITECTURAL SPECIFICATION:
 * 1. Zero DOM Coupling: Operates exclusively on pure data models, callable from any web,
 *    mobile, test runner, or worker execution context.
 * 2. Security First: Sanitizes all free-text fields to neutralize script injection (XSS),
 *    validates URL protocols for attached documents, and strictly enforces 10-digit mobile formats.
 * 3. Atomic Login Mapping Synchronization: When a parent's phone number is updated or replaced,
 *    this engine removes the obsolete phone entry from `school/login_mappings` and registers the
 *    new phone entry to prevent orphan sessions and maintain SMS OTP login authorization.
 * 4. Dynamic Curriculum Alignment: When a student's grade/class is changed (e.g. promotion),
 *    assigned curriculum subjects are automatically recalculated from live class metadata.
 */
export class StudentEditModule {
    /**
     * @param {Object} options
     * @param {Array} options.classes Preloaded class definitions
     * @param {Object} options.classSubjects Map of classId -> subjects array
     * @param {Array} options.existingStudents Preloaded student list
     */
    constructor(options = {}) {
        this.classes = options.classes || [];
        this.classSubjects = options.classSubjects || {};
        this.existingStudents = options.existingStudents || [];
        this.activeStudent = null;
    }

    // ==========================================
    // 1. DYNAMIC DATABASE LOADER
    // ==========================================

    /**
     * Dynamically loads class schema and student records from the database.
     * Guarantees zero hardcoded class levels or subjects.
     */
    async loadFromDatabase(targetStudentId = null) {
        this.classes = [];
        this.classSubjects = {};

        if (typeof DatabaseService !== 'undefined' && DatabaseService) {
            // Load classes and their configured curriculum subjects
            if (DatabaseService.getClasses) {
                try {
                    const clsList = await DatabaseService.getClasses();
                    if (Array.isArray(clsList)) {
                                                this.classes = clsList.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
                        for (const c of this.classes) {
                            const cid = String(c.id);
                            if (DatabaseService.getClassConfigs) {
                                try {
                                    const cfg = await DatabaseService.getClassConfigs(c.id);
                                    if (cfg && cfg.subjects) {
                                        const subs = [];
                                        if (cfg.subjects.compulsory) {
                                            subs.push(...Object.values(cfg.subjects.compulsory).map(val => typeof val === 'object' && val !== null ? val.name : val).filter(Boolean));
                                        }
                                        if (cfg.subjects.optional) {
                                            subs.push(...Object.values(cfg.subjects.optional).map(val => typeof val === 'object' && val !== null ? val.name : val).filter(Boolean));
                                        }
                                        this.classSubjects[cid] = subs;
                                    } else {
                                        this.classSubjects[cid] = Array.isArray(c.subjects) ? c.subjects : [];
                                    }
                                } catch (_) {
                                    this.classSubjects[cid] = Array.isArray(c.subjects) ? c.subjects : [];
                                }
                            } else {
                                this.classSubjects[cid] = Array.isArray(c.subjects) ? c.subjects : [];
                            }
                        }
                    }
                } catch (e) {
                    console.warn('[StudentEditModule] Could not load classes from DB:', e.message);
                }
            }

            // Load existing students roster
            if (DatabaseService.getStudents) {
                try {
                    const stdList = await DatabaseService.getStudents();
                    if (Array.isArray(stdList)) {
                        this.existingStudents = stdList;
                    }
                } catch (e) {
                    console.warn('[StudentEditModule] Could not load students from DB:', e.message);
                }
            }

            // If a specific student ID was requested, fetch directly
            if (targetStudentId) {
                await this.loadStudent(targetStudentId);
            }
        }
    }

    /**
     * Retrieves a student by unique ID, cloning the record to ensure immutability
     * until edits are validated and committed.
     * 
     * @param {string} studentId
     * @returns {Object|null}
     */
    async loadStudent(studentId) {
        if (!studentId) return null;
        const sid = String(studentId).trim();

        // Check local list first
        let found = this.existingStudents.find(s => String(s.id) === sid);

        // Fallback to direct database query
        if (!found && typeof DatabaseService !== 'undefined' && DatabaseService?.getStudent) {
            try {
                const dbRecord = await DatabaseService.getStudent(sid);
                if (dbRecord) {
                    found = { id: sid, ...dbRecord };
                }
            } catch (err) {
                console.warn(`[StudentEditModule] Failed to fetch student ${sid}:`, err.message);
            }
        }

        if (found) {
            // Deep clone to prevent unintended reference mutations
            this.activeStudent = JSON.parse(JSON.stringify(found));
            return this.activeStudent;
        }

        return null;
    }

    // ==========================================
    // 2. GETTERS & CALENDAR HELPERS
    // ==========================================

    getClasses() {
        return this.classes;
    }

    getSubjectsForClass(classId) {
        const cid = String(classId);
        return this.classSubjects[cid] || [];
    }

    getActiveStudent() {
        return this.activeStudent;
    }

    /**
     * Calculates pupil age based on Bikram Sambat (BS) birth year (YYYY-MM-DD).
     * 
     * @param {string} bsDateStr - e.g., '2074-05-12'
     * @returns {string} - Computed age in years, or empty string if invalid
     */
    static calculateAgeFromBS(bsDateStr) {
        if (!bsDateStr || typeof bsDateStr !== 'string') return '';
        const parts = bsDateStr.split('-');
        if (parts.length < 1) return '';
        const birthYear = parseInt(parts[0], 10);
        if (isNaN(birthYear) || birthYear < 2000 || birthYear > 2150) return '';
        const currentBSYear = 2083; // Baseline school academic BS year
        const age = currentBSYear - birthYear;
        return age >= 0 && age <= 40 ? String(age) : '';
    }

    /**
     * Sanitizes raw text to neutralize script tags, HTML entities, and control characters.
     * 
     * @param {string} val
     * @returns {string}
     */
    static sanitize(val) {
        if (typeof val !== 'string') return '';
        return val
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .trim();
    }

    /**
     * Normalizes and parses comma-delimited parent phone numbers into clean 10-digit strings.
     * Strips leading '+977' or '977' prefixes and non-digit characters.
     * 
     * @param {string|Array} input
     * @returns {Array<string>} Array of valid 10-digit mobile strings
     */
    static extractPhoneList(input) {
        if (!input) return [];
        const rawArr = Array.isArray(input) ? input : String(input).split(',');
        return rawArr
            .map(p => {
                let digits = String(p).trim().replace(/\D/g, '');
                if (digits.length > 10 && digits.startsWith('977')) {
                    digits = digits.slice(3);
                }
                return digits;
            })
            .filter(digits => digits.length === 10);
    }

    // ==========================================
    // 3. EDIT VALIDATION & SANITIZATION
    // ==========================================

    /**
     * Comprehensive validator for student updates.
     * 
     * @param {string} studentId - Canonical Student ID
     * @param {Object} updates - Updated field inputs
     * @param {Object} [originalRecord] - Existing record for diffing
     * @returns {{ isValid: boolean, errors: string[], cleanData: Object }}
     */
    validate(studentId, updates, originalRecord = null) {
        const errors = [];
        const clean = {};
        const base = originalRecord || this.activeStudent || {};

        if (!studentId || typeof studentId !== 'string') {
            errors.push('A valid Student ID is required to perform an update.');
        }
        clean.id = String(studentId).trim();

        // 1. Name Validation (First Name & Last Name required)
        const rawFirst = updates.firstName ?? (updates.name && updates.name.first) ?? (base.name && base.name.first) ?? '';
        const rawMiddle = updates.middleName ?? (updates.name && updates.name.middle) ?? (base.name && base.name.middle) ?? '';
        const rawLast = updates.lastName ?? (updates.name && updates.name.last) ?? (base.name && base.name.last) ?? '';

        const cleanFirst = StudentEditModule.sanitize(String(rawFirst));
        const cleanMiddle = StudentEditModule.sanitize(String(rawMiddle));
        const cleanLast = StudentEditModule.sanitize(String(rawLast));

        if (!cleanFirst) errors.push('First name is required.');
        if (!cleanLast) errors.push('Last name is required.');

        clean.name = {
            first: cleanFirst,
            middle: cleanMiddle,
            last: cleanLast
        };

        // 2. Class Verification
        const rawClass = String(updates.class ?? base.class ?? '').trim();
        if (!rawClass) {
            errors.push('Class allocation is required.');
        } else if (this.classes.length > 0) {
            const classExists = this.classes.some(c => String(c.id) === rawClass || String(c.name) === rawClass);
            if (!classExists) {
                errors.push(`Class "${rawClass}" does not exist in school records.`);
            }
        }
        clean.class = rawClass;
        clean.section = 'General';

        // 3. Roll Number (Retained as internal metadata)
        clean.roll = updates.roll !== undefined ? String(updates.roll).trim() : (base.roll || '01');

        // 4. Gender & Demographics
        const genderVal = String(updates.gender ?? base.gender ?? 'unspecified').toLowerCase().trim();
        clean.gender = ['male', 'female', 'other'].includes(genderVal) ? genderVal : 'unspecified';

        // 5. Date of Birth & Age Computation
        clean.dob = typeof updates.dob === 'string' ? updates.dob.trim() : (base.dob || '');
        if (updates.age !== undefined && String(updates.age).trim()) {
            clean.age = String(updates.age).trim();
        } else if (clean.dob) {
            clean.age = StudentEditModule.calculateAgeFromBS(clean.dob) || base.age || 'N/A';
        } else {
            clean.age = base.age || 'N/A';
        }

        // 6. Blood Group
        clean.bloodGroup = updates.bloodGroup ? String(updates.bloodGroup).trim() : (base.bloodGroup || 'Unknown');

        // 7. Family Details
        clean.fatherName = StudentEditModule.sanitize(String(updates.fatherName ?? base.fatherName ?? 'N/A'));
        clean.motherName = StudentEditModule.sanitize(String(updates.motherName ?? base.motherName ?? 'N/A'));
        clean.parentEmail = StudentEditModule.sanitize(String(updates.parentEmail ?? base.parentEmail ?? 'N/A'));

        // 8. Parent Phone Numbers (Security: Required for SMS OTP Login)
        const phoneInput = updates.phone ?? updates.parentPhone ?? base.phone ?? '';
        const phoneList = StudentEditModule.extractPhoneList(phoneInput);

        if (phoneList.length === 0) {
            errors.push('At least one valid 10-digit parent mobile number is required for authentication.');
        }
        clean.phones = phoneList;
        clean.phone = phoneList.join(', ');

        // 9. Addresses
        const currBase = (base.address && base.address.current) || {};
        const permBase = (base.address && base.address.permanent) || {};
        const currIn = (updates.address && updates.address.current) || updates.currentAddress || currBase;
        const permIn = (updates.address && updates.address.permanent) || updates.permanentAddress || permBase;

        clean.address = {
            current: {
                street: StudentEditModule.sanitize(String(currIn.street ?? '')),
                city: StudentEditModule.sanitize(String(currIn.city ?? '')),
                district: StudentEditModule.sanitize(String(currIn.district ?? ''))
            },
            permanent: {
                street: StudentEditModule.sanitize(String(permIn.street ?? currIn.street ?? '')),
                city: StudentEditModule.sanitize(String(permIn.city ?? currIn.city ?? '')),
                district: StudentEditModule.sanitize(String(permIn.district ?? currIn.district ?? ''))
            }
        };

        // 10. Photo Avatar
        clean.photo = updates.photo || base.photo || DEFAULT_STUDENT_AVATAR;

        // 11. Attached Documents Roster
        const rawDocs = Array.isArray(updates.documents) ? updates.documents : (Array.isArray(base.documents) ? base.documents : []);
        const sanitizedDocs = [];

        rawDocs.forEach((d, idx) => {
            if (d && typeof d === 'object' && d.url) {
                const url = String(d.url).trim();
                // Block insecure or malicious pseudo-protocols
                if (url.startsWith('javascript:') || url.startsWith('data:text/html')) {
                    errors.push(`Document "${d.name || idx}" contains an insecure URL protocol.`);
                    return;
                }

                sanitizedDocs.push({
                    id: d.id || `doc_${Date.now()}_${idx}`,
                    name: StudentEditModule.sanitize(String(d.name || d.type || 'Document')),
                    type: StudentEditModule.sanitize(String(d.type || 'Official Record')),
                    url: url,
                    size: d.size || null,
                    uploadedAt: d.uploadedAt || Date.now()
                });
            }
        });
        clean.documents = sanitizedDocs;

        // Legacy compatibility mappings
        const birthDoc = sanitizedDocs.find(d => d.type.toLowerCase().includes('birth'));
        const transferDoc = sanitizedDocs.find(d => d.type.toLowerCase().includes('transfer') || d.type.toLowerCase().includes('marksheet'));
        clean.birthCertificate = birthDoc ? birthDoc.url : (updates.birthCertificate || base.birthCertificate || 'N/A');
        clean.transferCertificate = transferDoc ? transferDoc.url : (updates.transferCertificate || base.transferCertificate || 'N/A');

        // 12. Dynamic Curriculum Subjects
        // If class changed or subjects provided, synchronize with class catalog
        const classChanged = String(clean.class) !== String(base.class);
        let subjects = Array.isArray(updates.subjects) ? updates.subjects : [];

        if (subjects.length === 0 || classChanged) {
            subjects = this.getSubjectsForClass(clean.class);
        }
        clean.academic = {
            subjects: subjects.map(s => StudentEditModule.sanitize(String(s))),
            session: updates.joinYear || base.joinYear || '2083'
        };

        // Retain original metadata
        clean.joinYear = updates.joinYear || base.joinYear || '2083';
        clean.status = updates.status || base.status || 'active';
        clean.createdAt = base.createdAt || Date.now();
        clean.updatedAt = Date.now();

        return {
            isValid: errors.length === 0,
            errors,
            cleanData: clean
        };
    }

    // ==========================================
    // 4. ATOMIC COMMIT & RECONCILIATION
    // ==========================================

    /**
     * Executes the update on an existing student record with atomic login mapping synchronization.
     * 
     * @param {string} studentId
     * @param {Object} updates
     * @returns {Promise<{ success: boolean, errors?: string[], student?: Object, loginMappingsChanged?: boolean }>}
     */
    async updateStudent(studentId, updates) {
        const sid = String(studentId).trim();
        const base = await this.loadStudent(sid);

        if (!base) {
            return {
                success: false,
                errors: [`Student record with ID "${sid}" could not be found.`]
            };
        }

        // Validate updates against current base record
        const validation = this.validate(sid, updates, base);
        if (!validation.isValid) {
            return {
                success: false,
                errors: validation.errors
            };
        }

        const clean = validation.cleanData;

        // Determine phone differences to synchronize school/login_mappings
        const oldPhones = StudentEditModule.extractPhoneList(base.phone);
        const newPhones = clean.phones;

        const removedPhones = oldPhones.filter(p => !newPhones.includes(p));
        const addedPhones = newPhones.filter(p => !oldPhones.includes(p));
        const loginMappingsChanged = removedPhones.length > 0 || addedPhones.length > 0;

        // Persist to DatabaseService
        if (typeof DatabaseService !== 'undefined' && DatabaseService) {
            // 1. Update Student Record
            if (DatabaseService.saveStudent) {
                await DatabaseService.saveStudent(sid, clean);
            } else if (DatabaseService.updateStudent) {
                await DatabaseService.updateStudent(sid, clean);
            }

            // 2. Revoke Obsolete Parent Login Mappings
            if (DatabaseService.removeLoginMapping) {
                for (const oldPhone of removedPhones) {
                    try {
                        await DatabaseService.removeLoginMapping(oldPhone);
                    } catch (e) {
                        console.warn(`[StudentEditModule] Could not revoke login mapping for ${oldPhone}:`, e.message);
                    }
                }
            }

            // 3. Register New Parent Login Mappings for SMS OTP Authorization
            if (DatabaseService.saveLoginMapping) {
                for (const newPhone of addedPhones) {
                    try {
                        await DatabaseService.saveLoginMapping(newPhone, {
                            studentId: sid,
                            role: 'parent'
                        });
                    } catch (e) {
                        console.warn(`[StudentEditModule] Could not save login mapping for ${newPhone}:`, e.message);
                    }
                }
            }
        }

        // 4. Update in-memory roster
        const existingIdx = this.existingStudents.findIndex(s => String(s.id) === sid);
        if (existingIdx !== -1) {
            this.existingStudents[existingIdx] = clean;
        } else {
            this.existingStudents.push(clean);
        }
        this.activeStudent = clean;

        // 5. Update local browser cache if available
        try {
            if (typeof localStorage !== 'undefined') {
                const cached = localStorage.getItem('school_students_cache');
                if (cached) {
                    const list = JSON.parse(cached);
                    const idx = list.findIndex(s => String(s.id) === sid);
                    if (idx !== -1) {
                        list[idx] = clean;
                    } else {
                        list.push(clean);
                    }
                    localStorage.setItem('school_students_cache', JSON.stringify(list));
                }
            }
        } catch (_) {}

        return {
            success: true,
            student: clean,
            loginMappingsChanged,
            addedPhones,
            removedPhones
        };
    }
}
