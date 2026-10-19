/**
 * Authentication and SMS Security Controller
 * 
 * ARCHITECTURAL RATIONALE:
 * Handles stamp challenges, anti-drain whitelisting, rate-limits, cellular gateway dispatch,
 * and HMAC-SHA256 session token generation.
 * 
  * DEVELOPER TEST MODE:
 * Using the test prefix ('..' or '.#') bypasses cellular gateway SMS transmission, accepting '000000'
 * while requiring the user account to exist in the database.
 */

const express = require('express');
const { SmsSecurityService } = require('../smsSecurity.js');
const { ServerValidation } = require('./validation.js');

function createAuthRouter(dbStorage) {
    const router = express.Router();

    function getClientIp(req) {
        return (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || '';
    }

    router.get('/stamp', (req, res) => {
        const stampData = SmsSecurityService.generateStamp();
        res.json({
            success: true,
            ...stampData
        });
    });

    router.post('/otp/send', async (req, res) => {
        const { phone: rawPhone, stamp } = req.body;
        const clientIp = getClientIp(req);

        if (!rawPhone) {
            return res.status(400).json({ success: false, error: 'Mobile number is required.' });
        }

        const isTestMode = ServerValidation.isTestMode(rawPhone);
        const phone = ServerValidation.normalizePhone(rawPhone);

        if (!ServerValidation.isValidPhone(phone)) {
            return res.status(400).json({ success: false, error: 'Please enter a valid 10-digit mobile number.' });
        }

        const stampValidation = SmsSecurityService.validateStamp(stamp);
        if (!stampValidation.valid) {
            return res.status(403).json({ success: false, error: stampValidation.error });
        }

        const dbData = dbStorage.getRawData();
        const regCheck = SmsSecurityService.isPhoneRegistered(dbData, phone);
        if (!regCheck.registered) {
            return res.status(403).json({
                success: false,
                error: 'Invalid phone number: This mobile number is not registered in the school database.'
            });
        }

                if (isTestMode) {
            // Emulate standard SMS dispatch response without leaking test mode to the consumer
            return res.json({
                success: true,
                message: 'Verification code sent to your mobile number.',
                sms_job_id: 999999,
                cooldown_seconds: 60,
                expires_in_seconds: 300
            });
        }

        const limitCheck = SmsSecurityService.checkRateLimits(phone, clientIp);
        if (!limitCheck.allowed) {
            return res.status(429).json({
                success: false,
                error: limitCheck.error,
                retry_after_seconds: limitCheck.retry_after_seconds
            });
        }

        const dispatch = await SmsSecurityService.sendGatewayOtp(phone);
        if (!dispatch.success) {
            return res.status(dispatch.status || 502).json({
                success: false,
                error: dispatch.error || 'Failed to dispatch verification SMS from cellular gateway.',
                retry_after_seconds: dispatch.retry_after_seconds
            });
        }

        SmsSecurityService.recordOtpDispatch(phone, clientIp);

        res.json({
            success: true,
            message: 'Verification code dispatched to your phone.',
            sms_job_id: dispatch.sms_job_id,
            cooldown_seconds: 60,
            expires_in_seconds: dispatch.expires_in_seconds || 300
        });
    });

    router.post('/otp/verify', async (req, res) => {
        const { phone: rawPhone, otp } = req.body;

        if (!rawPhone || !otp) {
            return res.status(400).json({ success: false, error: 'Phone number and verification code are required.' });
        }

                const isTestMode = ServerValidation.isTestMode(rawPhone);
        const phone = ServerValidation.normalizePhone(rawPhone);
        const cleanOtp = String(otp).trim();
        const isTestOtp = isTestMode && ServerValidation.isTestOtpCode(cleanOtp);

        if (!isTestOtp) {
            const verifyResult = await SmsSecurityService.verifyGatewayOtp(phone, cleanOtp);
            if (!verifyResult.success) {
                return res.status(400).json({
                    success: false,
                    error: verifyResult.error || 'Invalid or expired verification code.'
                });
            }
        }

        const dbData = dbStorage.getRawData();
        const regCheck = SmsSecurityService.isPhoneRegistered(dbData, phone);
        if (!regCheck.registered) {
            return res.status(403).json({ success: false, error: 'User account no longer exists in school database.' });
        }

        let sessionUser = null;

        if (regCheck.role === 'admin') {
            const adminRec = dbData.school.admin[phone];
            sessionUser = {
                role: 'admin',
                id: 'ADM-' + phone.slice(-4),
                name: (adminRec && adminRec.name) || 'Administrator',
                phone: phone
            };
        } else {
            const mapData = regCheck.data;
            if (mapData.role === 'teacher' || mapData.role === 'principal') {
                const tch = (dbData.school.teachers && dbData.school.teachers[mapData.studentId]) || {};
                let fullName = 'Faculty Member';
                if (tch.name && typeof tch.name === 'object') {
                    fullName = `${tch.name.first || ''} ${tch.name.middle || ''} ${tch.name.last || ''}`.replace(/\s+/g, ' ').trim();
                } else if (tch.name) {
                    fullName = tch.name;
                }

                sessionUser = {
                    role: 'teacher',
                    id: mapData.studentId,
                    name: fullName,
                    phone: tch.phone || phone,
                    photo: tch.photo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150',
                    subjects: tch.subjects || [],
                    assignedClasses: tch.assignedClasses || [],
                    classTeacherOf: tch.classTeacherOf || 'none'
                };
            } else {
                const s = (dbData.school.students && dbData.school.students[mapData.studentId]) || {};
                sessionUser = {
                    role: 'parent',
                    id: 'P-' + phone.slice(-4),
                    name: s.parentName || (s.name ? `${s.name.first || ''}'s Parent`.trim() : 'Parent'),
                    phone: phone,
                    student: {
                        id: mapData.studentId,
                        name: s.name,
                        grade: s.class,
                        section: s.section,
                        roll: s.roll || '01',
                        bloodGroup: s.bloodGroup,
                        photo: s.photo
                    }
                };
            }
        }

                const clientPlatformHeader = req.headers['x-client-platform'] || '';
        const userAgent = req.headers['user-agent'] || '';
        const isMobileApp = clientPlatformHeader === 'android-app' || /UdayashreeSchoolApp|okhttp/i.test(userAgent);
        const clientPlatform = isMobileApp ? 'mobile_app' : 'web_browser';

        sessionUser.client_platform = clientPlatform;
        const sessionToken = SmsSecurityService.createSessionToken(sessionUser, clientPlatform);

        res.json({
            success: true,
            message: 'Authentication successful.',
            token: sessionToken,
            user: sessionUser,
            client_platform: clientPlatform,
            is_mobile_app: isMobileApp
        });
    });

    router.get('/verify-session', (req, res) => {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.startsWith('Bearer ')
            ? authHeader.slice(7).trim()
            : req.query.token;

        if (!token) {
            return res.status(401).json({ success: false, error: 'No session token provided.' });
        }

        const decoded = SmsSecurityService.verifySessionToken(token);
        if (!decoded) {
            return res.status(401).json({ success: false, error: 'Invalid or expired session token.' });
        }

        res.json({
            success: true,
            valid: true,
            user: decoded,
            client_platform: decoded.platform || 'web_browser',
            is_mobile_app: decoded.platform === 'mobile_app'
        });
    });

    return router;
}

module.exports = { createAuthRouter };
