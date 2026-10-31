// modules/studentAddModule.js - Isolated Student Onboarding Module (Zero Hardcoding)
import { DatabaseService } from './db.js';

export const DEFAULT_STUDENT_AVATAR = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2NiZDVlMSI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg==';

export class StudentAddModule {
    constructor(options = {}) {
        // Zero hardcoded classes or subjects - strictly sourced from DB or options
        this.classes = options.classes || [];
        this.classSubjects = options.classSubjects || {};
        this.existingStudents = options.existingStudents || [];
    }

    // Dynamic Getters
    getClasses() {
        return this.classes;
    }

    getSubjectsForClass(classId) {
        const cid = String(classId);
        return this.classSubjects[cid] || [];
    }

    getNextRollNumber(classId) {
        const cid = String(classId);
        const inClass = this.existingStudents.filter(s => String(s.class) === cid);
        return String(inClass.length + 1).padStart(2, '0');
    }

    // Calculate Age from BS Date (YYYY-MM-DD)
    static calculateAgeFromBS(bsDateStr) {
        if (!bsDateStr || typeof bsDateStr !== 'string') return '';
        const parts = bsDateStr.split('-');
        if (parts.length < 1) return '';
        const birthYear = parseInt(parts[0], 10);
        if (isNaN(birthYear) || birthYear < 2000 || birthYear > 2150) return '';
        const currentBSYear = 2083; // Standard school BS calendar baseline
        const age = currentBSYear - birthYear;
        return age >= 0 && age <= 40 ? String(age) : '';
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

        // Class Selection
        const rawClass = String(data.class || '').trim();
        if (!rawClass) {
            errors.push('Class selection is required.');
        } else {
            // If classes are loaded, verify class exists
            if (this.classes.length > 0) {
                const match = this.classes.some(c => String(c.id) === rawClass || String(c.name) === rawClass);
                if (!match) {
                    errors.push(`Class "${rawClass}" is not a recognized school class.`);
                }
            }
        }
        clean.class = rawClass;

        // Section (strictly "General" per small school operational rules)
        clean.section = 'General';

        // Roll Number
        clean.roll = typeof data.roll === 'string' && data.roll.trim() ? data.roll.trim() : this.getNextRollNumber(clean.class);

        // Gender
        clean.gender = data.gender || 'unspecified';

        // Date of Birth & Age
        clean.dob = typeof data.dob === 'string' ? data.dob.trim() : '';
        clean.age = data.age ? String(data.age).trim() : (StudentAddModule.calculateAgeFromBS(clean.dob) || 'N/A');

        // Blood Group
        clean.bloodGroup = data.bloodGroup || 'Unknown';

                // Family Details
        clean.fatherName = (typeof data.fatherName === 'string' && data.fatherName.trim()) ? data.fatherName.trim() : 'N/A';
        clean.motherName = (typeof data.motherName === 'string' && data.motherName.trim()) ? data.motherName.trim() : 'N/A';
        clean.parentEmail = (typeof data.parentEmail === 'string' && data.parentEmail.trim()) ? data.parentEmail.trim() : 'N/A';

                // Parent Phones (Support multiple comma-separated numbers)
        const rawPhoneInput = String(data.phone || data.parentPhone || '');
        const phoneList = rawPhoneInput
            .split(',')
            .map(p => {
                let digits = String(p).trim().replace(/\D/g, '');
                if (digits.length > 10 && digits.startsWith('977')) {
                    digits = digits.slice(3);
                }
                return digits;
            })
            .filter(p => p.length === 10);

        if (phoneList.length === 0) {
            errors.push('At least one valid 10-digit parent mobile number is required.');
        }
        clean.phones = phoneList;
        clean.phone = phoneList.join(', ');

        // Address Information
        const currAddr = (data.address && data.address.current) || data.currentAddress || {};
        const permAddr = (data.address && data.address.permanent) || data.permanentAddress || {};

        clean.address = {
            current: {
                street: typeof currAddr.street === 'string' ? currAddr.street.trim() : '',
                city: typeof currAddr.city === 'string' ? currAddr.city.trim() : '',
                district: typeof currAddr.district === 'string' ? currAddr.district.trim() : ''
            },
            permanent: {
                street: typeof permAddr.street === 'string' ? permAddr.street.trim() : (typeof currAddr.street === 'string' ? currAddr.street.trim() : ''),
                city: typeof permAddr.city === 'string' ? permAddr.city.trim() : (typeof currAddr.city === 'string' ? currAddr.city.trim() : ''),
                district: typeof permAddr.district === 'string' ? permAddr.district.trim() : (typeof currAddr.district === 'string' ? currAddr.district.trim() : '')
            }
        };

        // Join Year
        clean.joinYear = data.joinYear ? String(data.joinYear).trim() : '2083';

        // Profile Photo
        clean.photo = data.photo || DEFAULT_STUDENT_AVATAR;

        // Multiple Document Support
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
        // Backward compatibility for single birth / transfer certificates
        if (data.birthCertificate && typeof data.birthCertificate === 'string' && data.birthCertificate.trim() && data.birthCertificate !== 'N/A') {
            if (!docs.some(d => d.url === data.birthCertificate.trim())) {
                docs.push({
                    id: `doc_birth_${Date.now()}`,
                    name: 'Birth Certificate',
                    type: 'Birth Certificate',
                    url: data.birthCertificate.trim(),
                    uploadedAt: Date.now()
                });
            }
        }
        if (data.transferCertificate && typeof data.transferCertificate === 'string' && data.transferCertificate.trim() && data.transferCertificate !== 'N/A') {
            if (!docs.some(d => d.url === data.transferCertificate.trim())) {
                docs.push({
                    id: `doc_transfer_${Date.now()}`,
                    name: 'Transfer Certificate',
                    type: 'Transfer Certificate',
                    url: data.transferCertificate.trim(),
                    uploadedAt: Date.now()
                });
            }
        }

        clean.documents = docs;
        const birthDoc = docs.find(d => d.type === 'Birth Certificate');
        const transferDoc = docs.find(d => d.type === 'Transfer Certificate');
        clean.birthCertificate = birthDoc ? birthDoc.url : 'N/A';
        clean.transferCertificate = transferDoc ? transferDoc.url : 'N/A';

        // Dynamic Subjects Assignment
        const assignedSubjects = this.getSubjectsForClass(clean.class);
        clean.academic = {
            subjects: assignedSubjects,
            session: clean.joinYear
        };

        return {
            isValid: errors.length === 0,
            errors,
            cleanData: clean
        };
    }

    // Register Single Student
    async registerStudent(rawData) {
        const validation = this.validate(rawData);
        if (!validation.isValid) {
            return { success: false, errors: validation.errors };
        }

        const data = validation.cleanData;
        const randDigits = Math.floor(1000 + Math.random() * 9000);
        const studentId = `US-${data.joinYear}-${randDigits}`;

        const studentRecord = {
            id: studentId,
            name: {
                first: data.firstName,
                middle: data.middleName,
                last: data.lastName
            },
            gender: data.gender,
            dob: data.dob,
            age: data.age,
            bloodGroup: data.bloodGroup,
            class: data.class,
            section: data.section,
            roll: data.roll,
            joinYear: data.joinYear,
            fatherName: data.fatherName,
            motherName: data.motherName,
            phone: data.phone,
            parentEmail: data.parentEmail,
            address: data.address,
            photo: data.photo,
            birthCertificate: data.birthCertificate,
            transferCertificate: data.transferCertificate,
            documents: data.documents,
            academic: data.academic,
            status: 'active',
            createdAt: Date.now()
        };

        // 1. Persist Student Record into Database
        if (typeof DatabaseService !== 'undefined' && DatabaseService && DatabaseService.saveStudent) {
            await DatabaseService.saveStudent(studentId, studentRecord);

            // 2. Map Parent Phone(s) into school/login_mappings for SMS OTP Authentication
            for (const phone of data.phones) {
                await DatabaseService.saveLoginMapping(phone, {
                    studentId: studentId,
                    role: 'parent'
                });
            }
        }

        // 3. Update in-memory existing students roster
        this.existingStudents.push(studentRecord);

        // 4. Update local client cache if accessible
        try {
            if (typeof localStorage !== 'undefined') {
                const cached = localStorage.getItem('school_students_cache');
                const list = cached ? JSON.parse(cached) : [];
                list.push(studentRecord);
                localStorage.setItem('school_students_cache', JSON.stringify(list));
            }
        } catch (_) {}

        return { success: true, student: studentRecord, studentId };
    }

    // Load Classes, Subjects, and Existing Students from Database
    async loadFromDatabase() {
        this.classes = [];
        this.classSubjects = {};
        this.existingStudents = [];

        try {
            if (typeof DatabaseService !== 'undefined' && DatabaseService && DatabaseService.getClasses) {
                // 1. Load Classes
                const dbClasses = await DatabaseService.getClasses();
                if (dbClasses && Array.isArray(dbClasses)) {
                    this.classes = dbClasses.sort((a, b) => (a.order || 0) - (b.order || 0));
                }

                // 2. Load Subjects for each class
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

                // 3. Load Existing Students
                const dbStudents = await DatabaseService.getStudents();
                if (dbStudents) {
                    this.existingStudents = Array.isArray(dbStudents) ? dbStudents : Object.values(dbStudents);
                }
            }
        } catch (e) {
            console.warn("StudentAddModule: Database load exception:", e.message);
        }
    }
}
