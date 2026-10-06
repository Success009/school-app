// modules/api.js - Robust HTTP client service with offline caching and retry boundaries

export class APIService {
    static async request(url, options = { }) {
        const retries = options.retries || 3;
        const delay = options.delay || 1000;
        
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                if (!navigator.onLine) {
                    throw new Error("Device is offline");
                }
                const response = await fetch(url, options);
                if (!response.ok) {
                    throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
                }
                return await response.json();
            } catch (error) {
                console.warn(`API Request attempt ${attempt} failed for ${url}:`, error);
                if (attempt === retries) {
                    this.showNetworkWarning(error.message);
                    throw error;
                }
                await new Promise(resolve => setTimeout(resolve, delay * attempt));
            }
        }
    }

    static async get(path) {
        return this.request(`/api/db?path=${encodeURIComponent(path)}`);
    }

    static async post(path, value) {
        return this.request('/api/db', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path, value })
        });
    }

    static async patch(path, value) {
        return this.request('/api/db', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path, value })
        });
    }

    static async delete(path) {
        return this.request(`/api/db?path=${encodeURIComponent(path)}`, {
            method: 'DELETE'
        });
    }

    static async upload(path, file, onProgress = null) {
        return new Promise((resolve, reject) => {
            if (!navigator.onLine) {
                return reject(new Error("Device is offline"));
            }
            const xhr = new XMLHttpRequest();
            xhr.open('POST', `/api/upload?path=${encodeURIComponent(path)}`);

            if (onProgress) {
                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        onProgress(e.loaded, e.total);
                    }
                });
            }

            xhr.addEventListener('error', () => {
                reject(new Error("Network upload error"));
            });

            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const resp = JSON.parse(xhr.responseText);
                        resolve(resp.url);
                    } catch (e) {
                        reject(e);
                    }
                } else {
                    reject(new Error(`Upload failed with status ${xhr.status}`));
                }
            });

            const formData = new FormData();
            formData.append('file', file);
            xhr.send(formData);
        });
    }

    static showNetworkWarning(message) {
        console.error("Critical Network Warning:", message);
        if (typeof document === 'undefined') return;
        let warningToast = document.getElementById('network-warning-toast');
        if (!warningToast) {
            warningToast = document.createElement('div');
            warningToast.id = 'network-warning-toast';
            warningToast.className = 'fixed bottom-4 right-4 z-[99999] bg-red-600 text-white font-bold p-4 rounded-xl shadow-2xl flex items-center gap-3';
            document.body.appendChild(warningToast);
        }
        warningToast.innerHTML = `
            <i class="fas fa-exclamation-triangle text-xl"></i>
            <div>
                <p class="text-xs uppercase tracking-wider font-black">Connection Trouble</p>
                <p class="text-[10px] opacity-80">${message}</p>
            </div>
        `;
        setTimeout(() => {
            if (warningToast && warningToast.parentNode) {
                warningToast.parentNode.removeChild(warningToast);
            }
        }, 5000);
    }
}