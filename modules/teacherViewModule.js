// modules/teacherViewModule.js - Faculty Directory & Workload Inspector (Zero DOM Coupling)
import { DatabaseService } from './db.js';
import { OfflineStore } from './offlineStore.js';

export const DEFAULT_AVATAR = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2NiZDVlMSI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIvPjwvc3ZnPg==';

export class TeacherViewModule {
    constructor(options = {}) {
        this.classes = options.classes || [];
        this.teachers = options.teachers || [];
        this.selectedFilter = options.selectedFilter || 'all'; // 'all' | 'class_teachers' | 'subject_teachers' | or classId '1', '2'...
        this.searchQuery = options.searchQuery || '';
        this.sortBy = options.sortBy || 'name'; // 'name' | 'id' | 'experience'
    }

    // Dynamic Database Loader with OfflineStore resilience
    async loadFromDatabase() {
        if (typeof DatabaseService !== 'undefined' && DatabaseService) {
            try {
                if (DatabaseService.getClasses) {
                    const clsList = await DatabaseService.getClasses();
                    if (Array.isArray(clsList)) {
                        this.classes = clsList.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
                        if (typeof OfflineStore !== 'undefined' && OfflineStore.save) {
                            OfflineStore.save('config', 'classes', this.classes);
                        }
                    }
                }
            } catch (e) {
                console.warn('Could not load classes in TeacherViewModule:', e.message);
                if (typeof OfflineStore !== 'undefined' && OfflineStore.get) {
                    const cached = OfflineStore.get('config', 'classes');
                    if (cached && Array.isArray(cached.payload)) {
                        this.classes = cached.payload;
                    }
                }
            }

            try {
                if (DatabaseService.getTeachers) {
                    const tList = await DatabaseService.getTeachers();
                    if (Array.isArray(tList)) {
                        this.teachers = tList;
                        if (typeof OfflineStore !== 'undefined' && OfflineStore.save) {
                            OfflineStore.save('teacher', 'all', this.teachers);
                        }
                    }
                }
            } catch (e) {
                console.warn('Could not load teachers in TeacherViewModule:', e.message);
                if (typeof OfflineStore !== 'undefined' && OfflineStore.get) {
                    const cached = OfflineStore.get('teacher', 'all');
                    if (cached && Array.isArray(cached.payload)) {
                        this.teachers = cached.payload;
                    }
                }
            }
        }
    }

    // Setters
    setSelectedFilter(filter) {
        this.selectedFilter = String(filter || 'all');
        return this.selectedFilter;
    }

    setSearchQuery(query) {
        this.searchQuery = typeof query === 'string' ? query.trim().toLowerCase() : '';
        return this.searchQuery;
    }

    setSortBy(sortBy) {
        if (['name', 'id', 'experience'].includes(sortBy)) {
            this.sortBy = sortBy;
        }
        return this.sortBy;
    }

    // Getters
    getClasses() {
        return this.classes;
    }

    getTeachers() {
        return this.teachers;
    }

    getSelectedFilter() {
        return this.selectedFilter;
    }

    getTeacherById(id) {
        const teacher = this.teachers.find(t => t.id === id);
        return teacher ? this._formatTeacher(teacher) : null;
    }

    // Category / Filter Counts
    getFilterCounts() {
        const classTeachers = this.teachers.filter(t => this._isClassTeacher(t)).length;
        const subjectTeachers = this.teachers.length - classTeachers;

        const counts = {
            all: this.teachers.length,
            class_teachers: classTeachers,
            subject_teachers: subjectTeachers
        };

        // Also calculate counts per class (either assigned as class teacher or teaching subjects)
        this.classes.forEach(c => {
            const cid = String(c.id);
            counts[cid] = this.teachers.filter(t => {
                const isCT = String(t.classTeacherOf || '') === cid;
                const teachesClass = t.workload && Array.isArray(t.workload[cid]) && t.workload[cid].length > 0;
                return isCT || teachesClass;
            }).length;
        });

        return counts;
    }

    // Summary Statistics
    getStatistics() {
        let classTeachersCount = 0;
        let verifiedCount = 0;
        const classesCoveredSet = new Set();
        let totalAssignedPeriods = 0;

        this.teachers.forEach(t => {
            if (this._isClassTeacher(t)) {
                classTeachersCount++;
                if (t.classTeacherOf && t.classTeacherOf !== 'None') {
                    classesCoveredSet.add(String(t.classTeacherOf));
                }
            }

            const docs = Array.isArray(t.verificationDocuments) ? t.verificationDocuments : [];
            if (t.isVerified || docs.length > 0) {
                verifiedCount++;
            }

            if (t.workload && typeof t.workload === 'object') {
                Object.entries(t.workload).forEach(([cid, subjs]) => {
                    if (Array.isArray(subjs) && subjs.length > 0) {
                        classesCoveredSet.add(String(cid));
                        totalAssignedPeriods += subjs.length;
                    }
                });
            }
        });

        return {
            totalFaculty: this.teachers.length,
            classTeachersCount,
            subjectTeachersCount: this.teachers.length - classTeachersCount,
            verifiedCount,
            totalClassesCovered: classesCoveredSet.size,
            totalAssignedPeriods
        };
    }

    // Filter and Sort Teachers
    getFilteredTeachers(overrideFilters = {}) {
        const filter = overrideFilters.filter !== undefined ? String(overrideFilters.filter) : this.selectedFilter;
        const search = overrideFilters.query !== undefined
            ? String(overrideFilters.query).trim().toLowerCase()
            : this.searchQuery;
        const sort = overrideFilters.sortBy || this.sortBy;

        let result = this.teachers.slice();

        // 1. Filter by category or class
        if (filter === 'class_teachers') {
            result = result.filter(t => this._isClassTeacher(t));
        } else if (filter === 'subject_teachers') {
            result = result.filter(t => !this._isClassTeacher(t));
        } else if (filter !== 'all') {
            // Filter by specific classId
            result = result.filter(t => {
                const isCT = String(t.classTeacherOf || '') === filter;
                const teachesClass = t.workload && Array.isArray(t.workload[filter]) && t.workload[filter].length > 0;
                return isCT || teachesClass;
            });
        }

        // 2. Filter by Search Query
        if (search) {
            result = result.filter(t => {
                const fullName = this._getFullName(t).toLowerCase();
                const id = String(t.id || '').toLowerCase();
                const phone = String(t.phone || '').toLowerCase();
                const email = String(t.email || '').toLowerCase();
                const title = String(t.professionalTitle || '').toLowerCase();
                const qual = String(t.qualification || '').toLowerCase();

                // Workload subjects matching
                let subjectMatches = false;
                if (t.workload && typeof t.workload === 'object') {
                    for (const subjs of Object.values(t.workload)) {
                        if (Array.isArray(subjs)) {
                            if (subjs.some(s => String(s).toLowerCase().includes(search))) {
                                subjectMatches = true;
                                break;
                            }
                        }
                    }
                }

                return fullName.includes(search) ||
                    id.includes(search) ||
                    phone.includes(search) ||
                    email.includes(search) ||
                    title.includes(search) ||
                    qual.includes(search) ||
                    subjectMatches;
            });
        }

        // 3. Sort
        result.sort((a, b) => {
            if (sort === 'id') {
                return String(a.id || '').localeCompare(String(b.id || ''));
            } else if (sort === 'experience') {
                const expA = parseInt(String(a.experience || '0').replace(/\D/g, ''), 10) || 0;
                const expB = parseInt(String(b.experience || '0').replace(/\D/g, ''), 10) || 0;
                if (expA !== expB) return expB - expA; // Highest experience first
            }

            // Default to name sort
            const nameA = this._getFullName(a).toLowerCase();
            const nameB = this._getFullName(b).toLowerCase();
            return nameA.localeCompare(nameB);
        });

        return result.map(t => this._formatTeacher(t));
    }

    // Helper: Formats teacher for view presentation
    _formatTeacher(t) {
        const fullName = this._getFullName(t);
        const docs = Array.isArray(t.verificationDocuments) ? t.verificationDocuments : [];
        const workloadMap = t.workload && typeof t.workload === 'object' ? t.workload : {};

        // Parse structured workload classes and subjects
        const workloadBreakdown = [];
        let totalSubjectsCount = 0;

        Object.entries(workloadMap).forEach(([cid, subjs]) => {
            if (Array.isArray(subjs) && subjs.length > 0) {
                totalSubjectsCount += subjs.length;
                const classObj = this.classes.find(c => String(c.id) === String(cid));
                const className = classObj ? (classObj.name || `Class ${cid}`) : `Class ${cid}`;
                workloadBreakdown.push({
                    classId: String(cid),
                    className,
                    subjects: subjs
                });
            }
        });

        // Sort workload breakdown by class ID numerically
        workloadBreakdown.sort((a, b) => (Number(a.classId) || 0) - (Number(b.classId) || 0));

        const isCT = this._isClassTeacher(t);
        const ctClass = isCT ? String(t.classTeacherOf) : null;
        let classTeacherBadge = 'Subject Teacher';
        if (isCT) {
            const ctClassObj = this.classes.find(c => String(c.id) === ctClass);
            classTeacherBadge = ctClassObj ? `Class Teacher (${ctClassObj.name || `Class ${ctClass}`})` : `Class ${ctClass} Teacher`;
        }

        return {
            id: t.id,
            fullName,
            firstName: (t.name && t.name.first) || '',
            middleName: (t.name && t.name.middle) || '',
            lastName: (t.name && t.name.last) || '',
            professionalTitle: t.professionalTitle || 'Faculty Member',
            phone: t.phone || 'N/A',
            email: t.email || 'N/A',
            gender: t.gender || 'Unspecified',
            bloodGroup: t.bloodGroup || 'Unknown',
            qualification: t.qualification || 'N/A',
            experience: t.experience || 'N/A',
            photo: t.photo || DEFAULT_AVATAR,
            isClassTeacher: isCT,
            classTeacherOf: ctClass,
            classTeacherBadge,
            isVerified: !!t.isVerified || docs.length > 0,
            documents: docs,
            documentCount: docs.length,
            workload: workloadBreakdown,
            totalWorkloadClasses: workloadBreakdown.length,
            totalSubjectsCount
        };
    }

    _isClassTeacher(t) {
        if (!t || !t.classTeacherOf) return false;
        const val = String(t.classTeacherOf).trim().toLowerCase();
        return val !== '' && val !== 'none' && val !== 'null' && val !== 'undefined';
    }

    _getFullName(t) {
        if (!t) return 'Unknown Faculty';
        if (typeof t.name === 'object' && t.name) {
            return [t.name.first, t.name.middle, t.name.last].filter(Boolean).join(' ') || 'Unnamed Faculty';
        }
        return String(t.name || 'Unnamed Faculty');
    }
}