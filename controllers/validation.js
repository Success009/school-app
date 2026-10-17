/**
 * Server-Side Validation and Normalization Helpers
 * 
 * ARCHITECTURAL RATIONALE:
 * Mobile clients submit numbers in diverse formats (+977 980-000-0000, 9800000000,
 * or 0009800000000 for zero-cost test mode). Centralizing normalization ensures that
 * all queries and whitelist matches compare identical 10-digit canonical values.
 */

class ServerValidation {
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
}

module.exports = { ServerValidation };
