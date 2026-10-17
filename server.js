/**
 * Udayashree School App Server Orchestrator
 * 
 * ARCHITECTURAL RATIONALE:
 * server.js acts strictly as an orchestration layer. It configures the Express pipeline,
 * registers security middlewares, and mounts isolated sub-routers (Authentication, Database,
 * Media Uploads). No business logic or file operations reside in this file, ensuring that
 * individual domain layers can be modified, tested, or scaled independently without risk
 * of collateral regressions.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

const { DbStorageService } = require('./controllers/dbStorage.js');
const { createAuthRouter } = require('./controllers/authController.js');
const { createDbRouter } = require('./controllers/dbController.js');
const { createUploadRouter } = require('./controllers/uploadController.js');
const { SmsSecurityService } = require('./smsSecurity.js');

const app = express();
const PORT = process.env.PORT || 5050;

// Enable Cross-Origin Resource Sharing and generous JSON payload body parsing
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Initialize persistent atomic database storage
const DB_FILE = path.join(__dirname, 'db.json');
const dbStorage = new DbStorageService(DB_FILE);

// Mount modular sub-routers
const authRouter = createAuthRouter(dbStorage);
const dbRouter = createDbRouter(dbStorage);
const uploadRouter = createUploadRouter(path.join(__dirname, 'uploads'));

app.use('/api/auth', authRouter);
app.use('/api/db', dbRouter);
app.use('/api/upload', uploadRouter);

// SMS broadcast endpoint for staff announcements
app.post('/api/sms/send', async (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

    if (!token) {
        return res.status(401).json({ success: false, error: 'Authorization required for SMS broadcast.' });
    }

    const user = SmsSecurityService.verifySessionToken(token);
    if (!user || (user.role !== 'admin' && user.role !== 'teacher')) {
        return res.status(403).json({ success: false, error: 'Forbidden: Insufficient privileges to dispatch SMS.' });
    }

    const { phone: rawPhone, message } = req.body;
    if (!rawPhone || !message) {
        return res.status(400).json({ success: false, error: 'Phone number and message content are required.' });
    }

    const phone = String(rawPhone).replace(/\D/g, '');
    const sendResult = await SmsSecurityService.sendGatewaySms(phone, message);
    if (!sendResult.success) {
        return res.status(502).json(sendResult);
    }

    res.json(sendResult);
});

// Serve static assets and uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(__dirname));

// Single-page fallback for frontend routing
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start listener when invoked directly
if (require.main === module) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`School App server listening on http://localhost:${PORT}`);
    });
}

module.exports = { app, dbStorage };
