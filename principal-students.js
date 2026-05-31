// Principal Students Directory Module

async function loadPrincipalStudents() {
    const list = document.getElementById('p-student-list');
    const lvlFilter = document.getElementById('filter-lvl')?.value || 'all';
    const secFilter = document.getElementById('filter-sec')?.value || 'all';
    
    if (!list) return;

    list.innerHTML = `<div class="text-center py-10 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Filtering records...</div>`;

    try {
        const snap = await db.ref('school/students').once('value');
        const students = snap.val();

        if (!students) {
            list.innerHTML = `<div class="text-center py-10 text-gray-400">No students registered.</div>`;
            return;
        }

        let studentEntries = Object.entries(students);

        // Advanced Dual-Filter Logic
        studentEntries = studentEntries.filter(([id, data]) => {
            const matchesLvl = (lvlFilter === 'all') || (String(data.class) === String(lvlFilter));
            const matchesSec = (secFilter === 'all') || (String(data.section) === String(secFilter));
            return matchesLvl && matchesSec;
        });

        if (studentEntries.length === 0) {
            list.innerHTML = `<div class="text-center py-8 text-yellow-600 bg-yellow-50 rounded-xl text-xs p-4 border border-yellow-100">No students found matching Level: ${lvlFilter} | Section: ${secFilter}.</div>`;
            return;
        }

        // Sort alphabetically by first name
        studentEntries.sort((a, b) => {
            const nameA = (a[1].name?.first || a[1].name || '').toLowerCase();
            const nameB = (b[1].name?.first || b[1].name || '').toLowerCase();
            return nameA.localeCompare(nameB);
        });

        list.innerHTML = studentEntries.map(([studentId, data]) => {
            let fullName = '';
            if (data.name && typeof data.name === 'object') {
                fullName = `${data.name.first || ''} ${data.name.middle || ''} ${data.name.last || ''}`.replace(/\s+/g, ' ').trim();
            } else {
                fullName = data.name || 'Student';
            }

            return `
                <div class="mobile-card list-item flex items-center p-4 bg-white border border-gray-100 shadow-sm">
                    <img src="${SafeResolvers.photo(data.photo)}" class="w-12 h-12 rounded-xl object-cover mr-4 border border-gray-100">
                    <div class="flex-grow">
                        <h4 class="font-bold text-gray-800 text-sm search-name">${fullName}</h4>
                        <p class="text-[9px] text-gray-400 font-bold uppercase mt-1">Class ${SafeResolvers.text(data.class)} | ID: ${studentId}</p>
                    </div>
                </div>
            `;
        }).join('');

    } catch (e) {
        console.error(e);
        list.innerHTML = `<div class="text-center py-10 text-red-400">Failed to query student database: ${e.message}</div>`;
    }
}

function filterStudentList() {
    const filter = document.getElementById('p-std-search').value.toLowerCase();
    const list = document.getElementById('p-student-list');
    if (!list) return;
    const cards = list.getElementsByClassName('mobile-card');
    for (let i = 0; i < cards.length; i++) {
        const nameNode = cards[i].querySelector('.search-name');
        if (nameNode) {
            const nameText = nameNode.innerText.toLowerCase();
            cards[i].style.display = nameText.indexOf(filter) > -1 ? "" : "none";
        }
    }
}
    