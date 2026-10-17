/**
 * Server-Side JSON Database Persistence Engine
 * 
 * ARCHITECTURAL RATIONALE:
 * Uses atomic write-to-temp-and-rename mechanics to protect db.json against
 * partial writes during server crash, process kill, or unhandled exceptions.
 */

const fs = require('fs');
const path = require('path');

class DbStorageService {
    constructor(dbFilePath = path.join(__dirname, '..', 'db.json')) {
        this.dbFilePath = dbFilePath;
        this.data = { school: {} };
        this.load();
    }

    load() {
        if (fs.existsSync(this.dbFilePath)) {
            try {
                const raw = fs.readFileSync(this.dbFilePath, 'utf8');
                this.data = JSON.parse(raw);
                if (!this.data || typeof this.data !== 'object') {
                    this.data = { school: {} };
                }
            } catch (err) {
                console.error("[DbStorageService] Error reading database file; creating backup and initializing empty state:", err);
                try {
                    fs.copyFileSync(this.dbFilePath, `${this.dbFilePath}.corrupt-${Date.now()}`);
                } catch (backupErr) {
                    console.error("[DbStorageService] Could not backup corrupt database file:", backupErr);
                }
                this.data = { school: {} };
                this.save();
            }
        } else {
            this.save();
        }
        return this.data;
    }

    save() {
        const tempPath = `${this.dbFilePath}.tmp-${Date.now()}`;
        try {
            const serialized = JSON.stringify(this.data, null, 2);
            fs.writeFileSync(tempPath, serialized, 'utf8');
            fs.renameSync(tempPath, this.dbFilePath);
            return true;
        } catch (err) {
            console.error("[DbStorageService] Failed to write database atomically:", err);
            if (fs.existsSync(tempPath)) {
                try { fs.unlinkSync(tempPath); } catch (e) {}
            }
            return false;
        }
    }

    static getParts(p) {
        if (!p) return [];
        return String(p).split('/').filter(Boolean);
    }

    get(pathStr) {
        const parts = DbStorageService.getParts(pathStr);
        let curr = this.data;
        for (const part of parts) {
            if (curr === null || curr === undefined || typeof curr !== 'object') {
                return null;
            }
            curr = curr[part];
        }
        return curr !== undefined ? curr : null;
    }

    set(pathStr, value) {
        const parts = DbStorageService.getParts(pathStr);
        if (parts.length === 0) {
            this.data = (value && typeof value === 'object') ? value : { school: {} };
            this.save();
            return this.data;
        }

        let curr = this.data;
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!(part in curr) || curr[part] === null || typeof curr[part] !== 'object') {
                curr[part] = {};
            }
            curr = curr[part];
        }

        const lastPart = parts[parts.length - 1];
        if (value === null) {
            delete curr[lastPart];
        } else {
            curr[lastPart] = value;
        }

        this.save();
        return this.data;
    }

    patch(pathStr, patchObject) {
        if (!patchObject || typeof patchObject !== 'object') {
            return this.data;
        }

        let target = this.get(pathStr);
        if (!target || typeof target !== 'object') {
            target = {};
            this.set(pathStr, target);
        }

        for (const [key, val] of Object.entries(patchObject)) {
            if (key.includes('/')) {
                const subParts = DbStorageService.getParts(key);
                let subCurr = target;
                for (let i = 0; i < subParts.length - 1; i++) {
                    const sp = subParts[i];
                    if (!subCurr[sp] || typeof subCurr[sp] !== 'object') subCurr[sp] = {};
                    subCurr = subCurr[sp];
                }
                const lastSub = subParts[subParts.length - 1];
                if (val === null) delete subCurr[lastSub];
                else subCurr[lastSub] = val;
            } else {
                if (val === null) {
                    delete target[key];
                } else {
                    target[key] = val;
                }
            }
        }

        this.save();
        return this.data;
    }

    delete(pathStr) {
        const parts = DbStorageService.getParts(pathStr);
        if (parts.length === 0) {
            this.data = { school: {} };
            this.save();
            return this.data;
        }

        let curr = this.data;
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!(part in curr) || curr[part] === null || typeof curr[part] !== 'object') {
                return this.data;
            }
            curr = curr[part];
        }

        const lastPart = parts[parts.length - 1];
        delete curr[lastPart];
        this.save();
        return this.data;
    }

    getRawData() {
        return this.data;
    }
}

module.exports = { DbStorageService };
