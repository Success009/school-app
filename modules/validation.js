/**
 * Client-Side Validation and Phone Formatting Service
 * 
 * ARCHITECTURAL RATIONALE:
 * Standardizes phone input sanitation and test bypass detection across browser views
 * (Admin, Teacher, Parent) before dispatching network requests, preventing invalid
 * payload transmission and standardizing error handling.
 */

export class ValidationService {
    static cleanDigits(raw) {
        if (!raw) return '';
        return String(raw).replace(/\D/g, '');
    }

    static isTestMode(raw) {
        const digits = this.cleanDigits(raw);
        return digits.startsWith('000');
    }

    static normalizePhone(raw) {
        let digits = this.cleanDigits(raw);
        if (digits.startsWith('000')) {
            digits = digits.replace(/^000+/, '');
        }
        if (digits.length > 10 && digits.startsWith('977')) {
            digits = digits.slice(3);
        }
        return digits;
    }

    static isValidPhone(phone) {
        if (!phone || typeof phone !== 'string') return false;
        return /^[0-9]{10}$/.test(phone);
    }

    static isTestOtpCode(code) {
        if (!code) return false;
        const clean = String(code).trim();
        return clean === '000000' || clean === '0000';
    }

    static sanitize(str) {
        if (!str || typeof str !== 'string') return '';
        return str.replace(/[<>'"&]/g, (char) => {
            switch (char) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case "'": return '&#39;';
                case '"': return '&quot;';
                case '&': return '&amp;';
                default: return char;
            }
        }).trim();
    }
}

if (typeof window !== 'undefined') {
    window.ValidationService = ValidationService;
}
