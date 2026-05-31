// Teacher Attendance Module
let activeRosterList = [ ];
async function loadAttendanceRoster() {
    const classVal = currentUser?.classTeacherOf;
    if (!classVal || classVal === 'none') {
        await alert("No explicitly assigned classroom found for your class teacher profile.");
        return;
    }
    const dateVal = document.getElementById('attend-date').value;
    const rosterContainer = document.getElementById('attendance-roster-container');
    const submitBtnDiv = document.getElementById('submit-roster-btn-div');

    if (!classVal || !dateVal) return;

    rosterContainer.innerHTML = `<div class="text-center py-10 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Loading student profiles...</div>`;
    submitBtnDiv.classList.add('hidden');
    activeRosterList = [ ];

    // Extract Grade and Sections matching DB structures
    let targetClass = classVal;
    let targetSection = "General";
    try {
        const snap = await db.ref('school/students').once('value');
        const students = snap.val();
        
        if (!students) {
            rosterContainer.innerHTML = `<div class="text-center py-8 text-gray-400 italic">No registered students found in database.</div>`;
            return;
        }

        // Filter student database by classroom parameters
        const filtered = Object.entries(students).filter(([studentId, s]) => {
            return String(s.class) === String(targetClass) && String(s.section) === String(targetSection);
        });

        if (filtered.length === 0) {
            rosterContainer.innerHTML = `<div class="text-center py-8 text-yellow-600 bg-yellow-50 rounded-xl text-xs p-4 border border-yellow-100">No students are registered in Class ${classVal} yet. Add them in the Admin panel!</div>`;
            return;
        }

        // Initialize local session roster arrays
        activeRosterList = filtered.map(([studentId, s]) => {
            let fullName = '';
            if (s.name && typeof s.name === 'object') {
                fullName = `${s.name.first || ''} ${s.name.middle || ''} ${s.name.last || ''}`.replace(/\s+/g, ' ').trim();
            } else {
                fullName = s.name || 'Student';
            }
            return {
                id: studentId,
                name: fullName,
                status: 'present' // default baseline
            };
        });

        rosterContainer.innerHTML = activeRosterList.map((s, index) => `
            <div class="mobile-card flex items-center justify-between p-4 bg-white border border-gray-100">
                <div class="flex items-center">
                    <div class="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-xs mr-3">
                        ${s.name.charAt(0)}
                    </div>
                    <div>
                        <h4 class="font-bold text-gray-800 text-sm">${s.name}</h4>
                        <p class="text-[9px] text-gray-400 font-bold uppercase mt-0.5">ID: ${s.id}</p>
                    </div>
                </div>
                <div class="flex gap-2">
                    <button id="p-btn-${index}" onclick="toggleRosterStatus(${index}, 'present')" class="px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all bg-green-100 text-green-700 shadow-sm border border-green-200">
                        Present
                    </button>
                    <button id="a-btn-${index}" onclick="toggleRosterStatus(${index}, 'absent')" class="px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all bg-gray-50 text-gray-400 border border-gray-100">
                        Absent
                    </button>
                </div>
            </div>
        `).join('');

        submitBtnDiv.classList.remove('hidden');
    } catch (e) {
        console.error(e);
        rosterContainer.innerHTML = `<div class="text-center py-10 text-red-400">Failed to load class roster: ${e.message}</div>`;
    }
}

function toggleRosterStatus(index, status) {
    if (!activeRosterList[index]) return;
    activeRosterList[index].status = status;

    const pBtn = document.getElementById(`p-btn-${index}`);
    const aBtn = document.getElementById(`a-btn-${index}`);

    if (status === 'present') {
        pBtn.className = "px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all bg-green-100 text-green-700 shadow-sm border border-green-200";
        aBtn.className = "px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all bg-gray-50 text-gray-400 border border-gray-100";
    } else {
        pBtn.className = "px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all bg-gray-50 text-gray-400 border border-gray-100";
        aBtn.className = "px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all bg-red-100 text-red-700 shadow-sm border border-red-200";
    }
}

async function submitAttendance() {
    const classVal = currentUser?.classTeacherOf;
    if (!classVal || classVal === 'none') {
        await alert("You are not explicitly designated as a Class Teacher of any class.");
        return;
    }
    const dateVal = document.getElementById('attend-date').value;
    
    if (activeRosterList.length === 0 || !classVal || !dateVal) return;

    try {
        const batchUpdates = { };
        const teacherName = currentUser?.name || "Teacher Staff";

        activeRosterList.forEach(s => {
            batchUpdates[`school/attendance/${classVal}/${dateVal}/${s.id}`] = {
                status: s.status,
                studentName: s.name,
                teacherName: teacherName,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            };
        });

        await db.ref().update(batchUpdates);
        await alert(`Attendance roster for Class ${classVal} submitted successfully!\nDate: ${dateVal}`);
        teacherRouter('dashboard');
    } catch (e) {
        console.error(e);
        await alert("Failed to submit attendance roster: " + e.message);
    }
}
    