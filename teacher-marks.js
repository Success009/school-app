// Teacher Exam Marks Module

async function populateExamWindowsDropdown() {
    const select = document.getElementById('marks-exam-select');
    if (!select) return;

    try {
        const snap = await db.ref('school/exam_windows').once('value');
        const windows = snap.val();

        if (!windows) {
            select.innerHTML = `
                <option value="term1_2026">First Terminal Exam 2026 (Active)</option>
                <option value="midterm_2026">Mid-Term Exam 2026 (Draft)</option>
                <option value="finals_2026">Final Examination 2026 (Closed)</option>
            `;
            return;
        }

        select.innerHTML = Object.entries(windows).map(([examId, item]) => {
            const statusLabel = item.status === 'Active' ? 'Active' : 'Closed/Draft';
            return `<option value="${examId}">${item.title} (${statusLabel})</option>`;
        }).join('');

    } catch (e) {
        console.error(e);
        select.innerHTML = `<option value="none">Error loading exam windows</option>`;
    }
}

async function startSequentialEntry() {
    const examSelect = document.getElementById('marks-exam-select');
    const classSelect = document.getElementById('marks-class-select');
    const subjectSelect = document.getElementById('marks-subject-select');

    if (!examSelect || !classSelect || !subjectSelect) return;

    activeExamId = examSelect.value;
    activeClassId = classSelect.value;
    activeSubjectId = subjectSelect.value;

    if (activeExamId === 'loading' || activeExamId === 'none') {
        await alert("Please select a valid exam window.");
        return;
    }

    // Default lockout states
    window.activeExamLocked = false;

    // Load defaults from exam window and check deadlines
    try {
        const snapExam = await db.ref('school/exam_windows/' + activeExamId).once('value');
        const examDetails = snapExam.val();
        if (examDetails) {
            const now = new Date();
            const start = new Date(examDetails.openingDate);
            const end = new Date(examDetails.closingDate + 'T23:59:59');

            let isLocked = false;
            let lockReason = "";

            if (examDetails.status !== 'Active' && examDetails.status !== 'Published') {
                isLocked = true;
                lockReason = `This exam window status is '${examDetails.status}'.`;
            } else if (now < start) {
                isLocked = true;
                lockReason = `This exam window opens on ${examDetails.openingDate}.`;
            } else if (now > end) {
                isLocked = true;
                lockReason = `This exam window closed on ${examDetails.closingDate}.`;
            }

            if (isLocked) {
                await alert(`[DEADLINE LOCKOUT] ${lockReason}\n\nScores can be reviewed but modifications are disabled.`);
                window.activeExamLocked = true;
            }
        }
    } catch (err) {
        console.error("Deadline lookup error:", err);
    }

    if (!window.activeExamLocked) {
        showMarksConfigModal();
    } else {
        activeFM = 100;
        activePM = 40;
        proceedToSequentialLoading();
    }
}

function showMarksConfigModal() {
    const modalId = 'teacher-marks-config-modal';
    let modal = document.getElementById(modalId);
    if (!modal) {
        modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'fixed inset-0 z-[10002] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-opacity duration-300';
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div class="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-fade-in text-center">
            <div class="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl">
                <i class="fas fa-sliders-h"></i>
            </div>
            <h3 class="text-lg font-black text-gray-800 mb-1">Subject Scale</h3>
            <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-6">${activeSubjectId} | Class ${activeClassId}</p>
            
            <div class="grid grid-cols-2 gap-3 mb-6">
                <div>
                    <label class="text-[8px] font-black text-gray-400 uppercase block mb-1 text-left ml-2">Full Marks</label>
                    <input type="number" id="config-fm" class="w-full p-4 bg-gray-50 border-none rounded-2xl text-base font-bold focus:ring-2 focus:ring-indigo-500 outline-none" value="100">
                </div>
                <div>
                    <label class="text-[8px] font-black text-gray-400 uppercase block mb-1 text-left ml-2">Pass Marks</label>
                    <input type="number" id="config-pm" class="w-full p-4 bg-gray-50 border-none rounded-2xl text-base font-bold focus:ring-2 focus:ring-indigo-500 outline-none" value="40">
                </div>
            </div>

            <button onclick="confirmMarksConfig()" class="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-transform">
                Start Grading
            </button>
            <button onclick="document.getElementById('teacher-marks-config-modal').remove()" class="w-full text-gray-400 font-bold py-2 text-xs mt-2">Cancel</button>
        </div>
    `;
}

async function confirmMarksConfig() {
    const fm = parseInt(document.getElementById('config-fm').value);
    const pm = parseInt(document.getElementById('config-pm').value);

    if (isNaN(fm) || isNaN(pm) || fm <= 0) {
        await alert("Please enter valid numeric values for scaling.");
        return;
    }
    activeFM = fm;
    activePM = pm;
    
    document.getElementById('teacher-marks-config-modal').remove();
    proceedToSequentialLoading();
}

async function proceedToSequentialLoading() {
    const examSelect = document.getElementById('marks-exam-select');
    const configPanel = document.getElementById('marks-config-panel');
    const seqPanel = document.getElementById('sequential-entry-panel');

    try {
        const snapStudents = await db.ref('school/students').once('value');
        const students = snapStudents.val();

        if (!students) {
            await alert("No students registered in the database.");
            return;
        }

        let targetClass = activeClassId;
        let targetSection = "General";
        if (activeClassId.includes('-')) {
            const parts = activeClassId.split('-');
            targetClass = parts[0];
            targetSection = parts[1];
        }

        activeSeqRoster = Object.entries(students).filter(([id, data]) => {
            return String(data.class) === String(targetClass) && String(data.section) === String(targetSection);
        }).map(([id, data]) => {
            let fullName = '';
            if (data.name && typeof data.name === 'object') {
                fullName = `${data.name.first || ''} ${data.name.middle || ''} ${data.name.last || ''}`.replace(/\s+/g, ' ').trim();
            } else {
                fullName = data.name || 'Student';
            }
            return {
                id,
                name: fullName,
                roll: data.roll || 'N/A',
                photo: data.photo || 'https://via.placeholder.com/150'
            };
        });

        activeSeqRoster.sort((a, b) => {
            const rollA = parseInt(a.roll);
            const rollB = parseInt(b.roll);
            if (!isNaN(rollA) && !isNaN(rollB)) return rollA - rollB;
            return a.name.localeCompare(b.name);
        });

        if (activeSeqRoster.length === 0) {
            await alert(`No students found registered for Class ${activeClassId}.`);
            return;
        }

        configPanel.classList.add('hidden');
        seqPanel.classList.remove('hidden');

        document.getElementById('seq-header-term').innerText = examSelect.options[examSelect.selectedIndex].text;
        document.getElementById('seq-header-details').innerText = `Class ${activeClassId} | Subject: ${activeSubjectId}`;
        document.getElementById('seq-fm').innerText = activeFM;
        document.getElementById('seq-pm').innerText = activePM;

        activeSeqIndex = 0;
        showSequenceStudent();

        const obtainedInput = document.getElementById('seq-obtained');
        if (obtainedInput) {
            obtainedInput.onkeydown = function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    nextSequenceStudent();
                }
            };
        }

    } catch (e) {
        console.error(e);
        await alert("Failed to query student registry: " + e.message);
    }
}

async function showSequenceStudent() {
    if (activeSeqIndex < 0 || activeSeqIndex >= activeSeqRoster.length) return;

    const student = activeSeqRoster[activeSeqIndex];
    
    document.getElementById('seq-student-index').innerText = `Student ${activeSeqIndex + 1} of ${activeSeqRoster.length}`;
    document.getElementById('seq-student-name').innerText = student.name;
    document.getElementById('seq-student-id').innerText = `ID: ${student.id}`;
    document.getElementById('seq-student-roll').innerText = `Roll Number: ${student.roll}`;
    document.getElementById('seq-student-photo').src = SafeResolvers.photo(student.photo);

    const nextBtn = document.getElementById('seq-next-btn');
    if (activeSeqIndex === activeSeqRoster.length - 1) {
        nextBtn.innerHTML = `Save & Finish <i class="fas fa-flag-checkered text-[10px]"></i>`;
    } else {
        nextBtn.innerHTML = `Next / Save <i class="fas fa-chevron-right text-[10px]"></i>`;
    }

    const input = document.getElementById('seq-obtained');
    input.value = '';
    const preview = document.getElementById('seq-grade-preview');
    preview.innerText = 'Not Entered';
    preview.className = 'text-sm font-black text-gray-400 mt-1 block';

    try {
        const snap = await db.ref(`school/draft_results/${student.id}/${activeExamId}/${activeSubjectId}`).once('value');
        if (snap.exists()) {
            const data = snap.val();
            if (data.obtained !== undefined) {
                input.value = data.obtained;
                previewSequenceGrade();
            }
        } else {
            const snapFinal = await db.ref(`school/results/${student.id}/${activeExamId}/${activeSubjectId}`).once('value');
            if (snapFinal.exists()) {
                const data = snapFinal.val();
                if (data.obtained !== undefined) {
                    input.value = data.obtained;
                    previewSequenceGrade();
                }
            }
        }
    } catch (e) {
        console.error(e);
    }

    setTimeout(() => {
        input.focus();
        input.select();
    }, 100);
}

function previewSequenceGrade() {
    const obtainedVal = document.getElementById('seq-obtained').value;
    const preview = document.getElementById('seq-grade-preview');
    if (!preview) return;

    const obtained = parseFloat(obtainedVal);
    if (isNaN(obtained) || obtained < 0 || obtained > activeFM) {
        preview.innerText = 'Error';
        preview.className = 'text-sm font-black text-red-500 mt-1 block';
        return;
    }

    const percentage = (obtained / activeFM) * 100;
    let grade = 'E';
    let colorClass = 'text-red-500';

    if (percentage >= 90) { grade = 'A+'; colorClass = 'text-green-600'; }
    else if (percentage >= 80) { grade = 'A'; colorClass = 'text-green-600'; }
    else if (percentage >= 70) { grade = 'B+'; colorClass = 'text-teal-600'; }
    else if (percentage >= 60) { grade = 'B'; colorClass = 'text-blue-600'; }
    else if (percentage >= 50) { grade = 'C+'; colorClass = 'text-yellow-600'; }
    else if (percentage >= 40) { grade = 'C'; colorClass = 'text-yellow-600'; }

    preview.innerText = `${grade} (${percentage.toFixed(0)}%)`;
    preview.className = `text-sm font-black mt-1 block ${colorClass}`;
}

async function saveActiveSequenceStudentScore() {
    if (activeSeqIndex < 0 || activeSeqIndex >= activeSeqRoster.length) return false;

    const student = activeSeqRoster[activeSeqIndex];
    const obtainedVal = document.getElementById('seq-obtained').value;

    if (obtainedVal === '') return true;

    if (window.activeExamLocked) {
        await alert("Deadline Lockout: Further grade submissions for this closed exam window are locked.");
        return false;
    }

    const obtained = parseFloat(obtainedVal);
    if (isNaN(obtained) || obtained < 0 || obtained > activeFM) {
        await alert("Invalid score entered! Score must be between 0 and Full Marks.");
        return false;
    }

    const percentage = (obtained / activeFM) * 100;
    let grade = 'E';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B+';
    else if (percentage >= 60) grade = 'B';
    else if (percentage >= 50) grade = 'C+';
    else if (percentage >= 40) grade = 'C';

    const markData = {
        subject: activeSubjectId,
        total: activeFM,
        pass: activePM,
        obtained,
        grade,
        recordedBy: currentUser?.name || "Teacher Staff",
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };

    try {
        await db.ref(`school/draft_results/${student.id}/${activeExamId}/${activeSubjectId}`).set(markData);
        return true;
    } catch (e) {
        console.error(e);
        await alert("Failed to auto-save score: " + e.message);
        return false;
    }
}

async function nextSequenceStudent() {
    const isSaved = await saveActiveSequenceStudentScore();
    if (!isSaved) return;

    if (activeSeqIndex === activeSeqRoster.length - 1) {
        await alert("Roster completed! All entered marks have been auto-saved as drafts.\nThese scores are now ready for Administrator archiving and parent publication.");
        exitSequentialEntry();
    } else {
        activeSeqIndex++;
        showSequenceStudent();
    }
}

async function prevSequenceStudent() {
    const isSaved = await saveActiveSequenceStudentScore();
    if (!isSaved) return;

    if (activeSeqIndex > 0) {
        activeSeqIndex--;
        showSequenceStudent();
    }
}

function exitSequentialEntry() {
    const configPanel = document.getElementById('marks-config-panel');
    const seqPanel = document.getElementById('sequential-entry-panel');

    if (configPanel && seqPanel) {
        seqPanel.classList.add('hidden');
        configPanel.classList.remove('hidden');
    }
}
    