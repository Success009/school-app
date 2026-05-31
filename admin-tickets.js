// Admin Help Desk Tickets Module

async function loadHelpDeskTicketsList() {
    const container = document.getElementById('admin-helpdesk-list');
    if (!container) return;

    try {
        const snap = await db.ref('school/tickets').once('value');
        const tickets = snap.val();

        if (!tickets) {
            container.innerHTML = `<div class="text-center py-10 text-gray-400 text-xs italic bg-white rounded-xl border border-gray-100 p-6">No support tickets raised yet.</div>`;
            return;
        }

        const ticketList = Object.values(tickets);
        ticketList.sort((a, b) => b.timestamp - a.timestamp);

        container.innerHTML = ticketList.map(t => {
            const isResolved = t.status === 'Resolved';
            const badgeClass = isResolved ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700";
            const priorityClass = t.priority === 'High' ? 'text-red-600 font-black' : (t.priority === 'Medium' ? 'text-orange-500 font-bold' : 'text-gray-400');

            return `
                <div onclick="viewTicketDetails('${t.id}')" class="mobile-card border-l-4 ${isResolved ? 'border-green-500' : 'border-yellow-500'} bg-white cursor-pointer hover:bg-gray-50 transition-colors relative overflow-hidden">
                    <div class="flex justify-between items-center">
                        <span class="text-[8px] font-black text-gray-400 uppercase tracking-widest">${t.category} | ${t.id}</span>
                        <span class="px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${badgeClass}">${t.status}</span>
                    </div>
                    <h4 class="font-bold text-gray-800 text-sm mt-1">${t.title}</h4>
                    <p class="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">${t.description}</p>
                    
                    <div class="flex justify-between items-center mt-3 pt-2 border-t border-gray-50 text-[8px] font-bold text-gray-400 uppercase">
                        <span>From: ${t.parentName} (${t.studentName})</span>
                        <span class="${priorityClass}">P: ${t.priority}</span>
                    </div>
                </div>
            `;
        }).join('');

    } catch (e) {
        console.error(e);
        container.innerHTML = `<div class="text-center py-10 text-red-400">Error loading help desk logs: ${e.message}</div>`;
    }
}

async function viewTicketDetails(ticketId) {
    adminRouter('studentDetails'); // Reuse the same page-sized container
    const container = document.getElementById('student-profile-container');
    if (!container) return;

    container.innerHTML = `<div class="text-center py-10 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Fetching ticket info...</div>`;

    try {
        const snap = await db.ref('school/tickets/' + ticketId).once('value');
        const t = snap.val();

        if (!t) {
            container.innerHTML = `<div class="text-center py-10 text-red-400">Ticket not found.</div>`;
            return;
        }

        const isResolved = t.status === 'Resolved';
        const badgeClass = isResolved ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700";

        let repliesList = [ ];
        if (t.replies) {
            repliesList = Array.isArray(t.replies) ? t.replies : Object.values(t.replies);
        }

        const repliesHtml = repliesList.map(r => `
            <div class="p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs">
                <div class="flex justify-between text-[9px] font-bold text-gray-400 uppercase mb-1">
                    <span>${r.sender}</span>
                    <span>${convertToNepaliDateTime(r.timestamp)}</span>
                </div>
                <p class="text-gray-700 leading-relaxed">${r.message}</p>
            </div>
        `).join('');
    

        container.innerHTML = `
            <div class="mb-4">
                <span class="text-[8px] font-black text-gray-400 uppercase tracking-widest">${t.category} | ${t.id}</span>
                <div class="flex items-center gap-2 mt-1">
                    <h2 class="text-xl font-black text-gray-800">${t.title}</h2>
                    <span class="px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${badgeClass}">${t.status}</span>
                </div>
            </div>

            <!-- Parent/Student Details -->
            <div class="mobile-card space-y-2 mb-4 bg-blue-50/50 border-none shadow-none text-xs">
                <div><span class="font-bold text-gray-400 uppercase text-[8px] block">Raised By Parent</span><span class="font-black text-gray-800">${t.parentName} (Phone: ${t.parentPhone})</span></div>
                <div><span class="font-bold text-gray-400 uppercase text-[8px] block">For Student</span><span class="font-black text-gray-800">${t.studentName} (ID: ${t.studentId})</span></div>
            </div>

            <!-- Description -->
            <div class="mobile-card mb-4 bg-white border border-gray-100 shadow-sm">
                <span class="font-bold text-gray-400 uppercase text-[8px] block mb-1">Issue Description</span>
                <p class="text-xs text-gray-700 leading-relaxed">${t.description}</p>
                <div class="text-[9px] font-bold text-gray-400 uppercase mt-3 pt-2 border-t border-gray-50 flex justify-between">
                    <span>Priority: ${t.priority}</span>
                    <span>Raised: ${convertToNepaliDate(t.timestamp)}</span>
                </div>

            <!-- Replies / Discussion -->
            <div class="mb-6 space-y-3">
                <h3 class="text-xs font-black uppercase text-gray-400 tracking-wider">Discussion Thread (${repliesList.length})</h3>
                <div class="space-y-2">
                    ${repliesList.length === 0 ? `<p class="text-xs text-gray-400 italic py-2 text-center">No messages in discussion yet.</p>` : repliesHtml}
                </div>
            </div>

            <!-- Admin Reply Console -->
            <div class="mobile-card space-y-3 shadow-md border border-gray-100">
                <h4 class="text-xs font-black uppercase text-teal-600 mb-1 tracking-wider">Help Desk Response Console</h4>
                <div>
                    <label class="block text-[8px] font-bold text-gray-400 uppercase mb-1">Your Message / Reply</label>
                    <textarea id="tkt-reply-msg" rows="3" class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-xs leading-relaxed" placeholder="Write internal response or update parent..."></textarea>
                </div>
                
                <div class="grid grid-cols-2 gap-3 pt-1">
                    <button onclick="postTicketReply('${t.id}')" class="w-full bg-teal-600 text-white font-black py-3 rounded-xl text-xs shadow active:scale-95 transition-all">
                        <i class="fas fa-reply mr-1"></i> Send Reply
                    </button>
                    <button onclick="resolveTicket('${t.id}')" ${isResolved ? 'disabled class="w-full bg-gray-100 text-gray-400 font-black py-3 rounded-xl text-xs cursor-not-allowed"' : 'class="w-full bg-green-600 text-white font-black py-3 rounded-xl text-xs shadow active:scale-95 transition-all"'} >
                        <i class="fas fa-check-circle mr-1"></i> Mark Resolved
                    </button>
                </div>
            </div>

            <button onclick="adminRouter('helpDesk')" class="w-full text-gray-400 font-bold py-6 text-xs text-center block">
                <i class="fas fa-arrow-left mr-1"></i> Back to Help Desk
            </button>
        `;

    } catch (e) {
        console.error(e);
        container.innerHTML = `<div class="text-center py-10 text-red-400">Failed to fetch ticket info: ${e.message}</div>`;
    }
}

async function postTicketReply(ticketId) {
    const msgInput = document.getElementById('tkt-reply-msg');
    const msg = msgInput?.value.trim();

    if (!msg) {
        await alert("Please enter a response message!");
        return;
    }

    try {
        const snap = await db.ref(`school/tickets/${ticketId}/replies`).once('value');
        let replies = snap.val() || [ ];
        if (!Array.isArray(replies)) {
            replies = Object.values(replies);
        }

        const newReply = {
            sender: (currentUser?.name || "School Administrator") + " (Admin)",
            message: msg,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };

        replies.push(newReply);

        await db.ref(`school/tickets/${ticketId}/replies`).set(replies);
        if (msgInput) msgInput.value = '';
        await alert("Reply successfully posted to parent discussion!");
        viewTicketDetails(ticketId);
    } catch (e) {
        console.error(e);
        await alert("Failed to send reply: " + e.message);
    }
}

async function resolveTicket(ticketId) {
    if (!confirm("Are you sure you want to resolve and close this ticket?")) return;
    try {
        await db.ref(`school/tickets/${ticketId}/status`).set('Resolved');
        await alert("Ticket marked as Resolved.");
        viewTicketDetails(ticketId);
    } catch (e) {
        console.error(e);
        await alert("Failed to resolve ticket.");
    }
}
    