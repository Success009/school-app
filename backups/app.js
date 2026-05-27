const views = {
    teacherDash: {
        render: () => `
            <div class="mb-6 flex justify-between items-center">
                <div>
                    <h2 class="text-2xl font-black text-gray-800">Hello, ${currentUser.name.split(' ')[0]}</h2>
                    <p class="text-xs text-blue-600 font-bold uppercase tracking-widest">Faculty Member</p>
                </div>
                <img src="logo.png" class="w-10 h-10 object-contain" alt="">
            </div>

            <div class="grid grid-cols-2 gap-4 mb-6">
                <div class="mobile-card bg-blue-700 text-white p-5">
                    <span class="block text-2xl font-black">24</span>
                    <span class="text-[10px] opacity-70 uppercase font-bold">Total Students</span>
                </div>
                <div class="mobile-card bg-indigo-600 text-white p-5">
                    <span class="block text-2xl font-black">2</span>
                    <span class="text-[10px] opacity-70 uppercase font-bold">Periods Today</span>
                </div>
            </div>

            <h3 class="font-bold text-gray-800 mb-4">My Today's Classes</h3>
            <div class="space-y-3">
                ${currentUser.schedule.map(s => `
                    <div class="mobile-card flex items-center justify-between border-l-4 border-blue-600">
                        <div>
                            <h4 class="font-bold text-gray-800">${s.subject} - ${s.class}</h4>
                            <p class="text-[10px] text-gray-400 font-bold uppercase">${s.time} | Period ${s.period}</p>
                        </div>
                        <button onclick="alert('Opening Attendance Register...')" class="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-xs font-bold active:scale-95 transition-all">
                            Take Attendance
                        </button>
                    </div>
                `).join('')}
            </div>

            <div class="mt-8 grid grid-cols-2 gap-4">
                <button class="mobile-card flex flex-col items-center justify-center p-6 text-blue-600">
                    <i class="fas fa-file-signature text-xl mb-2"></i>
                    <span class="text-[10px] font-black uppercase">Enter Marks</span>
                </button>
                <button class="mobile-card flex flex-col items-center justify-center p-6 text-purple-600">
                    <i class="fas fa-exchange-alt text-xl mb-2"></i>
                    <span class="text-[10px] font-black uppercase">Swap Class</span>
                </button>
            </div>
        `
    },
    adminDash: {
        render: () => `
            <div class="mb-6">
                <h2 class="text-2xl font-black text-gray-800">Admin Panel</h2>
                <p class="text-xs text-red-600 font-bold tracking-widest uppercase">Central Command</p>
            </div>
            
            <div class="grid grid-cols-2 gap-4 mb-6">
                <div onclick="router('viewStudents')" class="mobile-card !p-5 bg-blue-50 border-none shadow-none cursor-pointer">
                    <i class="fas fa-users text-blue-600 text-xl mb-2"></i>
                    <h4 id="stat-students" class="text-2xl font-black">...</h4>
                    <p class="text-[10px] text-gray-400 uppercase font-bold">Students</p>
                </div>
                <div onclick="router('viewTeachers')" class="mobile-card !p-5 bg-purple-50 border-none shadow-none cursor-pointer">
                    <i class="fas fa-chalkboard-teacher text-purple-600 text-xl mb-2"></i>
                    <h4 id="stat-teachers" class="text-2xl font-black">...</h4>
                    <p class="text-[10px] text-gray-400 uppercase font-bold">Teachers</p>
                </div>
            </div>

            <h3 class="font-bold text-gray-800 mb-4">Management Core</h3>
            <div class="grid grid-cols-2 gap-4 mb-8">
                <button onclick="router('addStudent')" class="mobile-card flex flex-col items-center justify-center p-6 text-blue-700">
                    <i class="fas fa-user-plus text-xl mb-2"></i>
                    <span class="text-[10px] font-black uppercase">Add Student</span>
                </button>
                <button onclick="router('addTeacher')" class="mobile-card flex flex-col items-center justify-center p-6 text-purple-700">
                    <i class="fas fa-chalkboard-teacher text-xl mb-2"></i>
                    <span class="text-[10px] font-black uppercase">Add Teacher</span>
                </button>
                <button class="mobile-card flex flex-col items-center justify-center p-6 text-orange-700">
                    <i class="fas fa-calendar-alt text-xl mb-2"></i>
                    <span class="text-[10px] font-black uppercase">Timetable</span>
                </button>
                <button onclick="router('sendNotice')" class="mobile-card flex flex-col items-center justify-center p-6 text-teal-700">
                    <i class="fas fa-bullhorn text-xl mb-2"></i>
                    <span class="text-[10px] font-black uppercase">Send Notice</span>
                </button>
            </div>

            <div class="flex justify-between items-center mb-4">
                <h3 class="font-bold text-gray-800">Recent Notices</h3>
                <span class="text-[10px] font-bold text-blue-600 uppercase">View All</span>
            </div>
            <div id="admin-recent-notices" class="space-y-3 pb-10">
                <div class="text-center py-6 text-gray-300 text-xs italic">No announcements found.</div>
            </div>
        `
    },
    viewStudents: {
        title: 'Students List',
        render: () => `
            <div class="mb-4">
                <div class="relative">
                    <input type="text" onkeyup="filterList(this, 'student-list')" class="w-full p-4 bg-white border border-gray-100 rounded-xl shadow-sm outline-none pl-12" placeholder="Search students...">
                    <i class="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"></i>
                </div>
            </div>
            <div id="student-list" class="space-y-3">
                <div class="text-center py-10 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Loading Directory...</div>
            </div>
        `
    },
    viewTeachers: {
        title: 'Teachers List',
        render: () => `
             <div class="mb-4">
                <div class="relative">
                    <input type="text" onkeyup="filterList(this, 'teacher-list')" class="w-full p-4 bg-white border border-gray-100 rounded-xl shadow-sm outline-none pl-12" placeholder="Search faculty...">
                    <i class="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"></i>
                </div>
            </div>
            <div id="teacher-list" class="space-y-3">
                <div class="text-center py-10 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Loading Faculty...</div>
            </div>
        `
    },
    studentDetails: {
        title: 'Student Profile',
        render: () => `
            <div id="student-profile-container">
                 <div class="text-center py-10 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Fetching Profile...</div>
            </div>
        `
    },
    accountantDash: {
        render: () => `
            <div class="mb-6">
                <h2 class="text-2xl font-black text-gray-800">Accounts</h2>
                <p class="text-xs text-green-600 font-bold uppercase">Financial Management</p>
            </div>

            <div class="mobile-card bg-green-600 text-white p-6 mb-6">
                <p class="text-xs opacity-80 uppercase font-bold tracking-widest mb-1">Collection (Monthly)</p>
                <h3 class="text-3xl font-black">Rs. 845,000</h3>
                <div class="mt-4 flex items-center text-xs">
                    <span class="bg-white/20 px-2 py-1 rounded">75% Collected</span>
                    <span class="ml-4 opacity-80">Pending: 2.1L</span>
                </div>
            </div>

            <h3 class="font-bold text-gray-800 mb-4">Accountant Actions</h3>
            <div class="grid grid-cols-2 gap-4">
                <button class="mobile-card flex flex-col items-center justify-center p-5 text-emerald-600">
                    <i class="fas fa-receipt text-xl mb-2"></i>
                    <span class="text-[10px] font-black uppercase">Generate Bill</span>
                </button>
                <button class="mobile-card flex flex-col items-center justify-center p-5 text-blue-600">
                    <i class="fas fa-check-double text-xl mb-2"></i>
                    <span class="text-[10px] font-black uppercase">Verify Payment</span>
                </button>
                <button class="mobile-card flex flex-col items-center justify-center p-5 text-gray-600">
                    <i class="fas fa-file-invoice-dollar text-xl mb-2"></i>
                    <span class="text-[10px] font-black uppercase">Ledger</span>
                </button>
                <button class="mobile-card flex flex-col items-center justify-center p-5 text-red-600">
                    <i class="fas fa-exclamation-triangle text-xl mb-2"></i>
                    <span class="text-[10px] font-black uppercase">Defaulters</span>
                </button>
            </div>
        `
    },
    addStudent: {
        title: 'Register Student',
        render: () => `
            <div class="mb-6">
                <h2 class="text-xl font-black text-gray-800">Student Enrollment</h2>
                <p class="text-xs text-gray-500">Add a new student to the school database</p>
            </div>
            
            <div class="space-y-4 pb-10">
                <div class="mobile-card">
                    <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Student Photo</label>
                    <div class="flex items-center gap-4">
                        <div id="std-photo-preview" class="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 overflow-hidden border-2 border-dashed border-gray-200">
                            <i class="fas fa-camera text-xl"></i>
                        </div>
                        <input type="file" id="std-photo-input" class="hidden" accept="image/*" onchange="previewImage(this, 'std-photo-preview')">
                        <button onclick="document.getElementById('std-photo-input').click()" class="bg-gray-100 px-4 py-2 rounded-lg text-xs font-bold text-gray-600">Select Photo</button>
                    </div>
                </div>

                <div class="mobile-card">
                    <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Full Name</label>
                    <input type="text" id="std-name" class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Aarav Sharma">
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div class="mobile-card">
                        <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Class-Section</label>
                        <input type="text" id="std-class" class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="10-A">
                    </div>
                    <div class="mobile-card">
                        <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Blood Group</label>
                        <select id="std-blood" class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                            <option value="Unknown">Unknown</option>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                        </select>
                    </div>
                </div>

                <div class="mobile-card">
                    <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Parent/Guardian Name</label>
                    <input type="text" id="std-parent" class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ramesh Sharma">
                </div>

                <div class="mobile-card">
                    <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Parent Mobile (For Login)</label>
                    <div class="relative">
                        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">+977</span>
                        <input type="tel" id="std-phone" class="w-full p-3 pl-12 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="98XXXXXXXX">
                    </div>
                </div>

                <button onclick="saveStudent()" class="w-full bg-blue-700 text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all">
                    <i class="fas fa-save mr-2"></i> Save to Database
                </button>
                <button onclick="router('dashboard')" class="w-full text-gray-400 font-bold py-2 text-xs">
                    Cancel
                </button>
            </div>
        `
    },
    addTeacher: {
        title: 'Add Teacher',
        render: () => `
            <div class="mb-6">
                <h2 class="text-xl font-black text-gray-800">Faculty Registration</h2>
                <p class="text-xs text-gray-500">Register a new teacher and assign classes</p>
            </div>
            
            <div class="space-y-4 pb-10">
                <div class="mobile-card">
                    <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Teacher Name</label>
                    <input type="text" id="tch-name" class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ms. Sunita Rai">
                </div>

                <div class="mobile-card">
                    <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Mobile Number</label>
                    <input type="tel" id="tch-phone" class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="98XXXXXXXX">
                </div>

                <div class="mobile-card">
                    <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Primary Subjects</label>
                    <input type="text" id="tch-subjects" class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Math, Science">
                </div>

                <div class="mobile-card">
                    <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Assigned Classes</label>
                    <input type="text" id="tch-classes" class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="10-A, 9-B">
                </div>

                <button onclick="saveTeacher()" class="w-full bg-purple-700 text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all">
                    <i class="fas fa-user-check mr-2"></i> Register Teacher
                </button>
            </div>
        `
    },
    sendNotice: {
        title: 'Announcements',
        render: () => `
            <div class="mb-6">
                <h2 class="text-xl font-black text-gray-800">Broadcast Message</h2>
                <p class="text-xs text-gray-500">Send notifications to parents and teachers</p>
            </div>
            
            <div class="space-y-4">
                <div class="mobile-card">
                    <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Target Audience</label>
                    <select id="notice-target" class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                        <option value="all">All (Everyone)</option>
                        <option value="parents">All Parents</option>
                        <option value="teachers">All Teachers</option>
                        <option value="specific">Specific Class</option>
                    </select>
                </div>

                <div id="target-class-div" class="mobile-card hidden">
                    <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Class Name</label>
                    <input type="text" id="notice-class" class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. 10-A">
                </div>

                <div class="mobile-card">
                    <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Notice Title</label>
                    <input type="text" id="notice-title" class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Emergency Holiday">
                </div>

                <div class="mobile-card">
                    <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Message Content</label>
                    <textarea id="notice-body" rows="4" class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Write your announcement here..."></textarea>
                </div>

                <button onclick="broadcastNotice()" class="w-full bg-teal-600 text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all">
                    <i class="fas fa-paper-plane mr-2"></i> Send Notification
                </button>
            </div>
        `
    },
    principalDash: {
        render: () => `
            <div class="mb-6">
                <h2 class="text-2xl font-black text-gray-800 tracking-tight">Principal's Portal</h2>
                <p class="text-xs text-blue-800 font-bold uppercase tracking-widest">School Performance</p>
            </div>

            <div class="space-y-4">
                <div class="mobile-card !p-0 overflow-hidden">
                    <div class="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                        <h4 class="text-xs font-black uppercase text-gray-500">Student Attendance</h4>
                        <span class="text-green-600 font-bold text-xs">92% Average</span>
                    </div>
                    <div class="p-6 flex justify-around">
                        <div class="text-center">
                            <p class="text-2xl font-black text-gray-800">414</p>
                            <p class="text-[9px] text-gray-400 font-bold uppercase">Present</p>
                        </div>
                        <div class="text-center">
                            <p class="text-2xl font-black text-red-500">36</p>
                            <p class="text-[9px] text-gray-400 font-bold uppercase">Absent</p>
                        </div>
                    </div>
                </div>

                <div class="mobile-card !p-0 overflow-hidden">
                    <div class="p-4 bg-gray-50 border-b border-gray-100">
                        <h4 class="text-xs font-black uppercase text-gray-500">Academic Progress</h4>
                    </div>
                    <div class="p-4 space-y-3">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-bold text-gray-600">Grade 10 Passes</span>
                            <div class="w-24 bg-gray-100 h-2 rounded-full overflow-hidden">
                                <div class="bg-blue-600 h-full w-[95%]"></div>
                            </div>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-bold text-gray-600">Homework Sync</span>
                            <div class="w-24 bg-gray-100 h-2 rounded-full overflow-hidden">
                                <div class="bg-yellow-500 h-full w-[60%]"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <button class="w-full bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg mt-6 active:scale-95 transition-all">
                <i class="fas fa-file-export mr-2"></i> Export Monthly Report
            </button>
        `
    },
    results: {
        title: 'Report Card',
        render: () => `
            <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
                <div class="flex justify-between items-start mb-6">
                    <div>
                        <h2 class="text-2xl font-black text-gray-800">Examination Results</h2>
                        <p class="text-xs text-blue-600 font-bold uppercase tracking-widest mt-1">First Terminal Examination</p>
                    </div>
                    <span class="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">Passed</span>
                </div>
                
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-sm">
                        <thead>
                            <tr class="text-[10px] text-gray-400 uppercase font-black border-b border-gray-100">
                                <th class="pb-2">Subject</th>
                                <th class="pb-2 text-center">Full</th>
                                <th class="pb-2 text-center">Pass</th>
                                <th class="pb-2 text-right">Obtained</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-50">
                            ${(currentUser?.student.marks['Term 1'] || [ ]).map(m => `
                                <tr>
                                    <td class="py-3 font-bold text-gray-700">${m.subject}</td>
                                    <td class="py-3 text-center text-gray-400">${m.total}</td>
                                    <td class="py-3 text-center text-gray-400">40</td>
                                    <td class="py-3 text-right">
                                        <span class="font-black text-gray-800">${m.obtained}</span>
                                        <span class="text-[10px] font-bold text-blue-600 ml-1">${m.grade}</span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                
                <div class="mt-6 pt-6 border-t border-gray-100 flex justify-between items-center">
                    <div>
                        <p class="text-[10px] text-gray-400 font-bold uppercase">Total Average</p>
                        <h4 class="text-xl font-black text-gray-800">88.33%</h4>
                    </div>
                    <button class="bg-gray-800 text-white px-4 py-2 rounded-lg text-xs font-bold active:scale-95 transition-all">
                        <i class="fas fa-download mr-1"></i> PDF
                    </button>
                </div>
            </div>
            
            <div class="mobile-card border-l-4 border-yellow-500">
                <h4 class="text-sm font-bold text-gray-800">Teacher's Remarks</h4>
                <p class="text-xs text-gray-500 italic mt-1">"Aarav is showing great progress in Mathematics. Needs to focus a bit more on Science practicals."</p>
                <p class="text-[9px] font-bold text-gray-400 mt-2 uppercase">— Ms. Sunita Rai</p>
            </div>
        `
    },
    login: {
        title: 'Login',
        render: () => {
            const step = window.loginStep || 1;
            return `
            <div class="flex flex-col items-center justify-center min-h-[80vh]">
                <div class="w-24 h-24 mb-6 drop-shadow-xl">
                    <img src="logo.png" class="w-full h-full object-contain" alt="School Logo">
                </div>
                <h2 class="text-2xl font-bold text-gray-800 mb-2">${step === 1 ? 'Parent Login' : 'Verify OTP'}</h2>
                <p class="text-gray-500 mb-8 text-center px-6">
                    ${step === 1 ? 'Enter your registered mobile number to receive an OTP' : 'Enter the 4-digit code sent to your phone'}
                </p>
                
                <div class="w-full space-y-4">
                    ${step === 1 ? `
                        <div>
                            <label class="block text-xs font-bold text-gray-400 uppercase mb-1 ml-1">Mobile Number</label>
                            <div class="relative">
                                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">+977</span>
                                <input type="tel" id="login-phone" class="w-full p-4 pl-16 bg-white border border-gray-100 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="98XXXXXXXX">
                            </div>
                        </div>
                        <button onclick="sendOTP()" class="w-full bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 active:scale-95 transition-transform mt-4 flex items-center justify-center">
                            Send OTP <i class="fas fa-arrow-right ml-2 text-sm"></i>
                        </button>
                    ` : `
                        <div class="flex justify-center gap-3">
                            <input type="number" class="otp-input w-14 h-14 text-center text-xl font-bold bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" maxlength="1">
                            <input type="number" class="otp-input w-14 h-14 text-center text-xl font-bold bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" maxlength="1">
                            <input type="number" class="otp-input w-14 h-14 text-center text-xl font-bold bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" maxlength="1">
                            <input type="number" class="otp-input w-14 h-14 text-center text-xl font-bold bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" maxlength="1">
                        </div>
                        <button onclick="handleLogin()" class="w-full bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 active:scale-95 transition-transform mt-6">
                            Verify & Login
                        </button>
                        <button onclick="window.loginStep=1; router('login')" class="w-full text-gray-400 font-bold py-2 text-sm">
                            Change Number
                        </button>
                    `}
                </div>
            </div>
            `;
        }
    },
    dashboard: {
        title: 'Dashboard',
        render: () => {
            if (currentUser.role === ROLES.TEACHER) return views.teacherDash.render();
            if (currentUser.role === ROLES.ADMIN) return views.adminDash.render();
            if (currentUser.role === ROLES.ACCOUNTANT) return views.accountantDash.render();
            if (currentUser.role === ROLES.PRINCIPAL) return views.principalDash.render();
            
            return `
            <div class="flex items-center justify-between mb-6">
                <div>
                    <h2 class="text-2xl font-extrabold text-gray-800 tracking-tight">Namaste, ${currentUser ? currentUser.name.split(' ')[0] : 'Parent'}</h2>
                    <p class="text-gray-500 text-sm flex items-center">
                        <i class="fas fa-map-marker-alt mr-1 text-blue-500"></i> Udayashree English School
                    </p>
                </div>
                <div class="w-12 h-12">
                    <img src="logo.png" class="w-full h-full object-contain" alt="Logo">
                </div>
            </div>
            
            <div class="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-6 text-white shadow-xl mb-8 relative overflow-hidden">
                <div class="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                <div class="flex items-center justify-between mb-6 relative z-10">
                    <div>
                        <p class="text-xs text-blue-100 uppercase font-bold tracking-widest mb-1">Student Profile</p>
                        <h3 class="text-2xl font-black">${currentUser?.student.name || 'Student Name'}</h3>
                    </div>
                    <div class="w-16 h-16 bg-white rounded-2xl overflow-hidden border-2 border-white/50 shadow-lg ring-4 ring-white/10">
                        <img src="${currentUser?.student.photo}" class="w-full h-full object-cover" alt="Student">
                    </div>
                </div>
                <div class="flex justify-between items-end relative z-10">
                    <div class="space-y-1">
                        <div class="flex items-center text-sm">
                            <span class="text-blue-200 mr-2">Grade:</span>
                            <span class="font-bold">${currentUser?.student.grade || 'N/A'}</span>
                        </div>
                        <div class="flex items-center text-sm">
                            <span class="text-blue-200 mr-2">Blood:</span>
                            <span class="font-bold">${currentUser?.student.bloodGroup || 'N/A'}</span>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-[10px] text-blue-200 uppercase font-bold">Roll No: ${currentUser?.student.roll || '0'}</p>
                        <p class="text-sm font-bold">${currentUser?.student.classTeacher || 'Teacher Name'}</p>
                    </div>
                </div>
            </div>

            <h3 class="font-bold text-gray-800 mb-4 px-1">Academic & School Services</h3>
            <div class="grid grid-cols-2 gap-4 mb-4">
                <div class="mobile-card flex flex-col items-center justify-center text-center p-5 active:bg-blue-50 transition-colors cursor-pointer group" onclick="router('attendance')">
                    <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 mb-3 group-active:scale-90 transition-transform">
                        <i class="fas fa-calendar-check text-lg"></i>
                    </div>
                    <span class="text-xl font-black text-gray-800">95%</span>
                    <span class="text-[10px] text-gray-400 uppercase font-bold mt-1 tracking-wider">Attendance</span>
                </div>
                <div class="mobile-card flex flex-col items-center justify-center text-center p-5 active:bg-blue-50 transition-colors cursor-pointer group" onclick="router('homework')">
                    <div class="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 mb-3 group-active:scale-90 transition-transform">
                        <i class="fas fa-book-open text-lg"></i>
                    </div>
                    <span class="text-xl font-black text-gray-800">2</span>
                    <span class="text-[10px] text-gray-400 uppercase font-bold mt-1 tracking-wider">Assignments</span>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div class="mobile-card flex flex-col items-center justify-center text-center p-5 active:bg-blue-50 transition-colors cursor-pointer group" onclick="router('teachers')">
                    <div class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mb-3 group-active:scale-90 transition-transform">
                        <i class="fas fa-user-graduate text-lg"></i>
                    </div>
                    <span class="text-sm font-bold text-gray-800 leading-tight">Teacher<br>Directory</span>
                    <span class="text-[10px] text-gray-400 uppercase font-bold mt-2 tracking-wider">Contact</span>
                </div>
                <div class="mobile-card flex flex-col items-center justify-center text-center p-5 active:bg-blue-50 transition-colors cursor-pointer group" onclick="router('fees')">
                    <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-3 group-active:scale-90 transition-transform">
                        <i class="fas fa-wallet text-lg"></i>
                    </div>
                    <span class="text-sm font-bold text-gray-800 leading-tight">Fee<br>Payment</span>
                    <span class="text-[10px] text-gray-400 uppercase font-bold mt-2 tracking-wider">Accounting</span>
                </div>
            </div>
        `;
        }
    },
    attendance: {
        title: 'Attendance',
        render: () => `
            <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6 flex items-center justify-between">
                <div>
                    <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Attendance Score</p>
                    <h3 class="text-3xl font-black text-gray-800">95.4%</h3>
                </div>
                <div class="w-16 h-16 relative">
                    <svg class="w-full h-full" viewBox="0 0 36 36">
                        <path class="text-gray-100" stroke-width="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path class="text-green-500" stroke-width="3" stroke-dasharray="95, 100" stroke-linecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    </svg>
                    <div class="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-green-600">GOOD</div>
                </div>
            </div>

            <div class="flex justify-between items-center mb-4 px-1">
                <h2 class="text-lg font-black text-gray-800 tracking-tight">Recent History</h2>
                <div class="flex gap-2">
                    <span class="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[10px] font-bold uppercase">May 2024</span>
                </div>
            </div>
            
            <div class="space-y-3">
                <div class="mobile-card flex items-center p-4">
                    <div class="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex flex-col items-center justify-center mr-4">
                        <span class="text-xs font-black">24</span>
                        <span class="text-[8px] font-bold uppercase">MAY</span>
                    </div>
                    <div class="flex-grow">
                        <h4 class="text-sm font-bold text-gray-800">Friday - Regular Class</h4>
                        <p class="text-[10px] text-gray-400">Recorded by: Ms. Sunita Rai</p>
                    </div>
                    <span class="text-[10px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-md uppercase">Present</span>
                </div>
                <div class="mobile-card flex items-center p-4">
                    <div class="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex flex-col items-center justify-center mr-4">
                        <span class="text-xs font-black">23</span>
                        <span class="text-[8px] font-bold uppercase">MAY</span>
                    </div>
                    <div class="flex-grow">
                        <h4 class="text-sm font-bold text-gray-800">Thursday - Regular Class</h4>
                        <p class="text-[10px] text-gray-400">Recorded by: Ms. Sunita Rai</p>
                    </div>
                    <span class="text-[10px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-md uppercase">Present</span>
                </div>
                <div class="mobile-card flex items-center p-4">
                    <div class="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex flex-col items-center justify-center mr-4">
                        <span class="text-xs font-black">22</span>
                        <span class="text-[8px] font-bold uppercase">MAY</span>
                    </div>
                    <div class="flex-grow">
                        <h4 class="text-sm font-bold text-gray-800">Wednesday - Sick Leave</h4>
                        <p class="text-[10px] text-gray-400">Recorded by: Office</p>
                    </div>
                    <span class="text-[10px] font-black text-red-600 bg-red-50 px-2 py-1 rounded-md uppercase">Absent</span>
                </div>
            </div>
            
            <div class="mt-8 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <div class="flex gap-3">
                    <i class="fas fa-info-circle text-blue-500 mt-1"></i>
                    <div>
                        <h4 class="text-sm font-bold text-blue-800">About Attendance</h4>
                        <p class="text-xs text-blue-600/70 leading-tight mt-1">Attendance is recorded digitally by class teachers during the first period (10:00 AM). Parents receive instant notifications via this app.</p>
                    </div>
                </div>
            </div>
        `
    },
    homework: {
        title: 'Homework Tasks',
        render: () => `
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-bold">Assigned Tasks</h2>
            </div>
            <div class="space-y-4">
                <div class="mobile-card relative overflow-hidden">
                    <div class="absolute top-0 left-0 w-1 h-full bg-yellow-500"></div>
                    <div class="flex justify-between items-start mb-2">
                        <span class="text-xs font-bold text-yellow-600 uppercase tracking-tighter">Mathematics</span>
                        <span class="text-[10px] text-gray-400">Due: Tomorrow</span>
                    </div>
                    <h4 class="font-bold text-gray-800">Solve Exercise 5.2</h4>
                    <div class="mt-3 flex items-center">
                        <input type="checkbox" class="w-4 h-4 mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                        <span class="text-xs text-gray-500 ml-2">Mark as done</span>
                    </div>
                </div>
                <div class="mobile-card relative overflow-hidden opacity-75">
                    <div class="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                    <div class="flex justify-between items-start mb-2">
                        <span class="text-xs font-bold text-green-600 uppercase tracking-tighter">Science</span>
                        <span class="text-[10px] text-gray-400">Due: May 26</span>
                    </div>
                    <h4 class="font-bold text-gray-800 line-through">Read Chapter 4</h4>
                    <div class="mt-3 flex items-center">
                        <input type="checkbox" checked class="w-4 h-4 mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                        <span class="text-xs text-gray-500 line-through ml-2">Completed</span>
                    </div>
                </div>
            </div>
        `
    },
    notices: {
        title: 'Notice Board',
        render: () => `
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-bold">School Updates</h2>
            </div>
            <div class="space-y-3">
                <div class="mobile-card bg-blue-50 border border-blue-100">
                    <h4 class="font-bold text-blue-800">Mid-Term Exams - Parent Notice</h4>
                    <p class="text-xs text-gray-500 mb-2">Posted: 2h ago</p>
                    <p class="text-sm text-gray-700 leading-relaxed">The mid-term exams will commence from June 1st. Please ensure your child clears all pending dues before collecting the admit card.</p>
                </div>
                <div class="mobile-card">
                    <h4 class="font-bold text-gray-800">Holiday - Buddha Jayanti</h4>
                    <p class="text-xs text-gray-500 mb-2">Posted: 1d ago</p>
                    <p class="text-sm text-gray-600 leading-relaxed">School will remain closed tomorrow in observance of Buddha Jayanti.</p>
                </div>
            </div>
        `
    },
    teachers: {
        title: 'Class Routine',
        render: () => `
            <div class="mb-6">
                <h2 class="text-xl font-black text-gray-800 tracking-tight">Weekly Schedule</h2>
                <p class="text-xs text-gray-500">View subject periods and teacher contacts</p>
            </div>
            
            <div class="space-y-4">
                ${currentUser?.student.schedule.map(item => `
                    <div class="mobile-card !p-0 overflow-hidden border-l-4 ${item.subject === 'Lunch Break' ? 'border-gray-300 bg-gray-50' : 'border-blue-600'}">
                        <div class="p-4 flex items-center justify-between">
                            <div class="flex items-center">
                                <div class="mr-4 text-center">
                                    <span class="block text-[10px] font-bold text-blue-600 uppercase tracking-tighter">${item.period}</span>
                                    <span class="block text-xs font-black text-gray-800">${item.time.split(' ')[0]}</span>
                                </div>
                                <div>
                                    <h4 class="font-bold text-gray-800 text-sm">${item.subject}</h4>
                                    <p class="text-[10px] text-gray-400 font-medium">${item.teacher !== '-' ? 'Teacher: ' + item.teacher : 'Relaxation Time'}</p>
                                </div>
                            </div>
                            ${item.teacher !== '-' ? `
                                <div class="flex gap-2">
                                    <a href="tel:+9779800000000" class="w-8 h-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center active:scale-90 transition-transform">
                                        <i class="fas fa-phone-alt text-xs"></i>
                                    </a>
                                </div>
                            ` : ''}
                        </div>
                        <div class="bg-gray-50 px-4 py-1.5 flex items-center border-t border-gray-100">
                            <i class="fas fa-calendar-day text-[10px] text-gray-400 mr-2"></i>
                            <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest">${item.days}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="mt-8 mb-4">
                <h3 class="text-sm font-bold text-gray-400 uppercase tracking-widest px-1">Other Contacts</h3>
            </div>
            <div class="mobile-card flex items-center p-4">
                <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 mr-3">
                    <i class="fas fa-bus text-sm"></i>
                </div>
                <div class="flex-grow">
                    <h4 class="text-sm font-bold text-gray-800">Bus Driver (Route 4)</h4>
                    <p class="text-[10px] text-gray-500">Mr. Ram Bahadur</p>
                </div>
                <a href="tel:+9779800000004" class="w-9 h-9 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
                    <i class="fas fa-phone-alt text-sm"></i>
                </a>
            </div>
        `
    },
    fees: {
        title: 'Fee Status',
        render: () => `
            <div class="bg-gray-800 rounded-2xl p-6 text-white mb-6 shadow-xl relative overflow-hidden">
                <div class="absolute right-0 top-0 opacity-10 p-4">
                    <i class="fas fa-file-invoice-dollar text-8xl"></i>
                </div>
                <p class="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Total Outstanding</p>
                <h3 class="text-3xl font-black mb-4">Rs. 4,500.00</h3>
                <div class="flex gap-3">
                    <button class="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-bold text-sm shadow-lg active:scale-95 transition-all">
                        Pay Dues
                    </button>
                    <button class="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg font-bold text-sm backdrop-blur-sm active:scale-95 transition-all">
                        History
                    </button>
                </div>
            </div>
            
            <h3 class="font-bold text-gray-800 mb-3 px-1">Upcoming Payments</h3>
            <div class="space-y-3">
                <div class="mobile-card flex justify-between items-center border-l-4 border-red-500">
                    <div>
                        <h4 class="font-bold text-gray-800">Exam Fee (Term 1)</h4>
                        <p class="text-[10px] text-gray-400">Deadline: 15 June, 2024</p>
                    </div>
                    <span class="font-bold text-gray-800">Rs. 1,500</span>
                </div>
                <div class="mobile-card flex justify-between items-center border-l-4 border-yellow-500">
                    <div>
                        <h4 class="font-bold text-gray-800">Monthly Tuition Fee</h4>
                        <p class="text-[10px] text-gray-400">Deadline: 20 June, 2024</p>
                    </div>
                    <span class="font-bold text-gray-800">Rs. 3,000</span>
                </div>
            </div>
        `
    },
    profile: {
        title: 'Profile',
        render: () => `
            <div class="flex flex-col items-center my-6">
                <div class="w-24 h-24 bg-white rounded-full flex items-center justify-center text-blue-700 mb-3 border-4 border-white shadow-xl relative overflow-hidden">
                    <img src="logo.png" class="w-16 h-16 object-contain opacity-20 absolute -z-10" alt="">
                    <i class="fas fa-user-tie text-4xl"></i>
                </div>
                <h2 class="text-xl font-bold">${currentUser ? currentUser.name : 'Parent'}</h2>
                <span class="text-xs text-gray-500 font-bold uppercase tracking-widest">Parent / Guardian</span>
                <p class="text-[10px] text-gray-400 mt-1">ID: ${currentUser ? currentUser.id : 'N/A'}</p>
            </div>
            <div class="mobile-card !p-0 overflow-hidden divide-y divide-gray-50">
                <div class="p-4 flex items-center active:bg-gray-50 cursor-pointer">
                    <i class="fas fa-child text-gray-400 mr-4 w-5"></i>
                    <span class="text-sm font-medium">Student Info: ${currentUser?.student.name}</span>
                    <i class="fas fa-chevron-right ml-auto text-gray-300 text-xs"></i>
                </div>
                <div onclick="router('fees')" class="p-4 flex items-center active:bg-gray-50 cursor-pointer">
                    <i class="fas fa-file-invoice-dollar text-gray-400 mr-4 w-5"></i>
                    <span class="text-sm font-medium">Fee Payment</span>
                    <i class="fas fa-chevron-right ml-auto text-gray-300 text-xs"></i>
                </div>
                <div onclick="router('teachers')" class="p-4 flex items-center active:bg-gray-50 cursor-pointer">
                    <i class="fas fa-phone-alt text-gray-400 mr-4 w-5"></i>
                    <span class="text-sm font-medium">Teacher Directory</span>
                    <i class="fas fa-chevron-right ml-auto text-gray-300 text-xs"></i>
                </div>
                <div class="p-4 flex items-center active:bg-gray-50 cursor-pointer">
                    <i class="fas fa-shield-alt text-gray-400 mr-4 w-5"></i>
                    <span class="text-sm font-medium">Privacy Policy</span>
                    <i class="fas fa-chevron-right ml-auto text-gray-300 text-xs"></i>
                </div>
                <div onclick="handleLogout()" class="p-4 flex items-center active:bg-gray-50 text-red-500 cursor-pointer">
                    <i class="fas fa-power-off mr-4 w-5"></i>
                    <span class="text-sm font-bold">Logout</span>
                </div>
            </div>
            <div class="mt-8 text-center">
                <p class="text-[10px] text-gray-300 uppercase tracking-widest font-bold">Udayashree Parent App v1.1.0</p>
            </div>
        `
    }
};

// Firebase Initialization
const firebaseConfig = {
  apiKey: "AIzaSyAHOiriisWOpuVLAdcYun_mCkOhbYfB5y4",
  authDomain: "deep-freehold-389006.firebaseapp.com",
  databaseURL: "https://deep-freehold-389006-default-rtdb.firebaseio.com",
  projectId: "deep-freehold-389006",
  storageBucket: "deep-freehold-389006.appspot.com",
  messagingSenderId: "76562961838",
  appId: "1:76562961838:web:4d18b2f79d7eb9fd88243f",
  measurementId: "G-VZC36FJC24"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const storage = firebase.storage();

let currentUser = null;

// Role Constants
const ROLES = {
    PARENT: 'parent',
    TEACHER: 'teacher',
    ADMIN: 'admin',
    ACCOUNTANT: 'accountant',
    PRINCIPAL: 'principal'
};

function router(viewName) {
    const appEl = document.getElementById('app');
    const mainContent = document.getElementById('main-content');
    
    // Handle view animation class
    mainContent.classList.remove('view-enter');
    void mainContent.offsetWidth; // Trigger reflow
    mainContent.classList.add('view-enter');

    // If not logged in, force login view
    if (!currentUser && viewName !== 'login') {
        viewName = 'login';
    }

    const view = views[viewName] || views.dashboard;
    
    // Toggle UI Shell based on login state
    const header = document.getElementById('main-header');
    const nav = document.getElementById('bottom-nav');
    
    if (viewName === 'login') {
        header.classList.add('hidden');
        nav.classList.add('hidden');
        document.getElementById('main-content').classList.remove('pb-24');
    } else {
        header.classList.remove('hidden');
        nav.classList.remove('hidden');
        document.getElementById('main-content').classList.add('pb-24');
    }

    // Update Content
    document.getElementById('main-content').innerHTML = view.render();
    
    // Update Header Title
    document.getElementById('page-title').innerText = view.title;

    // Dynamic Navigation Visibility
    if (currentUser && currentUser.role !== ROLES.PARENT) {
        nav.classList.add('hidden');
        document.getElementById('main-content').classList.remove('pb-24');
    }

    // Update Bottom Nav Styling
    document.querySelectorAll('.nav-item').forEach(btn => {
        if (btn.getAttribute('data-view') === viewName) {
            btn.classList.add('text-blue-700');
            btn.classList.remove('text-gray-400');
        } else {
            btn.classList.remove('text-blue-700');
            btn.classList.add('text-gray-400');
        }
    });

    document.getElementById('main-content').scrollTop = 0;
    
    // Handle specific view listeners
    if (viewName === 'adminDash') {
        db.ref('school/students').on('value', snap => {
            const el = document.getElementById('stat-students');
            if (el) el.innerText = snap.numChildren();
        });
        db.ref('school/teachers').on('value', snap => {
            const el = document.getElementById('stat-teachers');
            if (el) el.innerText = snap.numChildren();
        });
        loadAdminNotices();
    }

    if (viewName === 'viewStudents') {
        loadStudentsList();
    }

    if (viewName === 'viewTeachers') {
        loadTeachersList();
    }

    if (viewName === 'sendNotice') {
        const targetSelect = document.getElementById('notice-target');
        const classDiv = document.getElementById('target-class-div');
        targetSelect.addEventListener('change', () => {
            if (targetSelect.value === 'specific') classDiv.classList.remove('hidden');
            else classDiv.classList.add('hidden');
        });
    }

    // Render Floating Debug Menu
    renderDebugMenu();

    // Handle OTP input focusing
    if (viewName === 'login' && window.loginStep === 2) {
        const inputs = document.querySelectorAll('.otp-input');
        inputs.forEach((input, index) => {
            input.addEventListener('keyup', (e) => {
                if (e.key >= 0 && e.key <= 9) {
                    if (index < inputs.length - 1) inputs[index + 1].focus();
                } else if (e.key === 'Backspace') {
                    if (index > 0) inputs[index - 1].focus();
                }
            });
        });
        inputs[0].focus();
    }
}

function sendOTP() {
    const phone = document.getElementById('login-phone').value;
    if (phone.length >= 10) {
        window.loginStep = 2;
        window.tempPhone = phone;
        router('login');
    } else {
        alert('Please enter a valid mobile number');
    }
}

async function handleLogin() {
    const phone = window.tempPhone || '9800000000';
    
    // Simple mock routing based on numbers
    // 980 = Parent, 981 = Teacher, 982 = Admin, 983 = Accountant, 984 = Principal
    if (phone.startsWith('981')) {
        currentUser = { 
            role: ROLES.TEACHER, 
            id: 'T-552', 
            name: 'Ms. Sunita Rai',
            classes: ['10A', '9B'],
            schedule: [
                { period: '1st', class: '10A', subject: 'Mathematics', time: '10:00 AM' },
                { period: '3rd', class: '9B', subject: 'Advanced Math', time: '11:30 AM' }
            ]
        };
    } else if (phone.startsWith('982')) {
        currentUser = { role: ROLES.ADMIN, id: 'A-001', name: 'Admin Staff' };
    } else if (phone.startsWith('983')) {
        currentUser = { role: ROLES.ACCOUNTANT, id: 'ACC-05', name: 'Nabin Jha' };
    } else if (phone.startsWith('984')) {
        currentUser = { role: ROLES.PRINCIPAL, id: 'P-01', name: 'Dr. Hari Bansha' };
    } else {
        try {
            const snap = await db.ref('school/students/' + phone).once('value');
            if (snap.exists()) {
                const s = snap.val();
                currentUser = { 
                    role: ROLES.PARENT,
                    id: 'P-' + phone.slice(-4),
                    name: s.parentName || 'Parent',
                    phone: phone,
                    student: {
                        name: s.name,
                        grade: s.class,
                        section: s.section,
                        roll: s.roll,
                        bloodGroup: s.bloodGroup,
                        photo: s.photo,
                        classTeacher: 'Assigned by Admin',
                        schedule: [
                            { period: '1st', time: '10:00 AM', subject: 'Mathematics', teacher: 'Ms. Sunita Rai', days: 'Sun - Fri' },
                            { period: 'Break', time: '01:00 PM', subject: 'Lunch Break', teacher: '-', days: 'Daily' }
                        ],
                        marks: { "Term 1": [ ] }
                    }
                };
            } else {
                // Fallback for testing with non-registered numbers
                currentUser = { 
                    role: ROLES.PARENT,
                    id: 'MOCK-001',
                    name: 'Guest Parent',
                    phone: phone,
                    student: {
                        name: 'Demo Student',
                        grade: '10',
                        section: 'A',
                        roll: '01',
                        bloodGroup: 'O+',
                        photo: 'https://via.placeholder.com/150',
                        classTeacher: 'Ms. Sunita Rai',
                        schedule: [ ],
                        marks: { "Term 1": [ ] }
                    }
                };
            }
        } catch (e) {
            console.error(e);
        }
    }
    window.loginStep = 1;
    localStorage.setItem('school_app_user', JSON.stringify(currentUser));
    router('dashboard');
}

function handleLogout() {
    localStorage.removeItem('school_app_user');
    currentUser = null;
    window.loginStep = 1;
    router('login');
}
function filterList(input, listId) {
    const filter = input.value.toLowerCase();
    const list = document.getElementById(listId);
    if (!list) return;
    const items = list.getElementsByClassName('list-item');
    for (let i = 0; i < items.length; i++) {
        const text = items[i].innerText.toLowerCase();
        items[i].style.display = text.indexOf(filter) > -1 ? "" : "none";
    }
}

async function loadStudentsList() {
    const list = document.getElementById('student-list');
    if (!list) return;
    try {
        const snap = await db.ref('school/students').once('value');
        const students = snap.val();
        if (!students) {
            list.innerHTML = `<div class="text-center py-10 text-gray-400">No students found.</div>`;
            return;
        }
        list.innerHTML = Object.entries(students).map(([phone, data]) => `
            <div onclick="viewStudentProfile('${phone}')" class="mobile-card list-item flex items-center p-4 cursor-pointer active:bg-gray-50">
                <img src="${data.photo || 'https://via.placeholder.com/150'}" class="w-12 h-12 rounded-xl object-cover mr-4 border border-gray-100">
                <div class="flex-grow">
                    <h4 class="font-bold text-gray-800">${data.name}</h4>
                    <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">${data.class}-${data.section}</p>
                </div>
                <i class="fas fa-chevron-right text-gray-200 text-xs"></i>
            </div>
        `).join('');
    } catch (e) {
        list.innerHTML = `<div class="text-center py-10 text-red-400">Error loading data.</div>`;
    }
}

async function loadTeachersList() {
    const list = document.getElementById('teacher-list');
    if (!list) return;
    try {
        const snap = await db.ref('school/teachers').once('value');
        const teachers = snap.val();
        if (!teachers) {
            list.innerHTML = `<div class="text-center py-10 text-gray-400">No teachers found.</div>`;
            return;
        }
        list.innerHTML = Object.entries(teachers).map(([phone, data]) => `
            <div class="mobile-card list-item flex items-center p-4">
                <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 font-bold text-lg mr-4">
                    ${data.name.charAt(0)}
                </div>
                <div class="flex-grow">
                    <h4 class="font-bold text-gray-800">${data.name}</h4>
                    <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">${data.subjects ? data.subjects.join(', ') : 'No Subjects'}</p>
                </div>
                <a href="tel:${data.phone}" class="w-9 h-9 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
                    <i class="fas fa-phone-alt text-sm"></i>
                </a>
            </div>
        `).join('');
    } catch (e) {
        list.innerHTML = `<div class="text-center py-10 text-red-400">Error loading data.</div>`;
    }
}

async function viewStudentProfile(phone) {
    router('studentDetails');
    const container = document.getElementById('student-profile-container');
    if (!container) return;
    try {
        const snap = await db.ref('school/students/' + phone).once('value');
        const data = snap.val();
        
        container.innerHTML = `
            <div class="flex flex-col items-center py-6">
                <div class="w-32 h-32 rounded-3xl overflow-hidden border-4 border-white shadow-xl mb-4">
                    <img src="${data.photo || 'https://via.placeholder.com/150'}" class="w-full h-full object-cover">
                </div>
                <h2 class="text-2xl font-black text-gray-800">${data.name}</h2>
                <span class="text-xs text-blue-600 font-bold uppercase tracking-widest">Class ${data.class}-${data.section}</span>
            </div>

            <div class="grid grid-cols-2 gap-3 mb-6">
                <div class="mobile-card bg-gray-50 border-none">
                    <p class="text-[9px] font-bold text-gray-400 uppercase mb-1">Blood Group</p>
                    <p class="font-black text-gray-800">${data.bloodGroup || 'N/A'}</p>
                </div>
                <div class="mobile-card bg-gray-50 border-none">
                    <p class="text-[9px] font-bold text-gray-400 uppercase mb-1">Roll Number</p>
                    <p class="font-black text-gray-800">${data.roll || 'TBD'}</p>
                </div>
            </div>

            <div class="mobile-card space-y-4">
                <div>
                    <p class="text-[9px] font-bold text-gray-400 uppercase">Parent/Guardian</p>
                    <p class="font-bold text-gray-700">${data.parentName || 'N/A'}</p>
                </div>
                <div class="flex items-center justify-between border-t border-gray-50 pt-4">
                    <div>
                        <p class="text-[9px] font-bold text-gray-400 uppercase">Registered Mobile</p>
                        <p class="font-bold text-gray-700">${data.phone}</p>
                    </div>
                    <a href="tel:${data.phone}" class="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                        <i class="fas fa-phone-alt"></i>
                    </a>
                </div>
            </div>

            <div class="mt-4 grid grid-cols-2 gap-3">
                <button onclick="alert('Attendance Logs coming soon...')" class="bg-gray-800 text-white p-4 rounded-xl text-xs font-bold shadow-lg active:scale-95 transition-all">
                    View Attendance
                </button>
                <button onclick="alert('Results Management coming soon...')" class="bg-blue-700 text-white p-4 rounded-xl text-xs font-bold shadow-lg active:scale-95 transition-all">
                    Manage Marks
                </button>
            </div>
            
            <button onclick="deleteStudent('${data.phone}')" class="w-full mt-4 bg-red-50 text-red-600 p-4 rounded-xl text-xs font-black active:scale-95 transition-all">
                <i class="fas fa-trash-alt mr-2"></i> Delete Student Record
            </button>

            <button onclick="router('viewStudents')" class="w-full text-gray-400 font-bold py-6 text-xs">
                <i class="fas fa-arrow-left mr-1"></i> Back to Directory
            </button>
        `;
    } catch (e) {
        container.innerHTML = `<div class="text-center py-10 text-red-400">Error fetching student profile.</div>`;
    }
}
// Data Persistence Logic (Firebase)
function previewImage(input, previewId) {
    const preview = document.getElementById(previewId);
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" class="w-full h-full object-cover">`;
        }
        reader.readAsDataURL(input.files[0]);
    }
}

async function uploadFile(file, path) {
    const storageRef = storage.ref(path);
    const snapshot = await storageRef.put(file);
    return await snapshot.ref.getDownloadURL();
}

async function saveStudent() {
    const name = document.getElementById('std-name').value;
    const className = document.getElementById('std-class').value;
    const blood = document.getElementById('std-blood').value;
    const parent = document.getElementById('std-parent').value;
    const phone = document.getElementById('std-phone').value;
    const photoFile = document.getElementById('std-photo-input').files[0];

    if (!name || !phone || !className) {
        alert("Please fill all required fields (Name, Class, Phone)");
        return;
    }

    // Logic for section parsing
    let finalClass = className;
    let section = "General";
    if (className.includes('-')) {
        const parts = className.split('-');
        finalClass = parts[0];
        section = parts[1];
    }

    let photoUrl = "https://via.placeholder.com/150"; // Default

    try {
        if (photoFile) {
            photoUrl = await uploadFile(photoFile, `school/students/${phone}/profile.jpg`);
        }

        const studentData = {
            name,
            class: finalClass,
            section: section,
            bloodGroup: blood,
            parentName: parent,
            phone: phone,
            photo: photoUrl,
            roll: 'TBD',
            createdAt: firebase.database.ServerValue.TIMESTAMP
        };

        await db.ref('school/students/' + phone).set(studentData);
        alert("Student Registered Successfully!");
        router('dashboard');
    } catch (e) {
        console.error(e);
        alert("Error saving student data: " + e.message);
    }
}

async function saveTeacher() {
    const name = document.getElementById('tch-name').value;
    const phone = document.getElementById('tch-phone').value;
    const subjects = document.getElementById('tch-subjects').value;
    const classes = document.getElementById('tch-classes').value;

    if (!name || !phone) {
        alert("Name and Phone are required.");
        return;
    }

    const teacherData = {
        name,
        phone,
        subjects: subjects.split(',').map(s => s.trim()),
        assignedClasses: classes.split(',').map(c => c.trim()),
        role: 'teacher'
    };

    try {
        await db.ref('school/teachers/' + phone).set(teacherData);
        alert("Teacher Registered Successfully!");
        router('dashboard');
    } catch (e) {
        console.error(e);
        alert("Error saving teacher data.");
    }
}

async function loadAdminNotices() {
    const container = document.getElementById('admin-recent-notices');
    if (!container) return;
    try {
        const snap = await db.ref('school/notices').limitToLast(3).once('value');
        const notices = snap.val();
        if (!notices) return;
        container.innerHTML = Object.values(notices).reverse().map(n => `
            <div class="mobile-card !p-4 border-l-4 border-teal-500">
                <h4 class="text-xs font-black text-gray-800">${n.title}</h4>
                <p class="text-[10px] text-gray-500 mt-1 line-clamp-2">${n.body}</p>
                <div class="flex justify-between items-center mt-3 pt-2 border-t border-gray-50">
                    <span class="text-[9px] font-bold text-teal-600 uppercase">${n.target}</span>
                    <span class="text-[9px] text-gray-300 font-medium">${new Date(n.timestamp).toLocaleDateString()}</span>
                </div>
            </div>
        `).join('');
    } catch (e) { console.error(e); }
}

async function deleteStudent(phone) {
    if (!confirm("Are you sure you want to permanently delete this student record?")) return;
    try {
        await db.ref('school/students/' + phone).remove();
        alert("Student record deleted.");
        router('viewStudents');
    } catch (e) {
        alert("Failed to delete record.");
    }
}

async function broadcastNotice() {
    const target = document.getElementById('notice-target').value;
    const title = document.getElementById('notice-title').value;
    const body = document.getElementById('notice-body').value;
    const targetClass = document.getElementById('notice-class').value;

    if (!title || !body) {
        alert("Please fill in title and message.");
        return;
    }

    const noticeData = {
        target,
        targetClass: target === 'specific' ? targetClass : null,
        title,
        body,
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        sender: currentUser.name
    };

    try {
        await db.ref('school/notices').push(noticeData);
        alert("Notice Broadcasted!");
        router('dashboard');
    } catch (e) {
        console.error(e);
        alert("Failed to send notice.");
    }
}

function renderDebugMenu() {
    let debugContainer = document.getElementById('debug-menu-container');
    if (!debugContainer) {
        debugContainer = document.createElement('div');
        debugContainer.id = 'debug-menu-container';
        document.body.appendChild(debugContainer);
    }

    debugContainer.innerHTML = `
        <div class="fixed bottom-24 right-4 z-[200]">
            <button onclick="toggleDebugMenu()" class="w-12 h-12 bg-gray-800 text-white rounded-full shadow-2xl flex items-center justify-center border-2 border-white/20 active:scale-90 transition-all">
                <i class="fas fa-bug"></i>
            </button>
            <div id="debug-options" class="hidden absolute bottom-14 right-0 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 w-48 space-y-1">
                <p class="text-[10px] font-black text-gray-400 uppercase px-3 py-1">Switch Role</p>
                <button onclick="debugLogin('9800000000')" class="w-full text-left px-3 py-2 text-xs font-bold hover:bg-gray-50 rounded-lg flex items-center">
                    <i class="fas fa-user-friends mr-2 text-blue-500"></i> Parent View
                </button>
                <button onclick="debugLogin('9810000000')" class="w-full text-left px-3 py-2 text-xs font-bold hover:bg-gray-50 rounded-lg flex items-center">
                    <i class="fas fa-chalkboard-teacher mr-2 text-indigo-500"></i> Teacher View
                </button>
                <button onclick="debugLogin('9820000000')" class="w-full text-left px-3 py-2 text-xs font-bold hover:bg-gray-50 rounded-lg flex items-center">
                    <i class="fas fa-user-shield mr-2 text-red-500"></i> Admin View
                </button>
                <button onclick="debugLogin('9830000000')" class="w-full text-left px-3 py-2 text-xs font-bold hover:bg-gray-50 rounded-lg flex items-center">
                    <i class="fas fa-file-invoice-dollar mr-2 text-green-500"></i> Accountant View
                </button>
                <button onclick="debugLogin('9840000000')" class="w-full text-left px-3 py-2 text-xs font-bold hover:bg-gray-50 rounded-lg flex items-center">
                    <i class="fas fa-university mr-2 text-purple-500"></i> Principal View
                </button>
                <hr class="my-1 border-gray-50">
                <button onclick="localStorage.clear(); location.reload();" class="w-full text-left px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg flex items-center">
                    <i class="fas fa-trash-alt mr-2"></i> Clear Session
                </button>
            </div>
        </div>
    `;
}

function toggleDebugMenu() {
    const options = document.getElementById('debug-options');
    options.classList.toggle('hidden');
}

function debugLogin(phone) {
    window.tempPhone = phone;
    handleLogin();
    toggleDebugMenu();
}

// Initial Load with Startup Animation
window.onload = () => {
    // Check for saved session
    const savedUser = localStorage.getItem('school_app_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
    }

    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        const app = document.getElementById('app');
        
        splash.classList.add('opacity-0');
        setTimeout(() => {
            splash.style.display = 'none';
            app.classList.remove('opacity-0');
            router(currentUser ? 'dashboard' : 'login');
        }, 700);
    }, 2500); // 2.5s splash duration
};