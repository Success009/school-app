// Parent Results Module
async function loadParentResults(term = "Term 1") {
    const container = document.getElementById('results-display-container');
    if (!container) return;
    
    container.innerHTML = `<div class="text-center py-10 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Fetching academic record...</div>`;
    
    const studentId = currentUser?.student.id;
    if (!studentId) {
        container.innerHTML = `<div class="text-center py-10 text-red-500 font-bold">Error: Student profile not resolved.</div>`;
        return;
    }

    try {
        const snap = await db.ref(`school/results/${studentId}/${term}`).once('value');
        const marks = snap.val();

        if (!marks) {
            container.innerHTML = `
                <div class="text-center py-12 px-6 bg-white border border-gray-100 rounded-2xl shadow-sm text-gray-400">
                    <div class="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-4 text-xl">
                        <i class="fas fa-file-invoice"></i>
                    </div>
                    <h4 class="font-black text-gray-800 text-sm mb-1">No Published Results</h4>
                    <p class="text-[10px] text-gray-400 leading-relaxed font-bold uppercase tracking-wider">No results have been published for this exam term yet.</p>
                </div>
            `;
            return;
        }

        let totalFull = 0;
        let totalObtained = 0;
        let subjectsCount = 0;
        let isPassed = true;

        const tableRowsHtml = Object.entries(marks).map(([subject, m]) => {
            const fm = parseFloat(m.total) || 100;
            const pm = parseFloat(m.pass) || 40;
            const ob = parseFloat(m.obtained) || 0;
            totalFull += fm;
            totalObtained += ob;
            subjectsCount++;
            
            if (ob < pm) isPassed = false;

            return `
                <tr>
                    <td class="py-3 font-bold text-gray-700">${subject}</td>
                    <td class="py-3 text-center text-gray-400 font-bold">${fm}</td>
                    <td class="py-3 text-center text-gray-400 font-bold">${pm}</td>
                    <td class="py-3 text-right">
                        <span class="font-black text-gray-800 mr-1">${ob}</span>
                        <span class="text-[10px] font-black text-blue-600">${m.grade || 'E'}</span>
                    </td>
                </tr>
            `;
        }).join('');

        const average = totalFull > 0 ? (totalObtained / totalFull) * 100 : 0;
        
        container.innerHTML = `
            <div class="mobile-card bg-white shadow-sm border border-gray-100">
                <div class="flex justify-between items-start mb-6">
                    <div>
                        <h2 class="text-lg font-black text-gray-800 uppercase tracking-tight">Academic Report</h2>
                        <p class="text-[9px] text-blue-600 font-black uppercase tracking-widest mt-1">${term === 'Finals' ? 'Final Examination' : term + ' Evaluation'}</p>
                    </div>
                    <span class="px-3 py-1.5 rounded-full text-[9px] font-black uppercase ${isPassed ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}">
                        ${isPassed ? 'Passed' : 'Failed'}
                    </span>
                </div>
                
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-sm">
                        <thead>
                            <tr class="text-[9px] text-gray-400 uppercase font-black border-b border-gray-100">
                                <th class="pb-2">Subject</th>
                                <th class="pb-2 text-center">Full</th>
                                <th class="pb-2 text-center">Pass</th>
                                <th class="pb-2 text-right">Obtained</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-50">
                            ${tableRowsHtml}
                        </tbody>
                    </table>
                </div>
                
                <div class="mt-6 pt-6 border-t border-gray-100 flex justify-between items-center">
                    <div>
                        <p class="text-[9px] text-gray-400 font-black uppercase tracking-wider">Total Average</p>
                        <h4 class="text-xl font-black text-gray-800">${average.toFixed(1)}%</h4>
                    </div>
                    <button onclick="printReportCard('${term}')" class="bg-gray-800 text-white px-4 py-2.5 rounded-xl text-xs font-black active:scale-95 transition-all shadow-sm">
                        <i class="fas fa-print mr-1"></i> Print / PDF
                    </button>
                </div>
            </div>

            <div class="mobile-card border-l-4 border-yellow-500 bg-white">
                <h4 class="text-xs font-black text-gray-800 uppercase tracking-wide">Teacher's Remarks</h4>
                <p class="text-xs text-gray-500 italic mt-1">"Report cards are synchronized dynamically from school faculty records. Keep up the consistent effort!"</p>
                <p class="text-[9px] font-bold text-gray-400 mt-2 uppercase tracking-widest">— Academic Office</p>
            </div>
        `;

    } catch (e) {
        console.error(e);
        container.innerHTML = `<div class="text-center py-10 text-red-400">Failed to render academic report: ${e.message}</div>`;
    }
}

function printReportCard(term = "Term 1") {
    const studentId = currentUser?.student.id;
    
    db.ref(`school/results/${studentId}/${term}`).once('value', async (snap) => {
        const marks = snap.val();
        
        let marksHtml = '';
        let totalFull = 0;
        let totalObtained = 0;
        let count = 0;
        
        if (marks) {
            marksHtml = Object.entries(marks).map(([subject, m]) => {
                totalFull += parseFloat(m.total);
                totalObtained += parseFloat(m.obtained);
                count++;
                return `
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 10px; font-weight: bold; color: #1e293b;">${subject}</td>
                        <td style="padding: 10px; text-align: center; color: #64748b;">${m.total}</td>
                        <td style="padding: 10px; text-align: center; color: #64748b;">${m.pass}</td>
                        <td style="padding: 10px; text-align: right; font-weight: 800; color: #1e293b;">${m.obtained} (${m.grade})</td>
                    </tr>
                `;
            }).join('');
        } else {
            totalFull = 100;
            totalObtained = 0;
            marksHtml = `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td colspan="4" style="padding: 20px; text-align: center; color: #64748b; font-style: italic;">
                        No results published for this term.
                    </td>
                </tr>
            `;
        }
        
        const pct = totalFull > 0 ? (totalObtained / totalFull) * 100 : 0;
        let gpa = 0.0;
        if (pct >= 90) gpa = 4.0;
        else if (pct >= 80) gpa = 3.6;
        else if (pct >= 70) gpa = 3.2;
        else if (pct >= 60) gpa = 2.8;
        else if (pct >= 50) gpa = 2.4;
        else if (pct >= 40) gpa = 2.0;
        else gpa = 1.6;

        // Fetch teachers to resolve Class Teacher and Principal dynamically
        let classTeacherName = "Class Teacher";
        let principalName = "Principal";
        
        try {
            const tSnap = await db.ref('school/teachers').once('value');
            const teachers = tSnap.val();
            if (teachers) {
                const studentClass = currentUser?.student.grade;
                const ct = Object.values(teachers).find(t => String(t.classTeacherOf) === String(studentClass));
                if (ct) {
                    const ctName = `${ct.name?.first || ''} ${ct.name?.middle || ''} ${ct.name?.last || ''}`.replace(/\s+/g, ' ').trim() || ct.name || "Class Teacher";
                    const ctTitle = ct.professionalTitle || "Class Teacher";
                    classTeacherName = `${ctName}<br><span style="font-size: 10px; color: #64748b; font-weight: normal;">${ctTitle}</span>`;
                }
                
                const pr = Object.values(teachers).find(t => {
                    const title = (t.professionalTitle || '').toLowerCase();
                    return title.includes('principal') || title.includes('head') || t.sortOrder === 1;
                });
                if (pr) {
                    const prName = `${pr.name?.first || ''} ${pr.name?.middle || ''} ${pr.name?.last || ''}`.replace(/\s+/g, ' ').trim() || pr.name || "Principal";
                    const prTitle = pr.professionalTitle || "Principal";
                    principalName = `${prName}<br><span style="font-size: 10px; color: #64748b; font-weight: normal;">${prTitle}</span>`;
                }
            }
        } catch (err) {
            console.error("Error resolving teachers for print signatures:", err);
        }

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
            <head>
                <title>Report Card - ${getStudentFullName(currentUser?.student.name)}</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; background: white; }
                    .certificate-container { border: 4px double #1d4ed8; padding: 30px; border-radius: 12px; max-width: 800px; margin: 0 auto; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .header h1 { font-size: 26px; font-weight: 900; color: #1d4ed8; margin: 0; text-transform: uppercase; }
                    .header p { font-size: 11px; color: #64748b; margin: 5px 0 0 0; font-weight: bold; letter-spacing: 1px; }
                    .report-title { text-align: center; font-size: 18px; font-weight: 800; text-transform: uppercase; margin: 25px 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; color: #1e293b; }
                    .bio-item { margin-bottom: 8px; font-size: 13px; }
                    .bio-label { font-weight: bold; color: #64748b; }
                    .bio-val { font-weight: 800; color: #1e293b; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 35px; font-size: 13px; }
                    th { background: #f8fafc; padding: 12px 10px; font-weight: bold; text-transform: uppercase; font-size: 10px; color: #64748b; border-bottom: 2px solid #cbd5e1; }
                    td { padding: 12px 10px; border-bottom: 1px solid #e2e8f0; }
                    .summary-bar { background: #f1f5f9; padding: 15px; border-radius: 8px; display: flex; justify-content: space-between; font-weight: bold; font-size: 13px; margin-bottom: 40px; }
                    .signatures-block { display: flex; justify-content: space-between; margin-top: 60px; text-align: center; font-size: 12px; }
                    .sig-line { border-top: 1px dashed #94a3b8; width: 180px; margin-bottom: 5px; }
                    @media print {
                        body { padding: 0; }
                        .certificate-container { border: 4px double #1d4ed8; box-shadow: none; }
                    }
                </style>
            </head>
            <body>
                <div class="certificate-container">
                    <div class="header">
                        <h1>Udayashree English School</h1>
                        <p>Bharatpur, Chitwan, Nepal | Tel: +977-56-520123</p>
                    </div>
                    <div class="report-title">Academic Progress Report Card</div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 13px;">
                        <div>
                            <div class="bio-item"><span class="bio-label">Student Name:</span> <span class="bio-val">${getStudentFullName(currentUser?.student.name)}</span></div>
                            <div class="bio-item"><span class="bio-label">Student ID:</span> <span class="bio-val">${studentId}</span></div>
                        </div>
                        <div style="text-align: right;">
                            <div class="bio-item"><span class="bio-label">Class:</span> <span class="bio-val">Class ${currentUser?.student.grade}</span></div>
                            <div class="bio-item"><span class="bio-label">Roll Number:</span> <span class="bio-val">${currentUser?.student.roll || '01'}</span></div>
                        </div>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th style="text-align: left;">Subject</th>
                                <th style="text-align: center;">Full Marks</th>
                                <th style="text-align: center;">Pass Marks</th>
                                <th style="text-align: right;">Obtained Score (Grade)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${marksHtml}
                        </tbody>
                    </table>
                    <div class="summary-bar">
                        <span>Total Score: ${totalObtained}/${totalFull}</span>
                        <span>Percentage: ${pct.toFixed(1)}%</span>
                        <span>GPA: ${gpa.toFixed(2)}</span>
                    </div>
                    <div class="signatures-block">
                        <div>
                            <div class="sig-line"></div>
                            ${classTeacherName}
                        </div>
                        <div>
                            <div class="sig-line"></div>
                            ${principalName}
                        </div>
                    </div>
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() { window.close(); }, 500);
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    });
}
