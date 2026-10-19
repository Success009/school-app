/**
 * Modular School Notification & Announcement Controller
 * 
 * ARCHITECTURAL RATIONALE:
 * Manages school announcements, class updates, and emergency notices.
 * Persists notices to 'school/notices' so both web consumers and the Android
 * background NotificationPollService receive updates synchronously without APK updates.
 */

const express = require('express');
const { SmsSecurityService } = require('../smsSecurity.js');

function createNotificationRouter(dbStorage) {
    const router = express.Router();

    /**
     * GET /api/notifications
     * Retrieve all notices, optionally filtered by 'since' timestamp or target role.
     */
    router.get('/', (req, res) => {
        const noticesMap = dbStorage.get('school/notices') || {};
        const since = parseInt(req.query.since || '0', 10);
        const role = String(req.query.role || 'all').toLowerCase();

        const list = Object.keys(noticesMap).map(key => {
            const item = noticesMap[key];
            return typeof item === 'object' && item !== null ? { id: key, ...item } : { id: key, content: item };
        }).filter(notice => {
            const ts = Number(notice.timestamp || 0);
            if (since > 0 && ts <= since) return false;
            if (role !== 'all' && notice.target_role && notice.target_role !== 'all' && notice.target_role !== role) {
                return false;
            }
            return true;
        }).sort((a, b) => (Number(b.timestamp || 0) - Number(a.timestamp || 0)));

        res.json({
            success: true,
            count: list.length,
            notices: list
        });
    });

    /**
     * POST /api/notifications
     * Publish an announcement or notification.
     * Enforces session authentication (Admin or Faculty only).
     */
    router.post('/', async (req, res) => {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

        if (!token) {
            return res.status(401).json({ success: false, error: 'Authentication required to post notices.' });
        }

        const user = SmsSecurityService.verifySessionToken(token);
        if (!user || (user.role !== 'admin' && user.role !== 'teacher')) {
            return res.status(403).json({ success: false, error: 'Forbidden: Only faculty or administrators may publish notices.' });
        }

        const { title, message, category, target_role, priority } = req.body;
        if (!title || !message) {
            return res.status(400).json({ success: false, error: 'Both title and message are required.' });
        }

        const noticeId = 'NOTICE_' + Date.now();
        const noticeData = {
            id: noticeId,
            title: String(title).trim(),
            message: String(message).trim(),
            category: String(category || 'announcement').trim(),
            target_role: String(target_role || 'all').trim(),
            priority: String(priority || 'normal').trim(),
            timestamp: Date.now(),
            author: {
                id: user.id,
                name: user.name,
                role: user.role
            }
        };

        dbStorage.set(`school/notices/${noticeId}`, noticeData);

        res.json({
            success: true,
            notice_id: noticeId,
            notice: noticeData,
            message: 'Notice published successfully. Connected Android devices will receive native push.'
        });
    });

    return router;
}

module.exports = { createNotificationRouter };
