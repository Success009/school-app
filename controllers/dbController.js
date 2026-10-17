/**
 * Database REST API Controller
 * 
 * ARCHITECTURAL RATIONALE:
 * Handles path-based GET, POST, PATCH, and DELETE requests for client portals.
 */

const express = require('express');

function createDbRouter(dbStorage) {
    const router = express.Router();

    router.get('/', (req, res) => {
        const dbPath = req.query.path || '';
        const val = dbStorage.get(dbPath);
        res.json(val);
    });

    router.post('/', (req, res) => {
        const { path: dbPath, value } = req.body;
        dbStorage.set(dbPath, value);
        res.json({ success: true });
    });

    router.patch('/', (req, res) => {
        const { path: dbPath, value } = req.body;
        if (!value || typeof value !== 'object') {
            return res.status(400).json({ success: false, error: 'Patch value must be an object' });
        }
        dbStorage.patch(dbPath, value);
        res.json({ success: true });
    });

    router.delete('/', (req, res) => {
        const dbPath = req.query.path || '';
        dbStorage.delete(dbPath);
        res.json({ success: true });
    });

    return router;
}

module.exports = { createDbRouter };
