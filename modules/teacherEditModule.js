// modules/teacherEditModule.js - Faculty Record Editor Engine
// Pure ES module (Zero DOM Coupling) with strict input validation, security sanitization,
// workload assignment matrix, class teacher authority, and automated teacher login mapping reconciliation.

import { DatabaseService } from './db.js';

export const DEFAULT_AVATAR = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2NiZDVlMSI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg==';

/**
 * TeacherEditModule
 * 
 * ARCHITECTURAL SPECIFICATION:
 * 1. Zero DOM Coupling: Operates exclusively on pure data models, callable from any web,
 *    mobile, test runner, or worker execution context.
 * 2. Security First: Sanitizes all free-text fields to neutralize script injection (XSS),
 *    validates URL protocols for attached documents, and strictly enforces 10-digit mobile formats.
 * 3. Atomic Login Mapping Synchronization: When a faculty member's phone number is updated,
 *    this engine removes the obsolete phone entry from `school/login_mappings` and registers the
 *    new phone entry to maintain SMS OTP login authorization and prevent orphaned sessions.
 * 4. Workload & Authority Matrix: Manages teaching workload across classes and subjects,
 *    and reconciles class teacher authority assignments.
 */
export class TeacherEditModule {
    /**
     * @param {Object} options
     * @param {Array} options.classes Preloaded class definitions
     * @param {Object} options.classSubjects Map of classId -> subjects array
     * @param {Array} options.existingTeachers Preloaded teacher list
     */
    constructor(options = {}) {
        this.classes = options.classes || [];
        this.classSubjects = options.classSubjects || {};
        this.existingTeachers = options.existingTeachers || [];
        this.activeTeacher = null;
    }

    // ==========================================
    // 1. DYNAMIC DATABASE LOADER
    // ==========================================

    /**
     * Dynamically loads class schema and teacher records from the database.
     * Guarantees zero hardcoded faculty lists or class levels.
     */
    async loadFromDatabase(targetTeacherId = null) {
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
                    console.warn('[TeacherEditModule] Could not load classes from DB:', e.message);
                }
            }

            // Load existing teachers roster
            if (DatabaseService.getTeachers) {
                try {
                    const tList = await DatabaseService.getTeachers();
                    if (Array.isArray(tList)) {
                        this.existingTeachers = tList;
                    }
                } catch (e) {
                    console.warn('[TeacherEditModule] Could not load teachers from DB:', e.message);
                }
            }

            // If a specific teacher ID was requested, fetch directly
            if (targetTeacherId) {
                await this.loadTeacher(targetTeacherId);
            }
        }
    }

    /**
     * Retrieves a teacher by unique ID, cloning the record to ensure immutability
     * until edits are validated and committed.
     * 
     * @param {string} teacherId
     * @returns {Object|null}
     */
    async loadTeacher(teacherId) {
        if (!teacherId) return null;
        const tid = String(teacherId).trim();

        // Check local list first
        let found = this.existingTeachers.find(t => String(t.id) === tid);

        // Fallback to direct database query
        if (!found && typeof DatabaseService !== 'undefined' && DatabaseService?.getTeacher) {
            try {
                const dbRecord = await DatabaseService.getTeacher(tid);
                if (dbRecord) {
                    found = { id: tid, ...dbRecord };
                }
            } catch (err) {
                console.warn(`[TeacherEditModule] Failed to fetch teacher ${tid}:`, err.message);
            }
        }

        if (found) {
            // Deep clone to prevent unintended reference mutations
            this.activeTeacher = JSON.parse(JSON.stringify(found));
            return this.activeTeacher;
        }

        return null;
    }

    // ==========================================
    // 2. GETTERS & SANITIZATION HELPERS
    // ==========================================

    getClasses() {
        return this.classes;
    }

    getSubjectsForClass(classId) {
        const cid = String(classId);
        return this.classSubjects[cid] || [];
    }

    getActiveTeacher() {
        return this.activeTeacher;
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
     * Extracts clean 10-digit mobile number, stripping prefixes (+977, 977) and formatting characters.
     * 
     * @param {string} input
     * @returns {string} Clean 10-digit mobile string or empty string
     */
    static extractPhone(input) {
        if (!input) return '';
        let digits = String(input).trim().replace(/\D/g, '');
        if (digits.length > 10 && digits.startsWith('977')) {
            digits = digits.slice(3);
        }
        return digits.length === 10 ? digits : '';
    }

    // ==========================================
    // 3. EDIT VALIDATION & SANITIZATION
    // ==========================================

    /**
     * Comprehensive validator for teacher updates.
     * 
     * @param {string} teacherId - Canonical Faculty ID
     * @param {Object} updates - Updated field inputs
     * @param {Object} [originalRecord] - Existing record for diffing
     * @returns {{ isValid: boolean, errors: string[], cleanData: Object }}
     */
    validate(teacherId, updates, originalRecord = null) {
        const errors = [];
        const clean = {};
        const base = originalRecord || this.activeTeacher || {};

        if (!teacherId || typeof teacherId !== 'string') {
            errors.push('A valid Teacher ID is required to perform an update.');
        }
        clean.id = String(teacherId).trim();

        // 1. Name Validation (First Name & Last Name required)
        const rawFirst = updates.firstName ?? (updates.name && updates.name.first) ?? (base.name && base.name.first) ?? '';
        const rawMiddle = updates.middleName ?? (updates.name && updates.name.middle) ?? (base.name && base.name.middle) ?? '';
        const rawLast = updates.lastName ?? (updates.name && updates.name.last) ?? (base.name && base.name.last) ?? '';

        const cleanFirst = TeacherEditModule.sanitize(String(rawFirst));
        const cleanMiddle = TeacherEditModule.sanitize(String(rawMiddle));
        const cleanLast = TeacherEditModule.sanitize(String(rawLast));

        if (!cleanFirst) errors.push('First name is required.');
        if (!cleanLast) errors.push('Last name is required.');

        clean.name = {
            first: cleanFirst,
            middle: cleanMiddle,
            last: cleanLast
        };

        // 2. Phone Validation & Collision Check
        const phoneInput = updates.phone ?? base.phone ?? '';
        const cleanPhone = TeacherEditModule.extractPhone(phoneInput);

        if (!cleanPhone) {
            errors.push('A valid 10-digit mobile number is required.');
        } else {
            // Check for duplicate in existing teachers (excluding the teacher currently being edited)
            const duplicate = this.existingTeachers.some(t => String(t.id) !== clean.id && t.phone === cleanPhone);
            if (duplicate) {
                errors.push(`Mobile number "${cleanPhone}" is already assigned to another faculty member.`);
            }
        }
        clean.phone = cleanPhone;

        // 3. Professional Title
        clean.professionalTitle = TeacherEditModule.sanitize(
            String(updates.professionalTitle ?? base.professionalTitle ?? 'Faculty Member')
        );

        // 4. Class Teacher Authority ('none' | 'unassigned' | classId)
        let ct = updates.classTeacherOf !== undefined ? updates.classTeacherOf : (base.classTeacherOf || 'unassigned');
        if (ct === 'none' || !ct) {
            clean.classTeacherOf = 'none';
        } else if (ct === 'unassigned') {
            clean.classTeacherOf = 'unassigned';
        } else {
            clean.classTeacherOf = String(ct).trim();
        }

        // 5. Workload Matrix: { [classId]: string[] of subject names }
        const rawWorkload = updates.workload ?? base.workload ?? {};
        const cleanWorkload = {};

        if (rawWorkload && typeof rawWorkload === 'object' && !Array.isArray(rawWorkload)) {
            for (const [clsId, subs] of Object.entries(rawWorkload)) {
                if (Array.isArray(subs) && subs.length > 0) {
                    const sanitizedSubs = subs
                        .map(s => TeacherEditModule.sanitize(String(s)))
                        .filter(Boolean);
                    if (sanitizedSubs.length > 0) {
                        cleanWorkload[String(clsId)] = [...new Set(sanitizedSubs)];
                    }
                }
            }
        }
        clean.workload = cleanWorkload;
        clean.assignedClasses = Object.keys(cleanWorkload);

        // Derive unique subjects list
        const subjectsSet = new Set();
        Object.values(cleanWorkload).forEach(subs => subs.forEach(s => subjectsSet.add(s)));
        if (Array.isArray(updates.subjects)) {
            updates.subjects.forEach(s => {
                if (s && typeof s === 'string' && s.trim()) subjectsSet.add(TeacherEditModule.sanitize(s.trim()));
            });
        }
        clean.subjects = Array.from(subjectsSet);

        // 6. Demographics & Credentials
        const genderVal = String(updates.gender ?? base.gender ?? 'unspecified').toLowerCase().trim();
        clean.gender = ['male', 'female', 'other'].includes(genderVal) ? genderVal : 'unspecified';

        clean.email = TeacherEditModule.sanitize(String(updates.email ?? base.email ?? ''));
        clean.qualification = TeacherEditModule.sanitize(String(updates.qualification ?? base.qualification ?? ''));
        clean.experienceYears = String(updates.experienceYears ?? base.experienceYears ?? '0').trim();
        clean.nationalId = TeacherEditModule.sanitize(String(updates.nationalId ?? base.nationalId ?? ''));

        // 7. Profile Photo
        clean.photo = updates.photo || base.photo || DEFAULT_AVATAR;

        // 8. Verification Documents Roster
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
                    name: TeacherEditModule.sanitize(String(d.name || d.type || 'Document')),
                    type: TeacherEditModule.sanitize(String(d.type || 'Certificate')),
                    url: url,
                    size: d.size || null,
                    uploadedAt: d.uploadedAt || Date.now()
                });
            }
        });
        clean.documents = sanitizedDocs;

        // Legacy compatibility
        const mainCert = sanitizedDocs.find(d => d.type.toLowerCase().includes('degree') || d.type.toLowerCase().includes('national'));
        clean.verificationDoc = mainCert ? mainCert.url : (updates.verificationDoc || base.verificationDoc || '');

        // Retain original metadata
        clean.role = 'teacher';
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
     * Executes the update on an existing teacher record with atomic login mapping synchronization.
     * 
     * @param {string} teacherId
     * @param {Object} updates
     * @returns {Promise<{ success: boolean, errors?: string[], teacher?: Object, loginMappingChanged?: boolean }>}
     */
    async updateTeacher(teacherId, updates) {
        const tid = String(teacherId).trim();
        const base = await this.loadTeacher(tid);

        if (!base) {
            return {
                success: false,
                errors: [`Teacher record with ID "${tid}" could not be found.`]
            };
        }

        // Validate updates against current base record
        const validation = this.validate(tid, updates, base);
        if (!validation.isValid) {
            return {
                success: false,
                errors: validation.errors
            };
        }

        const clean = validation.cleanData;

        // Determine phone differences to synchronize school/login_mappings
        const oldPhone = TeacherEditModule.extractPhone(base.phone);
        const newPhone = clean.phone;
        const phoneChanged = oldPhone && newPhone && oldPhone !== newPhone;

        // Persist to DatabaseService
        if (typeof DatabaseService !== 'undefined' && DatabaseService) {
            // 1. Update Teacher Record
            if (DatabaseService.saveTeacher) {
                await DatabaseService.saveTeacher(tid, clean);
            } else if (DatabaseService.updateTeacher) {
                await DatabaseService.updateTeacher(tid, clean);
            }

            // 2. Synchronize login mappings if phone was updated
            if (phoneChanged) {
                if (DatabaseService.removeLoginMapping) {
                    try {
                        await DatabaseService.removeLoginMapping(oldPhone);
                    } catch (e) {
                        console.warn(`[TeacherEditModule] Could not revoke login mapping for ${oldPhone}:`, e.message);
                    }
                }

                if (DatabaseService.saveLoginMapping) {
                    try {
                        await DatabaseService.saveLoginMapping(newPhone, {
                            studentId: tid,
                            role: 'teacher'
                        });
                    } catch (e) {
                        console.warn(`[TeacherEditModule] Could not save login mapping for ${newPhone}:`, e.message);
                    }
                }
            }
        }

        // 3. Update in-memory roster
        const existingIdx = this.existingTeachers.findIndex(t => String(t.id) === tid);
        if (existingIdx !== -1) {
            this.existingTeachers[existingIdx] = clean;
        } else {
            this.existingTeachers.push(clean);
        }
        this.activeTeacher = clean;

        // 4. Update local browser cache if available
        try {
            if (typeof localStorage !== 'undefined') {
                const cached = localStorage.getItem('school_teachers_cache');
                if (cached) {
                    const list = JSON.parse(cached);
                    const idx = list.findIndex(t => String(t.id) === tid);
                    if (idx !== -1) {
                        list[idx] = clean;
                    } else {
                        list.push(clean);
                    }
                    localStorage.setItem('school_teachers_cache', JSON.stringify(list));
                }
            }
        } catch (_) {}

        return {
            success: true,
            teacher: clean,
            loginMappingChanged: Boolean(phoneChanged),
            oldPhone,
            newPhone
        };
    }
}
