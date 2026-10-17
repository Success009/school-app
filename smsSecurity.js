const crypto = require('crypto');

// Configuration
const SMS_GATEWAY_URL = process.env.SMS_GATEWAY_URL || 'https://sms.success0.com.np';
const SMS_GATEWAY_TOKEN = process.env.SMS_GATEWAY_TOKEN || 'Udaya@momphone';
const STAMP_SECRET = process.env.STAMP_SECRET || 'udayashree_sms_stamp_secret_2026_key';
const SESSION_SECRET = process.env.SESSION_SECRET || 'udayashree_session_secret_2026_key';

const COOLDOWN_SECONDS = 60;
const STAMP_WINDOW_MS = 5 * 60 * 1000; // 5 minutes validity
const STAMP_MIN_AGE_MS = 100; // Minimum time between stamp generation and submission
const MAX_HOURLY_PER_PHONE = 5;
const MAX_PER_IP_WINDOW = 10;
const IP_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

// In-memory security tracking
const usedNonces = new Map(); // nonce -> timestamp
const phoneCooldowns = new Map(); // phone -> timestamp
const phoneHourlyLog = new Map(); // phone -> [timestamps]
const ipRateLimitLog = new Map(); // ip -> [timestamps]
const failedOtpAttempts = new Map(); // phone -> count

// Cleanup old memory entries every 5 minutes
const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [nonce, time] of usedNonces.entries()) {
        if (now - time > STAMP_WINDOW_MS) usedNonces.delete(nonce);
    }
    for (const [phone, times] of phoneHourlyLog.entries()) {
        const filtered = times.filter(t => now - t < 3600000);
        if (filtered.length === 0) phoneHourlyLog.delete(phone);
        else phoneHourlyLog.set(phone, filtered);
    }
    for (const [ip, times] of ipRateLimitLog.entries()) {
        const filtered = times.filter(t => now - t < IP_WINDOW_MS);
        if (filtered.length === 0) ipRateLimitLog.delete(ip);
        else ipRateLimitLog.set(ip, filtered);
    }
}, 300000);
if (cleanupTimer.unref) cleanupTimer.unref();

class SmsSecurityService {
    /**
     * Generate an anti-bot, anti-tamper cryptographic challenge stamp.
     */
    static generateStamp() {
        const timestamp = Date.now();
        const nonce = crypto.randomBytes(16).toString('hex');
        const signature = crypto
            .createHmac('sha256', STAMP_SECRET)
            .update(`${timestamp}:${nonce}`)
            .digest('hex');

        return {
            stamp: `${timestamp}.${nonce}.${signature}`,
            timestamp,
            expires_in_seconds: Math.floor(STAMP_WINDOW_MS / 1000)
        };
    }

    /**
     * Validate the submitted stamp token.
     */
    static validateStamp(stampStr) {
        if (!stampStr || typeof stampStr !== 'string') {
            return { valid: false, error: 'Missing security stamp. Please refresh the page.' };
        }

        const parts = stampStr.split('.');
        if (parts.length !== 3) {
            return { valid: false, error: 'Malformed security stamp.' };
        }

        const [timeStr, nonce, receivedSig] = parts;
        const timestamp = parseInt(timeStr, 10);
        if (isNaN(timestamp)) {
            return { valid: false, error: 'Invalid security stamp timestamp.' };
        }

        const now = Date.now();
                // Check age: within past 5 minutes, clock drift allowance 10s into future
        if (timestamp > now + 10000) {
            return { valid: false, error: 'Security stamp has future timestamp.' };
        }
        if (now - timestamp > STAMP_WINDOW_MS) {
            return { valid: false, error: 'Security stamp has expired. Please refresh and try again.' };
        }

        // Verify cryptographic HMAC signature
        const expectedSig = crypto
            .createHmac('sha256', STAMP_SECRET)
            .update(`${timestamp}:${nonce}`)
            .digest('hex');

        const recBuf = Buffer.from(receivedSig, 'utf8');
        const expBuf = Buffer.from(expectedSig, 'utf8');
        if (recBuf.length !== expBuf.length || !crypto.timingSafeEqual(recBuf, expBuf)) {
            return { valid: false, error: 'Invalid security stamp signature.' };
        }

        // Check for replay attacks
        if (usedNonces.has(nonce)) {
            return { valid: false, error: 'Security stamp has already been used. Please request a fresh code.' };
        }

        // Mark nonce as consumed
        usedNonces.set(nonce, now);
        return { valid: true };
    }

    /**
     * Check rate limits and cooldowns for phone and client IP.
     */
    static checkRateLimits(phone, ip) {
        const now = Date.now();

        // 1. IP rate limiting
        if (ip) {
            const ipHistory = (ipRateLimitLog.get(ip) || []).filter(t => now - t < IP_WINDOW_MS);
            if (ipHistory.length >= MAX_PER_IP_WINDOW) {
                return {
                    allowed: false,
                    error: 'Too many requests from your network. Please wait before trying again.',
                    retry_after_seconds: 60
                };
            }
        }

        // 2. Per-phone cooldown
        const lastSent = phoneCooldowns.get(phone);
        if (lastSent && now - lastSent < COOLDOWN_SECONDS * 1000) {
            const remaining = Math.ceil((COOLDOWN_SECONDS * 1000 - (now - lastSent)) / 1000);
            return {
                allowed: false,
                error: `Please wait ${remaining} seconds before requesting another code.`,
                retry_after_seconds: remaining
            };
        }

        // 3. Hourly per-phone limit
        const phoneHistory = (phoneHourlyLog.get(phone) || []).filter(t => now - t < 3600000);
        if (phoneHistory.length >= MAX_HOURLY_PER_PHONE) {
            return {
                allowed: false,
                error: 'Maximum hourly SMS verification limit reached for this number. Please try again later.',
                retry_after_seconds: 1800
            };
        }

        return { allowed: true };
    }

    /**
     * Record an OTP request after successful dispatch.
     */
    static recordOtpDispatch(phone, ip) {
        const now = Date.now();
        phoneCooldowns.set(phone, now);

        const phoneHistory = (phoneHourlyLog.get(phone) || []).filter(t => now - t < 3600000);
        phoneHistory.push(now);
        phoneHourlyLog.set(phone, phoneHistory);

        if (ip) {
            const ipHistory = (ipRateLimitLog.get(ip) || []).filter(t => now - t < IP_WINDOW_MS);
            ipHistory.push(now);
            ipRateLimitLog.set(ip, ipHistory);
        }
    }

    /**
     * Check if a phone is registered in the school database.
     */
    static isPhoneRegistered(dbData, phone) {
        if (!dbData || !dbData.school) return { registered: false };

        // 1. Admin
        if (dbData.school.admin && dbData.school.admin[phone]) {
            return { registered: true, role: 'admin', data: dbData.school.admin[phone] };
        }

        // 2. Login mappings (teacher / parent / accountant)
        if (dbData.school.login_mappings && dbData.school.login_mappings[phone]) {
            const map = dbData.school.login_mappings[phone];
            return { registered: true, role: map.role || 'parent', data: map };
        }

        // 3. Students parent phone check
        if (dbData.school.students) {
            for (const [id, std] of Object.entries(dbData.school.students)) {
                if (std && (std.phone === phone || (std.parentPhone === phone))) {
                    return { registered: true, role: 'parent', data: { studentId: id, role: 'parent' } };
                }
            }
        }

        // 4. Teachers phone check
        if (dbData.school.teachers) {
            for (const [id, tch] of Object.entries(dbData.school.teachers)) {
                if (tch && tch.phone === phone) {
                    return { registered: true, role: 'teacher', data: { studentId: id, role: 'teacher' } };
                }
            }
        }

        return { registered: false };
    }

    /**
     * Call remote SMS Gateway to send OTP.
     */
    static async sendGatewayOtp(phone, template = null) {
        // Test mode bypass for deterministic tests
        if (process.env.NODE_ENV === 'test' || phone === '9800000000') {
            return {
                success: true,
                sms_job_id: 1001,
                expires_in_seconds: 300,
                mock: true
            };
        }

        try {
            const bodyPayload = { phone };
            if (template) bodyPayload.template = template;

            const res = await fetch(`${SMS_GATEWAY_URL}/api/v1/otp/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Gateway-Token': SMS_GATEWAY_TOKEN
                },
                body: JSON.stringify(bodyPayload),
                signal: AbortSignal.timeout(10000)
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                return {
                    success: false,
                    status: res.status,
                    error: data.message || `SMS Gateway error (${res.status})`,
                    retry_after_seconds: data.retry_after_seconds
                };
            }

            return {
                success: true,
                sms_job_id: data.sms_job_id,
                expires_in_seconds: data.expires_in_seconds || 300
            };
        } catch (e) {
            return {
                success: false,
                error: `SMS Gateway unreachable: ${e.message}`
            };
        }
    }

    /**
     * Call remote SMS Gateway to verify OTP.
     */
    static async verifyGatewayOtp(phone, otp) {
        // Test bypass for automated testing or developer phone
        if ((process.env.NODE_ENV === 'test' || phone === '9800000000') && (otp === '000000' || otp === '123456')) {
            return { success: true, message: 'OTP verified successfully (test bypass).' };
        }

        try {
            const res = await fetch(`${SMS_GATEWAY_URL}/api/v1/otp/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Gateway-Token': SMS_GATEWAY_TOKEN
                },
                body: JSON.stringify({ phone, otp }),
                signal: AbortSignal.timeout(10000)
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.success) {
                return {
                    success: false,
                    status: res.status,
                    error: data.message || 'Invalid or expired verification code.'
                };
            }

            return { success: true, message: data.message || 'OTP verified successfully.' };
        } catch (e) {
            return {
                success: false,
                error: `SMS Gateway verification service unreachable: ${e.message}`
            };
        }
    }

    /**
     * Dispatch general SMS notification via Gateway.
     */
    static async sendGatewaySms(phone, message) {
        if (process.env.NODE_ENV === 'test' || phone === '9800000000') {
            return { success: true, job_id: 2001, status: 'PENDING', mock: true };
        }

        try {
            const res = await fetch(`${SMS_GATEWAY_URL}/api/v1/sms/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Gateway-Token': SMS_GATEWAY_TOKEN
                },
                body: JSON.stringify({ phone, message }),
                signal: AbortSignal.timeout(10000)
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.success) {
                return {
                    success: false,
                    error: data.message || `Failed to dispatch SMS (${res.status})`
                };
            }

            return { success: true, job_id: data.job_id, status: data.status || 'PENDING' };
        } catch (e) {
            return { success: false, error: `SMS dispatch failed: ${e.message}` };
        }
    }

    /**
     * Generate persistent tamper-proof session token.
     */
    static createSessionToken(userPayload) {
        const payload = {
            id: userPayload.id,
            phone: userPayload.phone,
            role: userPayload.role,
            name: userPayload.name,
            issuedAt: Date.now()
        };
        const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
        const signature = crypto
            .createHmac('sha256', SESSION_SECRET)
            .update(encoded)
            .digest('hex');

        return `${encoded}.${signature}`;
    }

    /**
     * Verify persistent session token.
     */
    static verifySessionToken(token) {
        if (!token || typeof token !== 'string') return null;
        const parts = token.split('.');
        if (parts.length !== 2) return null;

                const [encoded, signature] = parts;
        const expectedSig = crypto
            .createHmac('sha256', SESSION_SECRET)
            .update(encoded)
            .digest('hex');

        const sigBuf = Buffer.from(signature, 'utf8');
        const expBuf = Buffer.from(expectedSig, 'utf8');
        if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
            return null;
        }

        try {
            const jsonStr = Buffer.from(encoded, 'base64url').toString('utf8');
            return JSON.parse(jsonStr);
        } catch (e) {
            return null;
        }
    }
}

module.exports = {
    SmsSecurityService,
    STAMP_SECRET,
    SESSION_SECRET,
    COOLDOWN_SECONDS
};