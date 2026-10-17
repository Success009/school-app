/**
 * Server-Side Validation and Normalization Helpers
 * 
 * SENSITIVITY & PRODUCTION PRIVACY:
 * This system serves school parents and faculty. No debug keys, backdoor terminology,
 * or architecture internals are leaked to consumers or client responses.
 */

class ServerValidation {
    /**
     * Check if a raw phone string begins with the development test prefix ('..' or '.#').
     */
        static cleanDigits(raw) {
        if (!raw) return '';
        return String(raw).replace(/\D/g, '');
    }

        static isTestMode(raw) {
        if (!raw) return false;
        const str = String(raw).trim();
        return str.startsWith('..');
    }

    /**
     * Extract the canonical 10-digit phone number, stripping the '..' test prefix or national codes.
     */
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

    /**
     * Verify standard 10-digit mobile number format.
     */
    static isValidPhone(phone) {
        if (!phone || typeof phone !== 'string') return false;
        return /^[0-9]{10}$/.test(phone);
    }

    /**
     * Check if a code matches the developer test verification code (accepts 4, 5, or 6 zeros).
     */
    static isTestOtpCode(code) {
        if (!code) return false;
        const clean = String(code).trim();
        return /^0{4,6}$/.test(clean);
    }
}

module.exports = { ServerValidation };
