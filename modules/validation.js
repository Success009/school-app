/**
 * Client-Side Validation and Phone Formatting Service
 */

export class ValidationService {
        static cleanDigits(raw) {
        if (!raw) return '';
        return String(raw).replace(/\D/g, '');
    }

        static isTestMode(raw) {
        if (!raw) return false;
        const str = String(raw).trim();
        return str.startsWith('..');
    }

    static normalizePhone(raw) {
        if (!raw) return '';
        let str = String(raw).trim();
        if (str.startsWith('..')) {
            str = str.slice(2);
        }
        let digits = str.replace(/\D/g, '');
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
        return /^0{4,6}$/.test(clean);
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
