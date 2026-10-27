// modules/db.js - High-Density Data Access Layer (DAL) wrapping all school data operations
import { APIService } from './api.js';

export class DatabaseService {
    // Student Methods
    static async getStudents() {
        const data = await APIService.get('school/students');
        return data ? Object.entries(data).map(([id, val]) => ({ id, ...val })) : [ ];
    }

    static async getStudent(id) {
        return APIService.get(`school/students/${id}`);
    }

    static async saveStudent(id, studentData) {
        return APIService.post(`school/students/${id}`, studentData);
    }

    static async updateStudent(id, updates) {
        return APIService.patch(`school/students/${id}`, updates);
    }

    static async removeStudent(id) {
        return APIService.delete(`school/students/${id}`);
    }

    // Teacher Methods
    static async getTeachers() {
        const data = await APIService.get('school/teachers');
        return data ? Object.entries(data).map(([id, val]) => ({ id, ...val })) : [ ];
    }

    static async getTeacher(id) {
        return APIService.get(`school/teachers/${id}`);
    }

    static async saveTeacher(id, teacherData) {
        return APIService.post(`school/teachers/${id}`, teacherData);
    }

    static async updateTeacher(id, updates) {
        return APIService.patch(`school/teachers/${id}`, updates);
    }

    static async removeTeacher(id) {
        return APIService.delete(`school/teachers/${id}`);
    }

    // Login Mapping Methods
    static async saveLoginMapping(phone, mapData) {
        return APIService.post(`school/login_mappings/${phone}`, mapData);
    }

    static async removeLoginMapping(phone) {
        return APIService.delete(`school/login_mappings/${phone}`);
    }

    // Archive Methods
    static async archiveStudent(id, studentData) {
        return APIService.post(`school/archives/students/${id}`, studentData);
    }

    static async logStudentStatusHistory(logData) {
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        let key = '';
        for (let i = 0; i < 16; i++) {
            key += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return APIService.post(`school/student_status_history/${key}`, logData);
    }

    // Exam Methods
    static async getExamWindows() {
        const data = await APIService.get('school/exam_windows');
        return data ? Object.entries(data).map(([id, val]) => ({ id, ...val })) : [ ];
    }

    static async saveExamWindow(id, examData) {
        return APIService.post(`school/exam_windows/${id}`, examData);
    }

    static async updateExamStatus(id, status) {
        return APIService.patch(`school/exam_windows/${id}`, { status });
    }

    static async removeExamWindow(id) {
        return APIService.delete(`school/exam_windows/${id}`);
    }

    // Results Methods
    static async getDraftResults() {
        return APIService.get('school/draft_results') || { };
    }

    static async getStudentResults(studentId, term) {
        return APIService.get(`school/results/${studentId}/${term}`);
    }

    static async saveDraftMark(studentId, examId, subjectId, markData) {
        return APIService.post(`school/draft_results/${studentId}/${examId}/${subjectId}`, markData);
    }

    static async savePublishedMark(studentId, examId, subjectId, markData) {
        return APIService.post(`school/results/${studentId}/${examId}/${subjectId}`, markData);
    }

    static async batchUpdate(updates) {
        return APIService.patch('', updates);
    }

    // Attendance Methods
    static async getAttendance(classId) {
        return APIService.get(`school/attendance/${classId}`) || { };
    }

        // System Configs & Modular Class/Subject Setup
    static async getClasses() {
        const data = await APIService.get('school/classes');
        if (!data) return [ ];
        if (Array.isArray(data)) return data;
        return Object.entries(data).map(([id, val]) => (typeof val === 'object' && val !== null ? { id, ...val } : { id, name: val }));
    }

    static async saveClass(classId, classData) {
        return APIService.post(`school/classes/${classId}`, classData);
    }

    static async removeClass(classId) {
        await APIService.delete(`school/classes/${classId}`);
        await APIService.delete(`school/class_configs/${classId}`);
        return { success: true };
    }

    static async getClassConfigs(classId) {
        return APIService.get(`school/class_configs/${classId}`) || { };
    }

    static async saveClassSubject(classId, subjectId, subjectData) {
        return APIService.post(`school/class_configs/${classId}/subjects/compulsory/${subjectId}`, subjectData);
    }

    static async removeClassSubject(classId, subjectId) {
        return APIService.delete(`school/class_configs/${classId}/subjects/compulsory/${subjectId}`);
    }

    static async getPeriodTimings() {
        const data = await APIService.get('school/config/period_timings');
        return data ? Object.entries(data).map(([id, val]) => ({ id, ...val })) : [ ];
    }

    static async savePeriodTiming(key, periodData) {
        return APIService.post(`school/config/period_timings/${key}`, periodData);
    }

    static async removePeriodTiming(key) {
        return APIService.delete(`school/config/period_timings/${key}`);
    }

    // Notice Board Methods
    static async getNotices() {
        const data = await APIService.get('school/notices');
        return data ? Object.entries(data).map(([id, val]) => ({ id, ...val })) : [ ];
    }

    static async saveNotice(noticeData) {
        const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        let key = '';
        for (let i = 0; i < 16; i++) {
            key += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return APIService.post(`school/notices/${key}`, noticeData);
    }

    // Ticket Methods
    static async getTickets() {
        const data = await APIService.get('school/tickets');
        return data ? Object.entries(data).map(([id, val]) => ({ id, ...val })) : [ ];
    }

    static async saveTicket(id, ticketData) {
        return APIService.post(`school/tickets/${id}`, ticketData);
    }

    // Suggestions Methods
    static async getSuggestions() {
        const data = await APIService.get('school/suggestions');
        return data ? Object.entries(data).map(([id, val]) => ({ id, ...val })) : [ ];
    }

    static async saveSuggestion(id, sugData) {
        return APIService.post(`school/suggestions/${id}`, sugData);
    }

    // Reassignment Methods
    static async getClassChangeRequests() {
        const data = await APIService.get('school/class_change_requests');
        return data ? Object.entries(data).map(([id, val]) => ({ id, ...val })) : [ ];
    }

    static async saveClassChangeRequest(requestId, reqData) {
        return APIService.post(`school/class_change_requests/${requestId}`, reqData);
    }

    static async updateClassChangeRequestStatus(requestId, status) {
        return APIService.patch(`school/class_change_requests/${requestId}`, { status });
    }
}