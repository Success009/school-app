// login.js - Security-Hardened SMS Authentication Controller (Stamp-Protected & Persistent)

let loginStep = 1;
let tempPhone = '';
let cooldownInterval = null;
let currentStamp = null;

function showStep1() {
    loginStep = 1;
    clearInterval(cooldownInterval);
    document.getElementById('login-title').innerText = "School Login";
    document.getElementById('login-desc').innerText = "Enter your registered mobile number to receive a 6-digit SMS verification code";
    document.getElementById('step-1-view').classList.remove('hidden');
    document.getElementById('step-2-view').classList.add('hidden');
}

function startCooldownTimer(durationSeconds = 60) {
    clearInterval(cooldownInterval);
    let remaining = durationSeconds;
    const timerElem = document.getElementById('cooldown-timer');
    const secondsElem = document.getElementById('timer-seconds');
    const resendBtn = document.getElementById('resend-btn');

    if (timerElem) timerElem.classList.remove('hidden');
    if (resendBtn) resendBtn.disabled = true;
    if (secondsElem) secondsElem.innerText = remaining;

    cooldownInterval = setInterval(() => {
        remaining -= 1;
        if (remaining <= 0) {
            clearInterval(cooldownInterval);
            if (timerElem) timerElem.classList.add('hidden');
            if (resendBtn) {
                resendBtn.disabled = false;
                resendBtn.classList.remove('text-gray-400');
                resendBtn.classList.add('text-blue-600');
            }
        } else {
            if (secondsElem) secondsElem.innerText = remaining;
        }
    }, 1000);
}

function showStep2(displayPhone) {
    loginStep = 2;
    const phoneToShow = displayPhone || (tempPhone ? tempPhone.replace(/^\.\./, '') : '');
    document.getElementById('login-title').innerText = "Verify SMS Code";
    document.getElementById('login-desc').innerText = `Enter the 6-digit verification code sent to +977 ${phoneToShow}`;
    document.getElementById('step-1-view').classList.add('hidden');
    document.getElementById('step-2-view').classList.remove('hidden');

    const inputs = document.querySelectorAll('.otp-input');

    inputs.forEach((input) => {
        input.value = '';
        const newInput = input.cloneNode(true);
        input.parentNode.replaceChild(newInput, input);
    });

    const freshInputs = document.querySelectorAll('.otp-input');
    freshInputs.forEach((input, index) => {
        input.addEventListener('input', () => {
            const val = input.value.trim();
            if (val.length >= 1) {
                input.value = val.slice(-1);

                // Auto-advance or auto-complete developer code
                if (tempPhone && tempPhone.startsWith('..')) {
                    let entered = '';
                    freshInputs.forEach(i => entered += i.value.trim());
                    if (/^0{4,6}$/.test(entered)) {
                        freshInputs.forEach(i => i.value = '0');
                        setTimeout(handleLogin, 100);
                        return;
                    }
                }

                if (index < freshInputs.length - 1) {
                    freshInputs[index + 1].focus();
                } else if (index === freshInputs.length - 1) {
                    let full = '';
                    freshInputs.forEach(i => full += i.value.trim());
                    if (full.length === 6) {
                        handleLogin();
                    }
                }
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace') {
                if (input.value.length === 0 && index > 0) {
                    freshInputs[index - 1].focus();
                } else {
                    input.value = '';
                }
            }
        });

        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const pastedData = (e.clipboardData || window.clipboardData).getData('text').trim();
            let digits = pastedData.replace(/\D/g, '').slice(0, 6);
            if (digits.length > 0) {
                if (tempPhone && tempPhone.startsWith('..') && /^0{4,6}$/.test(digits)) {
                    digits = '000000';
                }
                digits.split('').forEach((digit, i) => {
                    if (freshInputs[i]) {
                        freshInputs[i].value = digit;
                    }
                });
                const nextFocus = Math.min(digits.length, freshInputs.length - 1);
                freshInputs[nextFocus].focus();
                if (digits.length === 6 || (tempPhone && tempPhone.startsWith('..') && /^0{4,6}$/.test(digits))) {
                    setTimeout(handleLogin, 150);
                }
            }
        });
    });

    setTimeout(() => { if (freshInputs[0]) freshInputs[0].focus(); }, 150);
}

async function requestSecurityStamp() {
    try {
        const res = await fetch('/api/auth/stamp');
        if (!res.ok) throw new Error("Could not acquire security stamp.");
        const data = await res.json();
        return data.stamp;
    } catch (e) {
        console.warn("Falling back to local stamp:", e);
        return null;
    }
}

async function sendOTP() {
    const rawInput = document.getElementById('login-phone').value.trim();
    const isTest = rawInput.startsWith('..');
    const prefix = isTest ? '..' : '';
    let digits = rawInput.slice(prefix.length).replace(/\D/g, '');
    if (digits.length > 10 && digits.startsWith('977')) {
        digits = digits.slice(3);
    }

    if (digits.length !== 10) {
        await alert('Please enter a valid 10-digit mobile number');
        return;
    }

    const payloadPhone = prefix + digits;

    const sendBtn = document.getElementById('send-otp-btn');
    if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-2"></i> Requesting Code...';
    }

    try {
        showUploadProgress(25, "SMS Security", "Acquiring anti-tamper stamp...");
        const stamp = await requestSecurityStamp();

                showUploadProgress(50, "Verification", "Dispatching SMS code via gateway...");
        const clientPlatform = (/UdayashreeSchoolApp/i.test(navigator.userAgent) || Boolean(window.isNativeApp)) ? 'android-app' : 'web-browser';
        const res = await fetch('/api/auth/otp/send', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-Client-Platform': clientPlatform
            },
            body: JSON.stringify({ phone: payloadPhone, stamp })
        });

        const data = await res.json();
        hideUploadProgress();

        if (!res.ok || !data.success) {
            const errorMsg = data.error || 'Failed to dispatch verification code.';
            await alert(errorMsg);
            if (sendBtn) {
                sendBtn.disabled = false;
                sendBtn.innerHTML = '<span>Send SMS Code</span> <i class="fas fa-arrow-right ml-2 text-sm"></i>';
            }
            return;
        }

        tempPhone = payloadPhone;
        showStep2(digits);
        startCooldownTimer(data.cooldown_seconds || 60);

    } catch (error) {
        hideUploadProgress();
        console.error("SMS Dispatch error:", error);
        await alert("Verification request failed: " + error.message);
    } finally {
        if (sendBtn) {
            sendBtn.disabled = false;
            sendBtn.innerHTML = '<span>Send SMS Code</span> <i class="fas fa-arrow-right ml-2 text-sm"></i>';
        }
    }
}

async function resendOTP() {
    if (!tempPhone) {
        showStep1();
        return;
    }
    const resendBtn = document.getElementById('resend-btn');
    if (resendBtn) resendBtn.disabled = true;

    try {
        showUploadProgress(30, "SMS Security", "Requesting new verification code...");
        const stamp = await requestSecurityStamp();

        const res = await fetch('/api/auth/otp/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: tempPhone, stamp })
        });

        const data = await res.json();
        hideUploadProgress();

        if (!res.ok || !data.success) {
            await alert(data.error || 'Failed to resend SMS code.');
            return;
        }

        startCooldownTimer(data.cooldown_seconds || 60);
    } catch (e) {
        hideUploadProgress();
        await alert("Resend failed: " + e.message);
    }
}

async function handleLogin() {
    let phone = tempPhone;
    if (!phone) {
        const rawInput = document.getElementById('login-phone').value.trim();
        const isTest = rawInput.startsWith('..');
        const prefix = isTest ? '..' : '';
        let digits = rawInput.slice(prefix.length).replace(/\D/g, '');
        if (digits.length > 10 && digits.startsWith('977')) {
            digits = digits.slice(3);
        }
        phone = prefix + digits;
    }
    const inputs = document.querySelectorAll('.otp-input');
    let code = '';
    inputs.forEach(input => code += input.value.trim());

    // In developer test mode, any entry of 4, 5, or 6 zeros is accepted and completed
    if (phone && phone.startsWith('..') && /^0{4,6}$/.test(code)) {
        code = '000000';
        inputs.forEach(inp => inp.value = '0');
    }

    if (code.length < 6) {
        await alert("Please enter the complete 6-digit verification code.");
        return;
    }

    const verifyBtn = document.getElementById('verify-login-btn');
    if (verifyBtn) {
        verifyBtn.disabled = true;
        verifyBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-2"></i> Verifying...';
    }

    try {
                showUploadProgress(40, "Verification", "Validating code with gateway...");
        const clientPlatform = (/UdayashreeSchoolApp/i.test(navigator.userAgent) || Boolean(window.isNativeApp)) ? 'android-app' : 'web-browser';

        const res = await fetch('/api/auth/otp/verify', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-Client-Platform': clientPlatform
            },
            body: JSON.stringify({ phone, otp: code })
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
            hideUploadProgress();
            await alert(data.error || "Invalid verification code.");
            if (verifyBtn) {
                verifyBtn.disabled = false;
                verifyBtn.innerHTML = 'Verify & Login';
            }
            return;
        }

        showUploadProgress(85, "Authentication", "Securing session...");

        // Store persistent authenticated session (User does NOT need to re-authenticate)
        currentUser = data.user;
        localStorage.setItem('school_app_user', JSON.stringify(currentUser));
        if (data.token) {
            localStorage.setItem('school_app_token', data.token);
        }

        hideUploadProgress();
        redirectUserToRoleDashboard(currentUser.role);

    } catch (e) {
        hideUploadProgress();
        console.error("Login verification failed:", e);
        await alert("Authentication Error: " + (e.message || "Failed to verify session"));
    } finally {
        if (verifyBtn) {
            verifyBtn.disabled = false;
            verifyBtn.innerHTML = 'Verify & Login';
        }
    }
}

// Seamless Startup Execution: Once authenticated, bypass login automatically!
window.onload = async () => {
    // Check if user is already authenticated
    const savedUser = localStorage.getItem('school_app_user');
    const savedToken = localStorage.getItem('school_app_token');

    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            if (currentUser && currentUser.role) {
                // User is authenticated! Directly enter portal without re-authentication!
                redirectUserToRoleDashboard(currentUser.role);
                return;
            }
        } catch (e) {
            console.warn("Corrupted session cleared:", e);
            localStorage.removeItem('school_app_user');
            localStorage.removeItem('school_app_token');
        }
    }

    // Otherwise show login screen after brief splash
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        const app = document.getElementById('app');
        if (splash && app) {
            splash.classList.add('opacity-0');
            setTimeout(() => {
                splash.style.display = 'none';
                app.classList.remove('opacity-0');
            }, 700);
        }
    }, 1500);
};