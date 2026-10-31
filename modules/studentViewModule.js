// modules/studentViewModule.js - Student Directory & Roster Viewer (Zero DOM Coupling)
import { DatabaseService } from './db.js';

export const DEFAULT_STUDENT_AVATAR = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2NiZDVlMSI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg==';

export class StudentViewModule {
    constructor(options = {}) {
        this.classes = options.classes || [];
        this.students = options.students || [];
                this.selectedClassId = options.selectedClassId || 'all';
        this.searchQuery = options.searchQuery || '';
        this.sortBy = options.sortBy || 'id'; // Default to unique Student ID
    }

    // Dynamic Database Loader
    async loadFromDatabase() {
        if (typeof DatabaseService !== 'undefined' && DatabaseService) {
            try {
                if (DatabaseService.getClasses) {
                    const clsList = await DatabaseService.getClasses();
                    if (Array.isArray(clsList)) {
                        this.classes = clsList.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
                    }
                }
            } catch (e) {
                console.warn('Could not load classes in StudentViewModule:', e.message);
            }

            try {
                if (DatabaseService.getStudents) {
                    const stdList = await DatabaseService.getStudents();
                    if (Array.isArray(stdList)) {
                        this.students = stdList;
                    }
                }
            } catch (e) {
                console.warn('Could not load students in StudentViewModule:', e.message);
            }
        }
    }

    // Setters
    setSelectedClass(classId) {
        this.selectedClassId = String(classId || 'all');
        return this.selectedClassId;
    }

    setSearchQuery(query) {
        this.searchQuery = typeof query === 'string' ? query.trim().toLowerCase() : '';
        return this.searchQuery;
    }

    setSortBy(sortBy) {
        if (['roll', 'name', 'id'].includes(sortBy)) {
            this.sortBy = sortBy;
        }
        return this.sortBy;
    }

    // Getters
    getClasses() {
        return this.classes;
    }

    getSelectedClassId() {
        return this.selectedClassId;
    }

    getStudentById(id) {
        const student = this.students.find(s => s.id === id);
        return student ? this._formatStudent(student) : null;
    }

    // Count students per class
    getClassCounts() {
        const counts = { all: this.students.length };
        this.classes.forEach(c => {
            const cid = String(c.id);
            counts[cid] = this.students.filter(s => String(s.class) === cid).length;
        });
        return counts;
    }

    // Summary statistics for a given class or all classes
    getClassStatistics(classId = null) {
        const targetClass = classId !== null ? String(classId) : this.selectedClassId;
        const list = targetClass === 'all'
            ? this.students
            : this.students.filter(s => String(s.class) === targetClass);

        let maleCount = 0;
        let femaleCount = 0;
        let withDocsCount = 0;
        let withPhoneCount = 0;

        list.forEach(s => {
            const gender = (s.gender || '').toLowerCase();
            if (gender === 'male' || gender === 'm') maleCount++;
            else if (gender === 'female' || gender === 'f') femaleCount++;

            const docs = Array.isArray(s.documents) ? s.documents : [];
            const hasLegacyDocs = (s.birthCertificate && s.birthCertificate !== 'N/A') || (s.transferCertificate && s.transferCertificate !== 'N/A');
            if (docs.length > 0 || hasLegacyDocs) withDocsCount++;

            if (s.phone && s.phone.trim() && s.phone !== 'N/A') withPhoneCount++;
        });

        return {
            classId: targetClass,
            totalStudents: list.length,
            maleCount,
            femaleCount,
            otherGenderCount: list.length - (maleCount + femaleCount),
            withDocsCount,
            withPhoneCount
        };
    }

    // Filter and Sort Students
    getFilteredStudents(overrideFilters = {}) {
        const classFilter = overrideFilters.classId !== undefined ? String(overrideFilters.classId) : this.selectedClassId;
        const search = overrideFilters.query !== undefined
            ? String(overrideFilters.query).trim().toLowerCase()
            : this.searchQuery;
        const sort = overrideFilters.sortBy || this.sortBy;

        let result = this.students.slice();

        // 1. Filter by Class
        if (classFilter !== 'all') {
            result = result.filter(s => String(s.class) === classFilter);
        }

        // 2. Filter by Search Query
        if (search) {
            result = result.filter(s => {
                const nameObj = s.name || {};
                const fullName = typeof nameObj === 'object'
                    ? [nameObj.first, nameObj.middle, nameObj.last].filter(Boolean).join(' ').toLowerCase()
                    : String(nameObj).toLowerCase();

                const id = String(s.id || '').toLowerCase();
                const roll = String(s.roll || '').toLowerCase();
                const phone = String(s.phone || '').toLowerCase();
                const father = String(s.fatherName || '').toLowerCase();
                const mother = String(s.motherName || '').toLowerCase();

                return fullName.includes(search) ||
                    id.includes(search) ||
                    roll.includes(search) ||
                    phone.includes(search) ||
                    father.includes(search) ||
                    mother.includes(search);
            });
        }

        // 3. Sort (Default by unique Student ID)
        result.sort((a, b) => {
            if (sort === 'roll') {
                const rollA = parseInt(String(a.roll || '999').replace(/\D/g, ''), 10) || 999;
                const rollB = parseInt(String(b.roll || '999').replace(/\D/g, ''), 10) || 999;
                if (rollA !== rollB) return rollA - rollB;
            } else if (sort === 'name') {
                const nameA = this._getFullName(a).toLowerCase();
                const nameB = this._getFullName(b).toLowerCase();
                return nameA.localeCompare(nameB);
            }

            // Default: Sort by unique student ID
            return String(a.id || '').localeCompare(String(b.id || ''));
        });

        return result.map(s => this._formatStudent(s));
    }

    // Helper: Formats student for view presentation
    _formatStudent(s) {
        const fullName = this._getFullName(s);
        const docs = Array.isArray(s.documents) ? s.documents : [];
        if (s.birthCertificate && s.birthCertificate !== 'N/A' && !docs.some(d => d.url === s.birthCertificate)) {
            docs.push({ name: 'Birth Certificate', type: 'Birth Certificate', url: s.birthCertificate });
        }
        if (s.transferCertificate && s.transferCertificate !== 'N/A' && !docs.some(d => d.url === s.transferCertificate)) {
            docs.push({ name: 'Transfer Certificate', type: 'Transfer Certificate', url: s.transferCertificate });
        }

        const address = s.address || {};
        const currentAddr = address.current || {};
        const permAddr = address.permanent || {};

        return {
            id: s.id,
            fullName,
            firstName: (s.name && s.name.first) || '',
            middleName: (s.name && s.name.middle) || '',
            lastName: (s.name && s.name.last) || '',
            class: String(s.class || ''),
            className: `Class ${s.class || ''}`,
            roll: String(s.roll || '01').padStart(2, '0'),
            gender: s.gender || 'Unspecified',
            dob: s.dob || 'N/A',
            age: s.age ? `${s.age} yrs` : 'N/A',
            bloodGroup: s.bloodGroup || 'Unknown',
            phone: s.phone || 'N/A',
            fatherName: s.fatherName || 'N/A',
            motherName: s.motherName || 'N/A',
            parentEmail: s.parentEmail || 'N/A',
            photo: s.photo || DEFAULT_STUDENT_AVATAR,
            documents: docs,
            documentCount: docs.length,
            subjects: (s.academic && Array.isArray(s.academic.subjects)) ? s.academic.subjects : [],
            currentAddress: [currentAddr.street, currentAddr.city, currentAddr.district].filter(Boolean).join(', ') || 'N/A',
            permanentAddress: [permAddr.street, permAddr.city, permAddr.district].filter(Boolean).join(', ') || 'N/A',
            joinYear: s.joinYear || '2083'
        };
    }

    _getFullName(s) {
        if (!s) return 'Unknown Student';
        if (typeof s.name === 'object' && s.name) {
            return [s.name.first, s.name.middle, s.name.last].filter(Boolean).join(' ') || 'Unnamed Pupil';
        }
        return String(s.name || 'Unnamed Pupil');
    }
}
