// modules/auth.js - Encapsulated Session, Login Mapping, SMS OTP, and Auth Routing Service
import { APIService } from './api.js';

export class AuthService {
    static getRoles() {
        return {
            PARENT: 'parent',
            TEACHER: 'teacher',
            ADMIN: 'admin'
        };
    }

    static getCurrentUser() {
        const saved = localStorage.getItem('school_app_user');
        if (!saved) return null;
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error("AuthService: session corrupted", e);
            this.logout();
            return null;
        }
    }

    static setCurrentUser(user) {
        localStorage.setItem('school_app_user', JSON.stringify(user));
    }

    static getAuthToken() {
        return localStorage.getItem('school_app_token');
    }

    static setAuthToken(token) {
        if (token) {
            localStorage.setItem('school_app_token', token);
        } else {
            localStorage.removeItem('school_app_token');
        }
    }

    static checkAuth(allowedRoles) {
        const user = this.getCurrentUser();
        if (!user) {
            window.location.href = 'index.html';
            return false;
        }
        if (allowedRoles && !allowedRoles.includes(user.role)) {
            this.redirectUserToRoleDashboard(user.role);
            return false;
        }
        return true;
    }

    static redirectUserToRoleDashboard(role) {
        const roles = this.getRoles();
        switch (role) {
            case roles.PARENT:
                window.location.href = 'parent.html';
                break;
            case roles.TEACHER:
                window.location.href = 'teacher.html';
                break;
            case roles.ADMIN:
                window.location.href = 'admin.html';
                break;
            default:
                window.location.href = 'index.html';
        }
    }

    static logout() {
        localStorage.removeItem('school_app_user');
        localStorage.removeItem('school_app_token');
        window.location.href = 'index.html';
    }

    /**
     * Fetch a cryptographic challenge stamp from the server for anti-tamper / anti-bot protection.
     */
    static async fetchStamp() {
        const res = await fetch('/api/auth/stamp');
        if (!res.ok) {
            throw new Error(`Failed to obtain security stamp: HTTP ${res.status}`);
        }
        const data = await res.json();
        return data.stamp;
    }

    /**
     * Dispatch 6-digit SMS OTP via secure proxy with stamp validation and cooldowns.
     */
    static async sendOtp(phone) {
        const stamp = await this.fetchStamp();
        const res = await fetch('/api/auth/otp/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, stamp })
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
            const err = new Error(data.error || 'Failed to dispatch verification code.');
            err.retry_after_seconds = data.retry_after_seconds;
            throw err;
        }

        return data;
    }

    /**
     * Verify 6-digit OTP code, receive persistent session token, and store session.
     */
    static async verifyOtp(phone, otp) {
        const res = await fetch('/api/auth/otp/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, otp })
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
            throw new Error(data.error || 'Invalid or expired verification code.');
        }

        if (data.token) {
            this.setAuthToken(data.token);
        }
        if (data.user) {
            this.setCurrentUser(data.user);
        }

        return data;
    }

    /**
     * Validate existing persistent session so user does not need to re-authenticate.
     */
    static async validateSession() {
        const token = this.getAuthToken();
        const user = this.getCurrentUser();
        if (!token || !user) return false;

        try {
            const res = await fetch('/api/auth/verify-session', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.valid) {
                    return true;
                }
            }
        } catch (e) {
            console.warn("Session verification warning (continuing with offline session):", e);
            // If offline, trust existing local session
            return true;
        }

        return false;
    }

    static async verifyPhoneRegistered(phone) {
        try {
            const adminData = await APIService.get(`school/admin/${phone}`);
            if (adminData) return { isRegistered: true, role: 'admin' };

            const mapData = await APIService.get(`school/login_mappings/${phone}`);
            if (mapData) return { isRegistered: true, role: mapData.role, mapData };

            return { isRegistered: false };
        } catch (e) {
            console.error("AuthService: registration check failed", e);
            throw e;
        }
    }

    static async executeLogin(phone, code) {
        // Backwards compatible helper for test suites and dev bypass
        if (code !== '0000' && code !== '000000' && code !== '123456') {
            throw new Error("Invalid verification code. Please enter '0000' to login.");
        }

        const registration = await this.verifyPhoneRegistered(phone);
        if (!registration.isRegistered) {
            throw new Error("Invalid phone number: This mobile number is not registered in the school database.");
        }

        const roles = this.getRoles();
        let sessionUser = null;

        if (registration.role === 'admin') {
            sessionUser = {
                role: roles.ADMIN,
                id: 'ADM-' + phone.slice(-4),
                name: 'Administrator',
                phone: phone
            };
        } else {
            const mapData = registration.mapData;
            if (mapData.role === 'teacher' || mapData.role === 'principal') {
                const teacherProfile = await APIService.get(`school/teachers/${mapData.studentId}`);
                if (!teacherProfile) {
                    throw new Error("Teacher profile record missing in database.");
                }
                
                let fullName = '';
                if (teacherProfile.name && typeof teacherProfile.name === 'object') {
                    fullName = `${teacherProfile.name.first || ''} ${teacherProfile.name.middle || ''} ${teacherProfile.name.last || ''}`.replace(/\s+/g, ' ').trim();
                } else {
                    fullName = teacherProfile.name || 'Faculty Member';
                }

                sessionUser = {
                    role: roles.TEACHER,
                    id: mapData.studentId,
                    name: fullName,
                    phone: teacherProfile.phone || phone,
                    photo: teacherProfile.photo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150',
                    subjects: teacherProfile.subjects || [ ],
                    assignedClasses: teacherProfile.assignedClasses || [ ],
                    classTeacherOf: teacherProfile.classTeacherOf || 'none',
                    schedule: teacherProfile.schedule || [
                        { period: '1st', class: teacherProfile.assignedClasses ? teacherProfile.assignedClasses[0] : '10-A', subject: teacherProfile.subjects ? teacherProfile.subjects[0] : 'Mathematics', time: '10:00 AM' }
                    ]
                };
            } else if (mapData.role === 'admin') {
                sessionUser = {
                    role: roles.ADMIN,
                    id: mapData.studentId || 'A-001',
                    name: 'Admin Staff',
                    phone: phone
                };
            } else {
                const studentProfile = await APIService.get(`school/students/${mapData.studentId}`);
                if (!studentProfile) {
                    throw new Error("Student profile record missing in database.");
                }

                sessionUser = {
                    role: roles.PARENT,
                    id: 'P-' + phone.slice(-4),
                    name: studentProfile.parentName || 'Student Parent',
                    phone: phone,
                    studentId: mapData.studentId,
                    studentName: studentProfile.name || 'Student',
                    studentClass: studentProfile.class || '1',
                    studentPhoto: studentProfile.photo || 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150'
                };
            }
        }

        if (sessionUser) {
            this.setCurrentUser(sessionUser);
            return sessionUser;
        } else {
            throw new Error("Failed to construct user session.");
        }
    }
}