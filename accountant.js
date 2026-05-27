// Accountant Sub-Application Logic (Dynamic Financial & Payment Reconciliation System)

// Check authorization on load
if (checkAuth([ROLES.ACCOUNTANT])) {
    document.addEventListener('DOMContentLoaded', () => {
        accountantRouter('dashboard');
    });
}

const accountantViews = {
    dashboard: {
        title: 'Financial Management',
        render: () => `
            <div class="mb-6 flex justify-between items-center">
                <div>
                    <h2 class="text-2xl font-black text-gray-800">Accounts Portal</h2>
                    <p class="text-xs text-green-600 font-bold uppercase mt-1">Financial Reconciliation Panel</p>
                </div>
                <button onclick="handleLogout()" class="text-gray-400 hover:text-red-500 active:scale-95 transition-transform">
                    <i class="fas fa-sign-out-alt text-lg"></i>
                </button>
            </div>

            <!-- DYNAMIC METRICS BOARD -->
            <div class="mobile-card bg-emerald-600 text-white p-6 mb-6 shadow-md relative overflow-hidden">
                <div class="absolute right-0 top-0 opacity-10 p-4">
                    <i class="fas fa-wallet text-8xl"></i>
                </div>
                <p class="text-emerald-200 text-xs font-bold uppercase tracking-wider mb-1">Live Collection (This Month)</p>
                <h3 id="act-monthly-collect" class="text-3xl font-black mb-3">Rs. 0</h3>
                <div class="flex items-center text-xs text-emerald-100 mt-2 pt-2 border-t border-white/10">
                    <span id="act-outstanding-collect" class="font-bold">Pending Outstanding Dues: Rs. 0</span>
                </div>
            </div>

            <h3 class="font-bold text-gray-800 mb-4 px-1">Administrative Actions</h3>
            <div class="grid grid-cols-2 gap-4 mb-6">
                <button onclick="batchGenerateTuitionBills()" class="mobile-card flex flex-col items-center justify-center p-5 text-emerald-600 bg-white hover:bg-gray-50 active:scale-98 transition-all shadow-sm border border-gray-100">
                    <i class="fas fa-file-invoice text-xl mb-2"></i>
                    <span class="text-[10px] font-black uppercase">Batch Billing</span>
                </button>
                <button onclick="accountantRouter('defaulters')" class="mobile-card flex flex-col items-center justify-center p-5 text-red-600 bg-white hover:bg-gray-50 active:scale-98 transition-all shadow-sm border border-gray-100">
                    <i class="fas fa-exclamation-triangle text-xl mb-2"></i>
                    <span class="text-[10px] font-black uppercase">Ledger & Defaulters</span>
                </button>
            </div>

            <div class="mobile-card bg-blue-50/50 border-none shadow-none text-xs p-4 mb-4">
                <h4 class="font-bold text-blue-800 mb-1 flex items-center gap-1">
                    <i class="fas fa-info-circle text-xs"></i> Accounts Instructions
                </h4>
                <p class="text-blue-700 leading-relaxed leading-relaxed">
                    Click **Batch Billing** to automatically generate a monthly tuition invoice (Rs. 3,000) for all students. Click **Ledger & Defaulters** to review individual student credit logs and record manual payment checks.
                </p>
            </div>
        `
    },
    defaulters: {
        title: 'Dues Ledgers Directory',
        render: () => `
            <div class="mb-4 space-y-3">
                <div class="relative">
                    <input type="text" onkeyup="filterList(this, 'defaulter-list')" class="w-full p-4 bg-white border border-gray-100 rounded-xl shadow-sm outline-none pl-12 text-sm" placeholder="Search student name or ID...">
                    <i class="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"></i>
                </div>
                <div class="mobile-card flex items-center justify-between !py-2 bg-white shadow-sm border border-gray-100">
                    <label class="text-[10px] font-bold text-gray-400 uppercase">Sort by Class</label>
                    <select id="def-class-select" onchange="loadDefaultersList()" class="p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold outline-none">
                        <option value="all">All Classes</option>
                        <option value="10-A">Class 10-A</option>
                        <option value="9-B">Class 9-B</option>
                    </select>
                </div>
            </div>

            <div id="defaulter-list" class="space-y-3 pb-16">
                <div class="text-center py-10 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Syncing financial registers...</div>
            </div>

            <button onclick="accountantRouter('dashboard')" class="w-full text-gray-400 font-bold py-6 text-xs text-center block">
                <i class="fas fa-arrow-left mr-1"></i> Back to Dashboard
            </button>
        `
    },
    ledgerDetails: {
        title: 'Credit Ledger Statement',
        render: () => `
            <div id="ledger-statement-container" class="space-y-4 pb-16">
                <div class="text-center py-10 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Loading student statement...</div>
            </div>
            <button onclick="accountantRouter('defaulters')" class="w-full text-gray-400 font-bold py-6 text-xs text-center block">
                <i class="fas fa-arrow-left mr-1"></i> Back to Directory
            </button>
        `
    }
};

function accountantRouter(viewName) {
    const view = accountantViews[viewName] || accountantViews.dashboard;
    
    const backAction = (viewName !== 'dashboard') ? () => accountantRouter('dashboard') : null;

    renderHeader(view.title, backAction);
    triggerViewTransition();
    triggerViewTransition();

    // Render contents into main
    document.getElementById('main-content').innerHTML = view.render();

    if (viewName === 'dashboard') {
        loadAccountantDashboard();
    }

    if (viewName === 'defaulters') {
        loadDefaultersList();
    }

    document.getElementById('main-content').scrollTop = 0;
}

// ==========================================
// BUSINESS LOGIC: FINANCIAL & PAYMENT SYSTEMS
// ==========================================

async function loadAccountantDashboard() {
    const collEl = document.getElementById('act-monthly-collect');
    const outEl = document.getElementById('act-outstanding-collect');
    if (!collEl || !outEl) return;

    try {
        // Query payments this month
        const paySnap = await db.ref('school/payment_history').once('value');
        const payRecords = paySnap.val();

        let monthlyTotal = 0;
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();

        if (payRecords) {
            for (const [studentId, payments] of Object.entries(payRecords)) {
                if (payments) {
                    for (const p of Object.values(payments)) {
                        const pDate = new Date(p.timestamp);
                        if (pDate.getMonth() === thisMonth && pDate.getFullYear() === thisYear) {
                            monthlyTotal += parseFloat(p.amount) || 0;
                        }
                    }
                }
            }
        }

        // Query outstanding balances
        const ledSnap = await db.ref('school/fee_ledgers').once('value');
        const ledgers = ledSnap.val();

        let outstandingTotal = 0;
        if (ledgers) {
            for (const ledger of Object.values(ledgers)) {
                outstandingTotal += parseFloat(ledger.balance) || 0;
            }
        }

        collEl.innerText = SafeResolvers.currency(monthlyTotal);
        outEl.innerText = `Pending Outstanding Dues: ${SafeResolvers.currency(outstandingTotal)}`;

    } catch (e) {
        console.error(e);
    }
}

async function loadDefaultersList() {
    const list = document.getElementById('defaulter-list');
    const sortVal = document.getElementById('def-class-select')?.value || 'all';
    if (!list) return;

    list.innerHTML = `<div class="text-center py-10 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Querying student records...</div>`;

    try {
        const studSnap = await db.ref('school/students').once('value');
        const students = studSnap.val();

        const ledSnap = await db.ref('school/fee_ledgers').once('value');
        const ledgers = ledSnap.val() || { };

        if (!students) {
            list.innerHTML = `<div class="text-center py-10 text-gray-400 text-xs italic bg-white rounded-xl border border-gray-100 p-6">No registered student directories.</div>`;
            return;
        }

        let studentEntries = Object.entries(students);

        if (sortVal !== 'all') {
            let targetClass = sortVal;
            let targetSection = "General";
            if (sortVal.includes('-')) {
                const parts = sortVal.split('-');
                targetClass = parts[0];
                targetSection = parts[1];
            }
            studentEntries = studentEntries.filter(([id, data]) => {
                return String(data.class) === String(targetClass) && String(data.section) === String(targetSection);
            });
        }

        if (studentEntries.length === 0) {
            list.innerHTML = `<div class="text-center py-8 text-yellow-600 bg-yellow-50 rounded-xl text-xs p-4 border border-yellow-100">No student ledgers match Class ${sortVal}.</div>`;
            return;
        }

        studentEntries.sort((a, b) => {
            const nameA = (a[1].name?.first || a[1].name || '').toLowerCase();
            const nameB = (b[1].name?.first || b[1].name || '').toLowerCase();
            return nameA.localeCompare(nameB);
        });

        list.innerHTML = studentEntries.map(([studentId, s]) => {
            let fullName = '';
            if (s.name && typeof s.name === 'object') {
                fullName = `${s.name.first || ''} ${s.name.middle || ''} ${s.name.last || ''}`.replace(/\s+/g, ' ').trim();
            } else {
                fullName = s.name || 'Student';
            }

            const ledger = ledgers[studentId] || { balance: 0 };
            const bal = ledger.balance || 0;
            const balStyle = bal > 0 ? 'text-red-600 font-black' : 'text-gray-400 font-bold';

            return `
                <div onclick="viewStudentLedgerDetails('${studentId}')" class="mobile-card list-item flex justify-between items-center bg-white shadow-sm border border-gray-100 cursor-pointer hover:bg-gray-50 active:scale-98 transition-all">
                    <div class="flex items-center">
                        <img src="${SafeResolvers.photo(s.photo)}" class="w-10 h-10 rounded-lg object-cover mr-3 border border-gray-100 shadow-sm">
                        <div>
                            <h4 class="font-bold text-gray-800 text-xs">${fullName}</h4>
                            <p class="text-[8px] text-gray-400 font-bold uppercase mt-0.5">Class ${s.class}-${s.section} | ID: ${studentId}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <span class="text-xs ${balStyle}">${SafeResolvers.currency(bal)}</span>
                        <p class="text-[7px] text-gray-300 font-bold uppercase">Balance</p>
                    </div>
                </div>
            `;
        }).join('');

    } catch (e) {
        console.error(e);
        list.innerHTML = `<div class="text-center py-10 text-red-400">Failed to render ledgers: ${e.message}</div>`;
    }
}

async function viewStudentLedgerDetails(studentId) {
    accountantRouter('ledgerDetails');
    const container = document.getElementById('ledger-statement-container');
    if (!container) return;

    container.innerHTML = `<div class="text-center py-10 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Loading credit statement...</div>`;

    try {
        const sSnap = await db.ref('school/students/' + studentId).once('value');
        const s = sSnap.val();

        const ledSnap = await db.ref('school/fee_ledgers/' + studentId).once('value');
        const ledger = ledSnap.val();

        if (!s) {
            container.innerHTML = `<div class="text-center py-10 text-red-400">Student not found.</div>`;
            return;
        }

        let fullName = '';
        if (s.name && typeof s.name === 'object') {
            fullName = `${s.name.first || ''} ${s.name.middle || ''} ${s.name.last || ''}`.replace(/\s+/g, ' ').trim();
        } else {
            fullName = s.name || 'Student';
        }

        const bal = ledger ? ledger.balance : 0;
        const invoicesList = ledger && ledger.invoices ? Object.values(ledger.invoices) : [ ];

        const invoicesHtml = invoicesList.length === 0 
            ? `<p class="text-xs text-gray-400 italic text-center py-4 bg-gray-50 rounded-xl border border-dashed">No invoices billed to this student.</p>` 
            : invoicesList.map(inv => {
                const isPaid = inv.status === 'Paid';
                const badgeClass = isPaid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700";

                return `
                    <div class="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs">
                        <div>
                            <h5 class="font-bold text-gray-800">${inv.title}</h5>
                            <span class="text-[8px] text-gray-400 font-bold uppercase mt-0.5">Due: ${new Date(inv.deadline).toLocaleDateString()}</span>
                        </div>
                        <div class="text-right">
                            <span class="font-black text-gray-800">${SafeResolvers.currency(inv.amount)}</span>
                            <div class="mt-1 flex justify-end">
                                <span class="px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase ${badgeClass}">${inv.status}</span>
                                ${!isPaid ? `<button onclick="recordOfflinePayment('${studentId}', '${inv.id}', ${inv.amount})" class="ml-2 px-2 py-0.5 bg-green-600 text-white font-black rounded text-[8px] uppercase active:scale-95 transition-all">Clear</button>` : ''}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

        container.innerHTML = `
            <div class="mobile-card flex items-center bg-white shadow-sm border border-gray-100">
                <img src="${SafeResolvers.photo(s.photo)}" class="w-14 h-14 rounded-2xl object-cover mr-4 border border-gray-100 shadow-sm">
                <div>
                    <h3 class="font-black text-gray-800 text-lg">${fullName}</h3>
                    <p class="text-xs text-gray-500 font-bold uppercase tracking-widest mt-0.5">Class ${s.class}-${s.section} | ID: ${studentId}</p>
                </div>
            </div>

            <!-- OUTSTANDING BALANCE SUMMARY -->
            <div class="mobile-card bg-gray-800 text-white text-center p-6 shadow shadow-sm relative overflow-hidden">
                <p class="text-gray-400 text-[10px] font-bold uppercase">Statement Dues</p>
                <h3 class="text-3xl font-black mt-1">${SafeResolvers.currency(bal)}</h3>
            </div>

            <!-- INVOICES STATEMENT -->
            <div class="mobile-card space-y-3">
                <h4 class="text-xs font-black uppercase text-gray-400 tracking-wider">Debit Invoices Statement</h4>
                <div class="space-y-2">
                    ${invoicesHtml}
                </div>
            </div>

            <!-- MANUAL AD-HOC DEBIT BILLING -->
            <div class="mobile-card space-y-3">
                <h4 class="text-xs font-black uppercase text-blue-600 tracking-wider">Charge Manual Ad-Hoc Debit</h4>
                <div class="space-y-3 pt-1">
                    <div>
                        <label class="block text-[8px] font-bold text-gray-400 uppercase mb-0.5">Invoice Title / Description</label>
                        <input type="text" id="manual-inv-title" class="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold outline-none" placeholder="e.g. Science Lab damage fee">
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-[8px] font-bold text-gray-400 uppercase mb-0.5">Debit Amount (Rs.)</label>
                            <input type="number" id="manual-inv-amount" class="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold outline-none" placeholder="e.g. 500">
                        </div>
                        <div>
                            <label class="block text-[8px] font-bold text-gray-400 uppercase mb-0.5">Deadline Date</label>
                            <input type="date" id="manual-inv-deadline" value="2026-06-30" class="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold outline-none">
                        </div>
                    </div>
                    <button onclick="billManualInvoice('${studentId}')" class="w-full bg-blue-700 text-white font-black py-3 rounded-xl text-xs shadow active:scale-95 transition-all">
                        <i class="fas fa-plus mr-1"></i> Post Debit Invoice
                    </button>
                </div>
            </div>
        `;

    } catch (e) {
        console.error(e);
        container.innerHTML = `<div class="text-center py-10 text-red-400">Failed to render credit statement: ${e.message}</div>`;
    }
}

async function recordOfflinePayment(studentId, invoiceId, amount) {
    if (!confirm(`Settle this invoice manually? This assumes cash/cheque of ${SafeResolvers.currency(amount)} has been collected.`)) return;

    const paymentId = "PAY-" + Math.floor(100000 + Math.random() * 900000);
    const recCode = "MAN-" + Math.floor(10000000 + Math.random() * 90000000);

    try {
        const snap = await db.ref(`school/fee_ledgers/${studentId}`).once('value');
        const ledger = snap.val();

        if (!ledger) return;

        const updates = { };
        updates[`school/fee_ledgers/${studentId}/invoices/${invoiceId}/status`] = 'Paid';
        updates[`school/fee_ledgers/${studentId}/balance`] = Math.max(0, ledger.balance - amount);

        const paymentRecord = {
            id: paymentId,
            invoiceId,
            title: ledger.invoices[invoiceId].title + " (Cash)",
            amount,
            method: "Offline Cash / Check",
            reconciliationCode: recCode,
            status: "Verified",
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };
        updates[`school/payment_history/${studentId}/${paymentId}`] = paymentRecord;

        await db.ref().update(updates);
        alert(`Payment recorded manually!\nReceipt ID: ${paymentId}`);
        viewStudentLedgerDetails(studentId);

    } catch (e) {
        console.error(e);
        alert("Failed to record payment: " + e.message);
    }
}

async function billManualInvoice(studentId) {
    const titleInput = document.getElementById('manual-inv-title');
    const amtInput = document.getElementById('manual-inv-amount');
    const dateInput = document.getElementById('manual-inv-deadline');

    if (!titleInput || !amtInput || !dateInput) return;

    const title = titleInput.value.trim();
    const amount = parseFloat(amtInput.value);
    const deadline = dateInput.value;

    if (!title || isNaN(amount) || amount <= 0 || !deadline) {
        alert("Please fill in invoice title, amount, and deadline!");
        return;
    }

    try {
        const snap = await db.ref(`school/fee_ledgers/${studentId}`).once('value');
        let ledger = snap.val();

        if (!ledger) {
            // Setup blank ledger
            ledger = {
                studentId,
                balance: 0,
                invoices: { }
            };
        }

        const invId = "inv_" + Date.now();
        const invoiceRecord = {
            id: invId,
            title,
            amount,
            status: "Unpaid",
            deadline
        };

        const updates = { };
        updates[`school/fee_ledgers/${studentId}/invoices/${invId}`] = invoiceRecord;
        updates[`school/fee_ledgers/${studentId}/balance`] = (ledger.balance || 0) + amount;

        await db.ref().update(updates);
        alert(`Manual debit invoice successfully billed to student!`);
        viewStudentLedgerDetails(studentId);

    } catch (e) {
        console.error(e);
        alert("Failed to bill invoice: " + e.message);
    }
}

async function batchGenerateTuitionBills() {
    if (!confirm("Are you sure you want to run batch billing?\nThis will generate a monthly Tuition Fee invoice (Rs. 3,000) for ALL registered students!")) return;

    try {
        const stuSnap = await db.ref('school/students').once('value');
        const students = stuSnap.val();

        if (!students) {
            alert("No registered students found in database to bill!");
            return;
        }

        const ledSnap = await db.ref('school/fee_ledgers').once('value');
        const ledgers = ledSnap.val() || { };

        const timestamp = Date.now();
        const invId = "inv_" + timestamp;
        const deadline = "2026-06-15"; // Mid-June deadline

        const updates = { };
        let billedCount = 0;

        for (const [studentId, s] of Object.entries(students)) {
            const studentLedger = ledgers[studentId] || { balance: 0 };
            
            const invoiceRecord = {
                id: invId,
                title: "Tuition Fee (June 2026)",
                amount: 3000,
                status: "Unpaid",
                deadline
            };

            updates[`school/fee_ledgers/${studentId}/invoices/${invId}`] = invoiceRecord;
            updates[`school/fee_ledgers/${studentId}/balance`] = (studentLedger.balance || 0) + 3000;
            updates[`school/fee_ledgers/${studentId}/studentId`] = studentId;
            updates[`school/fee_ledgers/${studentId}/studentName`] = s.name && typeof s.name === 'object' 
                ? `${s.name.first || ''} ${s.name.middle || ''} ${s.name.last || ''}`.replace(/\s+/g, ' ').trim()
                : s.name || 'Student';
            updates[`school/fee_ledgers/${studentId}/classSection`] = `${s.class}-${s.section}`;

            billedCount++;
        }

        await db.ref().update(updates);
        alert(`Batch billing completed! Generated ${billedCount} tuition bills of Rs. 3,000 each!`);
        loadAccountantDashboard();

    } catch (e) {
        console.error(e);
        alert("Batch billing failed: " + e.message);
    }
}