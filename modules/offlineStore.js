/**
 * Offline Data Storage & Resilience Service
 * 
 * ARCHITECTURAL RATIONALE:
 * In areas with intermittent connectivity, parents must be able to view their children's
 * report cards, attendance records, and emergency notices even when disconnected.
 * Similarly, teachers must be able to view class rosters offline.
 * 
 * DESIGN PRINCIPLES:
 * 1. Self-contained: Zero external dependencies; operates purely on localStorage/IndexedDB.
 * 2. Non-blocking: Read and write operations never block UI rendering.
 * 3. Cache metadata: Every stored entity is stamped with cachedAt timestamp and version.
 * 4. Stale-while-revalidate: Serves cached copy immediately, updates silently when network returns.
 */

export class OfflineStore {
    static PREFIX = 'school_offline_';
    static DEFAULT_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days offline cache

    /**
     * Check if client currently has active network connectivity.
     */
    static isOnline() {
        if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
            return navigator.onLine;
        }
        return true;
    }

    /**
     * Store an entity in offline storage with cache metadata.
     * @param {string} category 'student', 'teacher', 'notices', or 'config'
     * @param {string} id Unique identifier or 'all'
     * @param {*} data Plain JavaScript object or array
     */
    static save(category, id, data) {
        if (typeof localStorage === 'undefined' || !data) return false;
        try {
            const key = `${this.PREFIX}${category}_${id}`;
            const envelope = {
                cachedAt: Date.now(),
                version: '1.0',
                category,
                id,
                payload: data
            };
            localStorage.setItem(key, JSON.stringify(envelope));
            return true;
        } catch (err) {
            console.warn('[OfflineStore] Failed to write offline cache (quota exceeded?):', err);
            return false;
        }
    }

    /**
     * Retrieve an entity from offline storage.
     * @param {string} category 
     * @param {string} id 
     * @returns {{ data: *, cachedAt: number, isOffline: boolean, ageMs: number } | null}
     */
    static get(category, id) {
        if (typeof localStorage === 'undefined') return null;
        try {
            const key = `${this.PREFIX}${category}_${id}`;
            const raw = localStorage.getItem(key);
            if (!raw) return null;

            const envelope = JSON.parse(raw);
            const ageMs = Date.now() - envelope.cachedAt;

            return {
                data: envelope.payload,
                cachedAt: envelope.cachedAt,
                isOffline: !this.isOnline(),
                ageMs: ageMs,
                isExpired: ageMs > this.DEFAULT_TTL_MS
            };
        } catch (err) {
            console.error('[OfflineStore] Error reading cached record:', err);
            return null;
        }
    }

    /**
     * Helper: Cache student records (profile, grades, attendance)
     */
    static cacheStudentRecord(studentId, studentData) {
        return this.save('student', studentId, studentData);
    }

    /**
     * Helper: Retrieve cached student records
     */
    static getStudentRecord(studentId) {
        return this.get('student', studentId);
    }

    /**
     * Helper: Cache teacher class roster
     */
    static cacheTeacherRoster(teacherId, rosterData) {
        return this.save('teacher', teacherId, rosterData);
    }

    /**
     * Helper: Retrieve cached teacher class roster
     */
    static getTeacherRoster(teacherId) {
        return this.get('teacher', teacherId);
    }

    /**
     * Helper: Cache school notices
     */
    static cacheNotices(noticesArray) {
        return this.save('notices', 'latest', noticesArray);
    }

    /**
     * Helper: Retrieve cached notices
     */
    static getCachedNotices() {
        return this.get('notices', 'latest');
    }

    /**
     * Render an informative offline status badge into the given container element.
     * Informs parents/teachers that data is from a local cached copy.
     */
    static renderOfflineBadge(container, cachedAt) {
        if (!container) return;
        const existing = container.querySelector('.offline-cache-badge');
        if (existing) existing.remove();

        const badge = document.createElement('div');
        badge.className = 'offline-cache-badge flex items-center justify-between bg-amber-500/10 border border-amber-500/30 text-amber-700 px-4 py-2.5 rounded-xl text-xs font-semibold my-3';
        
        const dateStr = cachedAt ? new Date(cachedAt).toLocaleDateString() : 'earlier';
        badge.innerHTML = `
            <div class="flex items-center gap-2">
                <i class="fas fa-bolt text-amber-500 animate-pulse"></i>
                <span>Offline Mode &bull; Showing cached record from ${dateStr}</span>
            </div>
            <span class="bg-amber-500/20 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">Local Copy</span>
        `;
        container.prepend(badge);
    }
}

if (typeof window !== 'undefined') {
    window.OfflineStore = OfflineStore;
}
