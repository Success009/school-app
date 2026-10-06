const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 5050;

// Enable CORS and JSON body parsing
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Database file path
const DB_FILE = path.join(__dirname, 'db.json');

// Initialize database
let dbData = { school: { } };
if (fs.existsSync(DB_FILE)) {
    try {
        dbData = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch (e) {
        console.error("Error reading db.json, starting fresh:", e);
    }
} else {
    saveDatabase();
}

function saveDatabase() {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), 'utf8');
    } catch (e) {
        console.error("Error saving database:", e);
    }
}

// Path navigation helpers
function getParts(p) {
    if (!p) return [ ];
    return p.split('/').filter(Boolean);
}

function getValue(obj, pathStr) {
    const parts = getParts(pathStr);
    let curr = obj;
    for (const part of parts) {
        if (curr === null || curr === undefined || typeof curr !== 'object') {
            return null;
        }
        curr = curr[part];
    }
    return curr !== undefined ? curr : null;
}

function setValue(obj, pathStr, value) {
    const parts = getParts(pathStr);
    if (parts.length === 0) {
        return value;
    }
    let curr = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!(part in curr) || curr[part] === null || typeof curr[part] !== 'object') {
            curr[part] = { };
        }
        curr = curr[part];
    }
    const lastPart = parts[parts.length - 1];
    if (value === null) {
        delete curr[lastPart];
    } else {
        curr[lastPart] = value;
    }
    return obj;
}

function deleteValue(obj, pathStr) {
    const parts = getParts(pathStr);
    if (parts.length === 0) {
        return { };
    }
    let curr = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!(part in curr) || curr[part] === null || typeof curr[part] !== 'object') {
            return obj;
        }
        curr = curr[part];
    }
    const lastPart = parts[parts.length - 1];
    delete curr[lastPart];
    return obj;
}

// API Endpoints for DB
app.get('/api/db', (req, res) => {
    const dbPath = req.query.path || '';
    const val = getValue(dbData, dbPath);
    res.json(val);
});

app.post('/api/db', (req, res) => {
    const { path: dbPath, value } = req.body;
    dbData = setValue(dbData, dbPath, value);
    saveDatabase();
    res.json({ success: true });
});

app.patch('/api/db', (req, res) => {
    const { path: dbPath, value } = req.body;
    
    // value could be a map of updates (some might be nested paths)
    let parent = getValue(dbData, dbPath);
    if (!parent || typeof parent !== 'object') {
        parent = { };
        dbData = setValue(dbData, dbPath, parent);
    }

    for (const [key, val] of Object.entries(value)) {
        if (key.includes('/')) {
            setValue(parent, key, val);
        } else {
            if (val === null) {
                delete parent[key];
            } else {
                parent[key] = val;
            }
        }
    }
    saveDatabase();
    res.json({ success: true });
});

app.delete('/api/db', (req, res) => {
    const dbPath = req.query.path || '';
    dbData = deleteValue(dbData, dbPath);
    saveDatabase();
    res.json({ success: true });
});

// Create uploads directory
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Setup Multer for upload handling
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname) || '.jpg';
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
        cb(null, uniqueName);
    }
});
const upload = multer({ storage });

// API Endpoint for upload
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }
    // We serve static uploads folder, so construct absolute url or relative url
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
});

// Serve static uploads and application files
app.use('/uploads', express.static(UPLOADS_DIR));
app.use(express.static(__dirname));

// Fallback to index.html for undefined frontend routes
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`School App server listening on http://localhost:${PORT}`);
});