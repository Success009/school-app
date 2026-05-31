// Admin Exams Configuration Module

async function saveExamWindow() {
    const title = document.getElementById('exam-title').value.trim();
    const termId = document.getElementById('exam-term-id').value;
    const status = document.getElementById('exam-status').value;
    const openingDate = document.getElementById('exam-opening').value;
    const closingDate = document.getElementById('exam-closing').value;
    if (!title || !openingDate || !closingDate) {
        await alert("Please enter title and dates.");
        return;
    }

    const yearPart = openingDate.split('-')[0] || "2083";
    const examId = termId.replace(/\s+/g, '').toLowerCase() + '_' + yearPart;
    
    const data = {
        title,
        termId,
        status,
        openingDate,
        closingDate,
        createdAt: firebase.database.ServerValue.TIMESTAMP
    };

    try {
        await db.ref('school/exam_windows/' + examId).set(data);
        await alert("Exam window successfully scheduled!");
        document.getElementById('exam-title').value = '';
        loadExamWindowsList();
    } catch (e) {
        console.error(e);
        await alert("Failed to save window: " + e.message);
    }
}

async function loadExamWindowsList() {
    const container = document.getElementById('admin-exams-list');
    if (!container) return;

    try {
        const snap = await db.ref('school/exam_windows').once('value');
        const list = snap.val();

        if (!list) {
            container.innerHTML = `<div class="text-center py-8 text-gray-400 text-xs italic bg-white rounded-xl border border-gray-100">No scheduled exam windows.</div>`;
            return;
        }

        container.innerHTML = Object.entries(list).map(([examId, item]) => {
            const isClosed = item.status === 'Closed' || convertToEnglishDate(item.closingDate) < new Date();
            const badgeStyle = isClosed 
    

            return `
                <div class="mobile-card flex items-center justify-between p-4 bg-white border border-gray-100 shadow-sm relative overflow-hidden">
                    <div class="flex-grow">
                        <div class="flex items-center gap-2">
                            <h4 class="font-bold text-gray-800 text-sm">${item.title}</h4>
                            <span class="px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${badgeStyle}">${item.status}</span>
                        </div>
                        <p class="text-[9px] text-gray-400 font-bold uppercase mt-1 tracking-wider">Dates: ${item.openingDate} to ${item.closingDate}</p>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="publishExamResults('${examId}')" class="w-8 h-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center active:scale-90 transition-transform" title="Publish Results">
                            <i class="fas fa-paper-plane text-xs"></i>
                        </button>
                        <button onclick="toggleExamStatus('${examId}', '${item.status}')" class="w-8 h-8 bg-gray-50 text-gray-600 rounded-full flex items-center justify-center active:scale-90 transition-transform">
                            <i class="fas fa-toggle-on text-xs"></i>
                        </button>
                        <button onclick="deleteExamWindow('${examId}')" class="w-8 h-8 bg-red-50 text-red-600 rounded-full flex items-center justify-center active:scale-90 transition-transform">
                            <i class="fas fa-trash text-xs"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (e) {
        console.error(e);
        container.innerHTML = `<div class="text-center py-6 text-red-400">Error loading exam windows.</div>`;
    }
}

async function toggleExamStatus(examId, currentStatus) {
    const nextStatus = currentStatus === 'Active' ? 'Closed' : 'Active';
    try {
        await db.ref(`school/exam_windows/${examId}/status`).set(nextStatus);
        loadExamWindowsList();
    } catch (e) {
        console.error(e);
    }
}

async function deleteExamWindow(examId) {
    if (!confirm("Delete this exam term window?")) return;
    try {
        await db.ref(`school/exam_windows/${examId}`).remove();
        loadExamWindowsList();
    } catch (e) {
        console.error(e);
    }
}

async function publishExamResults(examId) {
    if (!confirm("Are you sure you want to permanently publish and archive draft marks for this exam?\nThis will make them instantly visible to parents and students!")) return;

    try {
        const draftSnap = await db.ref('school/draft_results').once('value');
        const drafts = draftSnap.val();

        if (!drafts) {
            await alert("No draft marks were found to publish for this exam.");
            return;
        }

        let countPublished = 0;
        const updates = { };

        for (const [studentId, examData] of Object.entries(drafts)) {
            if (examData && examData[examId]) {
                const subjectsData = examData[examId];
                for (const [subject, markData] of Object.entries(subjectsData)) {
                    updates[`school/results/${studentId}/${examId}/${subject}`] = markData;
                    countPublished++;
                }
            }
        }

        if (countPublished === 0) {
            await alert("No drafts match this exam ID to publish.");
            return;
        }

        updates[`school/exam_windows/${examId}/status`] = 'Published';

        await db.ref().update(updates);
        await alert(`Successfully published and archived ${countPublished} marks cards for this exam!`);
        loadExamWindowsList();
    } catch (e) {
        console.error(e);
        await alert("Publishing failed: " + e.message);
    }
}
    