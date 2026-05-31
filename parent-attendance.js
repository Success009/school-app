// Parent Attendance Module
async function loadDashboardAttendancePercent() {
    const el = document.getElementById('dash-attendance-pct');
    if (!el) return;

    const studentId = currentUser?.student.id;
    const studentClass = `${currentUser?.student.grade}-${currentUser?.student.section}`;

    if (!studentId || !studentClass) {
        el.innerText = "0%";
        return;
    }

    try {
        const snap = await db.ref(`school/attendance/${studentClass}`).once('value');
        const days = snap.val();

        if (!days) {
            el.innerText = "0%";
            return;
        }

        let totalDays = 0;
        let presentDays = 0;

        Object.values(days).forEach(students => {
            if (students && students[studentId]) {
                totalDays++;
                if (students[studentId].status === 'present') presentDays++;
            }
        });

        if (totalDays === 0) {
            el.innerText = "0%";
        } else {
            const pct = (presentDays / totalDays) * 100;
            el.innerText = `${pct.toFixed(0)}%`;
        }

    } catch (e) {
        el.innerText = "0%";
    }
}

async function loadAttendanceHistoryAndStats() {
    const parentScore = document.getElementById('parent-attendance-score');
    const parentGauge = document.getElementById('parent-attendance-gauge');
    const historyContainer = document.getElementById('parent-attendance-history');
    
    if (!parentScore || !historyContainer) return;

    const studentId = currentUser?.student.id;
    const studentClass = `${currentUser?.student.grade}-${currentUser?.student.section}`;

    if (!studentId || !studentClass) {
        parentScore.innerText = "0.0%";
        parentGauge.setAttribute('stroke-dasharray', '0, 100');
        historyContainer.innerHTML = `<div class="text-center py-6 text-gray-300">No records found.</div>`;
        return;
    }

    try {
        const snap = await db.ref(`school/attendance/${studentClass}`).once('value');
        const days = snap.val();
        
        if (!days) {
            parentScore.innerText = "0.0%";
            parentGauge.setAttribute('stroke-dasharray', '0, 100');
            historyContainer.innerHTML = `
                <div class="text-center py-8 text-gray-500 bg-gray-50 rounded-2xl text-xs p-4 border border-gray-100">
                    <i class="fas fa-info-circle text-lg mb-1 block text-gray-400"></i>
                    No attendance logs registered in the database for this class yet.
                </div>
            `;
            return;
        }

        let totalLogs = 0;
        let presentLogs = 0;
        let historyList = [ ];

        Object.entries(days).forEach(([dateStr, students]) => {
            if (students && students[studentId]) {
                const log = students[studentId];
                totalLogs++;
                if (log.status === 'present') presentLogs++;
                historyList.push({
                    date: dateStr,
                    status: log.status,
                    teacher: log.teacherName || "Faculty"
                });
            }
        });

        if (totalLogs === 0) {
            parentScore.innerText = "0.0%";
            parentGauge.setAttribute('stroke-dasharray', '0, 100');
            historyContainer.innerHTML = `
                <div class="text-center py-8 text-gray-500 bg-gray-50 rounded-2xl text-xs p-4 border border-gray-100">
                    <i class="fas fa-info-circle text-lg mb-1 block text-gray-400"></i>
                    No attendance logs registered for your student ID yet.
                </div>
            `;
            return;
        }

        const pct = (presentLogs / totalLogs) * 100;
        parentScore.innerText = `${pct.toFixed(1)}%`;
        parentGauge.setAttribute('stroke-dasharray', `${pct.toFixed(0)}, 100`);

        historyContainer.innerHTML = historyList.reverse().map(h => {
            const dateParts = h.date.split('-');
            const dayStr = dateParts[2] || "01";
            const monthNames = ["BAI", "JST", "ASH", "SHW", "BHD", "ASW", "KRT", "MNG", "PSH", "MGH", "FLG", "CHT"];
            const monthIdx = parseInt(dateParts[1]) - 1;
            const monthStr = isNaN(monthIdx) ? "JST" : (monthNames[monthIdx] || "JST");
    
            const isPresent = h.status === 'present';
            
            return `
                <div class="mobile-card flex items-center p-4 bg-white border border-gray-100 shadow-sm">
                    <div class="w-10 h-10 ${isPresent ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'} rounded-xl flex flex-col items-center justify-center mr-4">
                        <span class="text-xs font-black">${dayStr}</span>
                        <span class="text-[8px] font-bold uppercase">${monthStr}</span>
                    </div>
                    <div class="flex-grow">
                        <h4 class="text-sm font-bold text-gray-800">${isPresent ? 'Regular Class Attendance' : 'Absent Evaluation'}</h4>
                        <p class="text-[10px] text-gray-400 mt-0.5">Logged by: ${h.teacher}</p>
                    </div>
                    <span class="text-[10px] font-black ${isPresent ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'} px-2.5 py-1.5 rounded-lg uppercase">${h.status}</span>
                </div>
            `;
        }).join('');

    } catch (e) {
        console.error(e);
        parentScore.innerText = "0.0%";
        parentGauge.setAttribute('stroke-dasharray', '0, 100');
    }
}
    