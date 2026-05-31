// Parent Tickets Module
async function submitParentTicket() {
    const category = document.getElementById('tkt-category').value;
    const priority = document.getElementById('tkt-priority').value;
    const title = document.getElementById('tkt-title').value.trim();
    const description = document.getElementById('tkt-desc').value.trim();

    if (!title || !description) {
        await alert("Please provide both title and description.");
        return;
    }

    const ticketId = "TK-" + Math.floor(100000 + Math.random() * 900000);

    const ticketData = {
        id: ticketId,
        studentId: currentUser?.student.id || "MOCK",
        studentName: currentUser?.student.name || "Demo",
        parentPhone: currentUser?.phone || "9800000000",
        parentName: currentUser?.name || "Parent",
        category,
        title,
        description,
        priority,
        status: "Opened",
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };

    try {
        await db.ref('school/tickets/' + ticketId).set(ticketData);
        await alert(`Support ticket ${ticketId} raised successfully!`);
        parentRouter('tickets');
    } catch (e) {
        console.error(e);
        await alert("Failed to submit support ticket.");
    }
}

async function loadParentTicketsList() {
    const container = document.getElementById('parent-tickets-list');
    if (!container) return;

    try {
        const snap = await db.ref('school/tickets').once('value');
        const list = snap.val();

        if (!list) {
            container.innerHTML = `<div class="text-center py-10 text-gray-400 text-xs italic bg-white rounded-xl border border-gray-100 p-6">No raised support tickets.</div>`;
            return;
        }

        const parentPhone = currentUser?.phone || "9800000000";
        const myTickets = Object.values(list).filter(t => t.parentPhone === parentPhone);

        if (myTickets.length === 0) {
            container.innerHTML = `<div class="text-center py-10 text-gray-400 text-xs italic bg-white rounded-xl border border-gray-100 p-6">No raised support tickets.</div>`;
            return;
        }

        myTickets.sort((a, b) => b.timestamp - a.timestamp);

        container.innerHTML = myTickets.map(t => {
            const isResolved = t.status === 'Resolved';
            const badgeClass = isResolved ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700";

            let repliesHtml = '';
            if (t.replies) {
                const repliesList = Array.isArray(t.replies) ? t.replies : Object.values(t.replies);
                repliesHtml = `
                    <div class="bg-gray-50 p-3 rounded-xl mt-3 space-y-2 border border-gray-50 text-[11px]">
                        <p class="font-black text-gray-400 uppercase tracking-wider text-[8px] mb-1">Ticket Discussion</p>
                        ${repliesList.map(r => `
                            <div>
                                <span class="font-bold text-blue-700">${r.sender}:</span>
                                <span class="text-gray-600">${r.message}</span>
                            </div>
                        `).join('')}
                    </div>
                `;
            }

            return `
                <div class="mobile-card border-l-4 ${isResolved ? 'border-green-500' : 'border-yellow-500'} bg-white relative overflow-hidden">
                    <div class="flex justify-between items-center">
                        <span class="text-[8px] font-black text-gray-400 uppercase tracking-widest">${t.category} | ${t.id}</span>
                        <span class="px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${badgeClass}">${t.status}</span>
                    </div>
                    <h4 class="font-bold text-gray-800 text-sm mt-1">${t.title}</h4>
                    <p class="text-xs text-gray-500 mt-1 leading-relaxed">${t.description}</p>
                    
                    ${repliesHtml}

                    <div class="flex justify-between items-center mt-3 pt-2 border-t border-gray-50 text-[8px] font-bold text-gray-400 uppercase">
                        <span>Priority: ${t.priority}</span>
                        <span>${new Date(t.timestamp).toLocaleDateString()}</span>
                    </div>
                </div>
            `;
        }).join('');

    } catch (e) {
        console.error(e);
        container.innerHTML = `<div class="text-center py-10 text-red-400">Error loading support logs.</div>`;
    }
}
    