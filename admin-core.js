// Admin Core Router and Views Definition

// Check authorization on load
if (checkAuth([ROLES.ADMIN])) {
    document.addEventListener('DOMContentLoaded', () => {
        adminRouter('dashboard');
    });
}

const adminViews = {
    
    subjectManager: {
        title: 'Subject Configuration',
        render: () => `
            <div class="space-y-6">
                <div class="mobile-card">
                    <h3 class="text-xs font-black uppercase text-indigo-600 mb-4 tracking-wider">Configure Class Subjects</h3>
                    <div class="grid grid-cols-2 gap-3 mb-4">
                        <div>
                            <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Select Class</label>
                            <select id="subj-class-select" onchange="loadClassSubjects()" class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-xs font-bold">
                                <option value="">- Choose -</option>
                                <option value="1">Class 1</option>
                                <option value="2">Class 2</option>
                                <option value="3">Class 3</option>
                                <option value="4">Class 4</option>
                                <option value="5">Class 5</option>
                                <option value="6">Class 6</option>
                                <option value="7">Class 7</option>
                                <option value="8">Class 8</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Subject Type</label>
                            <select id="subj-type" class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-xs font-bold">
                                <option value="compulsory">Compulsory</option>
                                <option value="optional_1">Optional I</option>
                                <option value="optional_2">Optional II</option>
                                <option value="optional_3">Optional III</option>
                                <option value="optional_4">Optional IV</option>
                                <option value="optional_5">Optional V</option>
                            </select>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <input type="text" id="subj-name-input" class="flex-grow p-3 bg-white border border-gray-200 rounded-xl outline-none text-sm font-bold" placeholder="Subject Name (e.g. Science)">
                        <button onclick="addSubjectToClass()" class="bg-indigo-600 text-white px-6 rounded-xl font-black text-xs active:scale-95 transition-transform">ADD</button>
                    </div>
                </div>

                <div id="class-subjects-display" class="space-y-4 pb-20">
                    <div class="text-center py-10 text-gray-300 text-xs italic">Select a class to view/manage subjects</div>
                </div>
            </div>
        `
    },
    dashboard: {
        title: 'Central Command',
        render: () => `
            <div class="mb-6">
                <h2 class="text-2xl font-black text-gray-800">Admin Panel</h2>
                <p class="text-xs text-red-600 font-bold tracking-widest uppercase mt-1">Central Command</p>
            </div>
            
            <div class="grid grid-cols-2 gap-4 mb-6">
                <div onclick="adminRouter('viewStudents')" class="mobile-card !p-5 bg-blue-50 border-none shadow-none cursor-pointer">
                    <i class="fas fa-users text-blue-600 text-xl mb-2"></i>
                    <h4 id="stat-students" class="text-2xl font-black">...</h4>
                    <p class="text-[10px] text-gray-400 uppercase font-bold tracking-wide mt-1">Students</p>
                </div>
                <div onclick="adminRouter('viewTeachers')" class="mobile-card !p-5 bg-purple-50 border-none shadow-none cursor-pointer">
                    <i class="fas fa-chalkboard-teacher text-purple-600 text-xl mb-2"></i>
                    <h4 id="stat-teachers" class="text-2xl font-black">...</h4>
                    <p class="text-[10px] text-gray-400 uppercase font-bold tracking-wide mt-1">Teachers</p>
                </div>
            </div>

            <h3 class="font-bold text-gray-800 mb-4">Management Core</h3>
            <div class="grid grid-cols-2 gap-4 mb-8">
                <button onclick="adminRouter('addStudent')" class="mobile-card flex flex-col items-center justify-center p-6 text-blue-700 bg-white hover:bg-gray-50">
                    <i class="fas fa-user-plus text-xl mb-2"></i>
                    <span class="text-[10px] font-black uppercase">Add Student</span>
                </button>
                <button onclick="adminRouter('addTeacher')" class="mobile-card flex flex-col items-center justify-center p-6 text-purple-700 bg-white hover:bg-gray-50">
                    <i class="fas fa-chalkboard-teacher text-xl mb-2"></i>
                    <span class="text-[10px] font-black uppercase">Add Teacher</span>
                </button>
                <button onclick="adminRouter('examsManagement')" class="mobile-card flex flex-col items-center justify-center p-6 text-orange-700 bg-white hover:bg-gray-50">
                    <i class="fas fa-file-signature text-xl mb-2"></i>
                    <span class="text-[10px] font-black uppercase">Exam Windows</span>
                </button>
                <button onclick="adminRouter('sendNotice')" class="mobile-card flex flex-col items-center justify-center p-6 text-teal-700 bg-white hover:bg-gray-50">
                    <i class="fas fa-bullhorn text-xl mb-2"></i>
                    <span class="text-[10px] font-black uppercase">Send Notice</span>
                </button>
    
                <button onclick="adminRouter('subjectManager')" class="mobile-card flex flex-col items-center justify-center p-6 text-indigo-700 bg-white hover:bg-gray-50">
                    <i class="fas fa-book text-xl mb-2"></i>
                    <span class="text-[10px] font-black uppercase">Subject Manager</span>
                </button>
            </div>

            <div onclick="adminRouter('helpDesk')" class="mobile-card flex items-center p-4 bg-teal-50 hover:bg-teal-100/30 border-none shadow-none mb-4 cursor-pointer active:scale-98 transition-all">
                <div class="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 mr-4">
                    <i class="fas fa-ticket-alt text-sm"></i>
                </div>
                <div class="flex-grow">
                    <h4 class="text-sm font-bold text-gray-800">Support Help Desk</h4>
                    <p class="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Manage and resolve parent support tickets</p>
                </div>
                <i class="fas fa-chevron-right text-gray-400 text-xs"></i>
            </div>

            <div onclick="adminRouter('parentSuggestionsBoard')" class="mobile-card flex items-center p-4 bg-amber-50 hover:bg-amber-100/30 border-none shadow-none mb-4 cursor-pointer active:scale-98 transition-all">
                <div class="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mr-4">
                    <i class="fas fa-comment-dots text-sm"></i>
                </div>
                <div class="flex-grow">
                    <h4 class="text-sm font-bold text-gray-800">Parent Suggestions</h4>
                    <p class="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Read feedback and suggestions submitted by parents</p>
                </div>
                <i class="fas fa-chevron-right text-gray-400 text-xs"></i>
            </div>

            <div onclick="adminRouter('classReassignmentQueue')" class="mobile-card flex items-center p-4 bg-purple-50 hover:bg-purple-100/30 border-none shadow-none mb-8 cursor-pointer active:scale-98 transition-all">
                <div class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mr-4">
                    <i class="fas fa-exchange-alt text-sm"></i>
                </div>
                <div class="flex-grow">
                    <h4 class="text-sm font-bold text-gray-800">Class Change Requests</h4>
                    <p class="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Approve or deny teacher workload changes</p>
                </div>
                <i class="fas fa-chevron-right text-gray-400 text-xs"></i>
            </div>

            <div class="flex justify-between items-center mb-4">
                <h3 class="font-bold text-gray-800">Recent Notices</h3>
                <span onclick="await alert('Opening Notice Board Manager...')" class="text-[10px] font-bold text-blue-600 uppercase cursor-pointer">View All</span>
            </div>
            <div id="admin-recent-notices" class="space-y-3 pb-10">
                <div class="text-center py-6 text-gray-300 text-xs italic">No announcements found.</div>
            </div>
        `
    },
    viewStudents: {
        title: 'Students Directory',
        render: () => {
            setTimeout(initializeDirectoryFilters, 50);
            return `
            <div class="mb-4 space-y-3">
                <div class="relative">
                    <input type="text" onkeyup="filterList(this, 'student-list')" class="w-full p-4 bg-white border border-gray-100 rounded-xl shadow-sm outline-none pl-12 text-sm" placeholder="Search students by name...">
                    <i class="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 font-bold"></i>
                </div>
                <div class="mobile-card flex items-center justify-between !py-2 bg-white">
                    <label class="text-[10px] font-black text-gray-400 uppercase tracking-tight">Level</label>
                    <select id="filter-level" onchange="loadStudentsList()" class="p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-black outline-none w-48 text-right">
                        <option value="all">ALL CLASSES</option>
                    </select>
                    <select id="filter-section" class="hidden">
                        <option value="all" selected>all</option>
                    </select>
                </div>
            </div>
            <div id="student-list" class="space-y-3">
                <div class="text-center py-10 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Loading Directory...</div>
            </div>
            <button onclick="adminRouter('dashboard')" class="w-full text-gray-400 font-bold py-6 text-xs text-center block">
                <i class="fas fa-arrow-left mr-1"></i> Back to Panel
            </button>
            `;
        }
    },
    viewTeachers: {
        title: 'Faculty Directory',
        render: () => `
            <div id="teacher-list-container" class="space-y-3 pb-10">
                <div class="text-center py-10 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Loading Faculty...</div>
            </div>
            <button onclick="adminRouter('dashboard')" class="w-full text-gray-400 font-bold py-6 text-xs text-center block">
                <i class="fas fa-arrow-left mr-1"></i> Back to Panel
            </button>
        `
    },
    studentDetails: {
        title: 'Details View',
        render: () => `
            <div id="student-profile-container">
                 <div class="text-center py-10 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Fetching Profile...</div>
            </div>
        `
    },
    helpDesk: {
        title: 'Support Help Desk',
        render: () => `
            <div class="mb-4">
                <p class="text-xs text-gray-500">Track and resolve parent support requests</p>
            </div>
            
            <div id="admin-helpdesk-list" class="space-y-3 pb-16">
                <div class="text-center py-10 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Loading active tickets...</div>
            </div>

            <button onclick="adminRouter('dashboard')" class="w-full text-gray-400 font-bold py-6 text-xs text-center block">
                <i class="fas fa-arrow-left mr-1"></i> Back to Panel
            </button>
        `
    },
    examsManagement: {
        title: 'Exam Configuration',
        render: () => `
            <div class="mb-6">
                <h2 class="text-xl font-black text-gray-800">Exam Term Windows</h2>
                <p class="text-xs text-gray-500 mt-1">Configure active exam evaluation terms, marks scales, and entry deadlines for teachers.</p>
            </div>

            <div class="space-y-4 pb-16">
                <div class="mobile-card">
                    <h3 class="text-xs font-black uppercase text-orange-600 mb-3 tracking-wider"><i class="fas fa-plus-circle mr-1"></i>Schedule New Exam Term</h3>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Exam Name / Title</label>
                            <input type="text" id="exam-title" class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm font-bold" placeholder="e.g. First Terminal Exam 2026">
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Term Key</label>
                                <select id="exam-term-id" class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-xs font-bold">
                                    <option value="Term 1">First Term (Term 1)</option>
                                    <option value="Term 2">Second Term (Term 2)</option>
                                    <option value="Term 3">Third Term (Term 3)</option>
                                    <option value="Finals">Final Examination</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Status</label>
                                <select id="exam-status" class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-xs font-bold">
                                    <option value="Active">Active (Open for Entries)</option>
                                    <option value="Closed">Closed (Locked)</option>
                                </select>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Opening Date (BS)</label>
                                <input type="text" id="exam-opening" class="w-full p-2 bg-gray-50 border border-gray-100 rounded-xl outline-none text-xs font-bold" placeholder="YYYY-MM-DD" value="${getFormattedCurrentNepaliDate()}">
                            </div>
                            <div>
                                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Closing Date (BS)</label>
                                <input type="text" id="exam-closing" class="w-full p-2 bg-gray-50 border border-gray-100 rounded-xl outline-none text-xs font-bold" placeholder="YYYY-MM-DD" value="${convertToNepaliDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000))}">
                            </div>
                        </div>
    
                        <div class="p-3 bg-orange-50 rounded-xl border border-orange-100">
                            <p class="text-[10px] text-orange-700 font-bold leading-tight"><i class="fas fa-info-circle mr-1"></i> Marks Scaling: Full Marks and Pass Marks are now managed dynamically by Teachers during grading.</p>
                        </div>
                        <button onclick="saveExamWindow()" class="w-full bg-orange-600 hover:bg-orange-700 text-white font-black py-3.5 rounded-xl shadow-md active:scale-95 transition-all text-xs">
                            <i class="fas fa-save mr-1"></i> Save Exam Window
                        </button>
                    </div>
                </div>

                <h3 class="font-bold text-gray-800 text-sm px-1 mb-2">Active & Scheduled Windows</h3>
                <div id="admin-exams-list" class="space-y-3">
                    <div class="text-center py-6 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Loading scheduled terms...</div>
                </div>

                <button onclick="adminRouter('dashboard')" class="w-full text-gray-400 font-bold py-6 text-xs text-center block">
                    <i class="fas fa-arrow-left mr-1"></i> Back to Panel
                </button>
            </div>
        `
    },
    addStudent: {
        title: 'Register Student',
        render: () => {
            setTimeout(async () => {
                const { classes, sections } = await getSchoolMetadata();
                const clsSel = document.getElementById('std-class-lvl');
                if (clsSel) classes.forEach(c => clsSel.add(new Option(`Class ${c}`, c)));
            }, 50);
            return `
            <div class="mb-6">
                <h2 class="text-xl font-black text-gray-800">Student Enrollment</h2>
                <p class="text-xs text-gray-500 mt-1">Onboard a new student with complete personal, family, address, and academic records.</p>
            </div>
            
            <div class="space-y-6 pb-16">
                <!-- Section 1: Personal Details -->
                <div class="mobile-card">
                    <h3 class="text-xs font-black uppercase text-blue-600 mb-3 tracking-wider">1. Student Personal Details</h3>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Student Photo</label>
                            <div class="flex items-center gap-4">
                                <div id="std-photo-preview" class="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 overflow-hidden border-2 border-dashed border-gray-200">
                                    <i class="fas fa-camera text-xl"></i>
                                </div>
                                <input type="file" id="std-photo-input" class="hidden" accept="image/*" onchange="previewImage(this, 'std-photo-preview')">
                                <button onclick="document.getElementById('std-photo-input').click()" class="bg-gray-100 px-4 py-2 rounded-lg text-xs font-bold text-gray-600">Select Photo</button>
                            </div>
                        </div>

                        <div class="grid grid-cols-3 gap-3">
                            <div>
                                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">First Name</label>
                                <input type="text" id="std-fname" class="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs" placeholder="Aarav">
                            </div>
                            <div>
                                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Middle Name</label>
                                <input type="text" id="std-mname" class="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs" placeholder="Chandra">
                            </div>
                            <div>
                                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Last Name</label>
                                <input type="text" id="std-lname" class="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs" placeholder="Sharma">
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Gender</label>
                                <select id="std-gender" class="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs">
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Date of Birth (BS)</label>
                                <input type="text" id="std-dob" placeholder="YYYY-MM-DD (e.g. 2075-04-12)" oninput="calculateNepaliAgeOnboarding()" class="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs">
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Student Age (Auto-calculated)</label>
                                <input type="number" id="std-age" readonly class="w-full p-2.5 bg-gray-100 border border-gray-100 rounded-xl outline-none text-xs cursor-not-allowed" placeholder="Calculated Age">
                            </div>
                            <div>
                                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Blood Group</label>
                                <select id="std-blood" class="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs">
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
                    </div>
                </div>

                <!-- Section 2: Family & Contact Details -->
                <div class="mobile-card">
                    <h3 class="text-xs font-black uppercase text-blue-600 mb-3 tracking-wider">2. Family & Contact Details</h3>
                    <div class="space-y-4">
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Father's Name</label>
                                <input type="text" id="std-father" class="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs" placeholder="Ramesh Sharma">
                            </div>
                            <div>
                                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Mother's Name</label>
                                <input type="text" id="std-mother" class="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs" placeholder="Sita Sharma">
                            </div>
                        </div>

                        <div>
                            <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Parent Mobiles (Comma separated for multiple logins)</label>
                            <p class="text-[9px] text-gray-400 mb-2">Each phone number entered will have access to log into the parent account.</p>
                            <div class="relative">
                                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">+977</span>
                                <input type="tel" id="std-phone" class="w-full p-2.5 pl-12 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs" placeholder="98XXXXXXXX, 98YYYYYYYY">
                            </div>
                        </div>

                        <div>
                            <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Parent Email</label>
                            <input type="email" id="std-email" class="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs" placeholder="ramesh.sharma@gmail.com">
                        </div>
                    </div>
                </div>

                <!-- Section 3: Address Details -->
                <div class="mobile-card">
                    <h3 class="text-xs font-black uppercase text-blue-600 mb-3 tracking-wider">3. Address Information</h3>
                    <div class="space-y-4">
                        <p class="text-[10px] font-bold text-gray-400 uppercase">A. Current Address</p>
                        <div class="grid grid-cols-3 gap-2">
                            <input type="text" id="std-curr-street" class="p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs" placeholder="Street/Tole">
                            <input type="text" id="std-curr-city" class="p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs" placeholder="City">
                            <input type="text" id="std-curr-district" class="p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs" placeholder="District">
                        </div>

                        <div class="flex items-center gap-2 py-1">
                            <input type="checkbox" id="std-sync-addr" onchange="syncStudentAddress(this)" class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                            <label for="std-sync-addr" class="text-[10px] font-bold text-blue-700 uppercase cursor-pointer">Permanent address same as current</label>
                        </div>

                        <p class="text-[10px] font-bold text-gray-400 uppercase">B. Permanent Address</p>
                        <div class="grid grid-cols-3 gap-2">
                            <input type="text" id="std-perm-street" class="p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs" placeholder="Street/Tole">
                            <input type="text" id="std-perm-city" class="p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs" placeholder="City">
                            <input type="text" id="std-perm-district" class="p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs" placeholder="District">
                        </div>
                    </div>
                </div>

                <!-- Section 4: Academic & Verified Documents -->
                <div class="mobile-card">
                    <h3 class="text-xs font-black uppercase text-blue-600 mb-3 tracking-wider">4. Academic & Document Records</h3>
                    <div class="space-y-4">
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Level (Class 1-8)</label>
                                <select id="std-class-lvl" class="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs font-bold">
                                    <option value="">- Select -</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Join Year</label>
                                <input type="number" id="std-join" class="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs" value="2026">
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-3 border-t border-gray-100 pt-4">
                            <div>
                                <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1">Birth Certificate</label>
                                <input type="file" id="std-birth-input" class="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200" accept="image/*">
                            </div>
                            <div>
                                <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1">Transfer Certificate</label>
                                <input type="file" id="std-transfer-input" class="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200" accept="image/*">
                            </div>
                        </div>
                    </div>
                </div>

                <button onclick="saveStudent()" class="w-full bg-blue-700 text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all">
                    <i class="fas fa-save mr-2"></i> Register and Generate ID
                </button>
                <button onclick="adminRouter('dashboard')" class="w-full text-gray-400 font-bold py-2 text-xs">
                    Cancel
                </button>
            </div>
            `;
        }
    },
    addTeacher: {
        title: 'Add Teacher',
        render: () => {
            return `
            <div class="mb-6">
                <h2 class="text-xl font-black text-gray-800">Faculty Registration</h2>
                <p class="text-xs text-gray-500 mt-1">Register a new teacher and capture complete credentials, qualifications, and official verification details.</p>
            </div>
            
            <div class="space-y-6 pb-16">
                <!-- Section 1: Personal Details -->
                <div class="mobile-card">
                    <h3 class="text-xs font-black uppercase text-purple-600 mb-3 tracking-wider">1. Teacher Personal Details</h3>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Profile Photo</label>
                            <div class="flex items-center gap-4">
                                <div id="tch-photo-preview" class="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 overflow-hidden border-2 border-dashed border-gray-200">
                                    <i class="fas fa-camera text-xl"></i>
                                </div>
                                <input type="file" id="tch-photo-input" class="hidden" accept="image/*" onchange="previewImage(this, 'tch-photo-preview')">
                                <button onclick="document.getElementById('tch-photo-input').click()" class="bg-gray-100 px-4 py-2 rounded-lg text-xs font-bold text-gray-600">Select Photo</button>
                            </div>
                        </div>

                        <div class="grid grid-cols-3 gap-3">
                            <div>
                                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">First Name</label>
                                <input type="text" id="tch-fname" class="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-xs" placeholder="Sunita">
                            </div>
                            <div>
                                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Middle Name</label>
                                <input type="text" id="tch-mname" class="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-xs" placeholder="Kumari">
                            </div>
                            <div>
                                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Last Name</label>
                                <input type="text" id="tch-lname" class="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-xs" placeholder="Rai">
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Gender</label>
                                <select id="tch-gender" class="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-xs">
                                    <option value="Female">Female</option>
                                    <option value="Male">Male</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Date of Birth (BS)</label>
                                <input type="text" id="tch-dob" placeholder="YYYY-MM-DD" class="w-full p-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-xs">
                            </div>
    

                        <div>
                            <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Blood Group</label>
                            <select id="tch-blood" class="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-xs">
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
                </div>

                <!-- Section 2: Contact Details -->
                <div class="mobile-card">
                    <h3 class="text-xs font-black uppercase text-purple-600 mb-3 tracking-wider">2. Contact Details</h3>
                    <div class="space-y-4">
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Primary Mobile (Login)</label>
                                <input type="tel" id="tch-phone" class="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-xs" placeholder="98XXXXXXXX">
                            </div>
                            <div>
                                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Secondary Mobile</label>
                                <input type="tel" id="tch-phone2" class="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-xs" placeholder="98YYYYYYYY">
                            </div>
                        </div>

                        <div>
                            <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Email Address</label>
                            <input type="email" id="tch-email" class="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-xs" placeholder="sunita.rai@school.edu">
                        </div>
                    </div>
                </div>

                <!-- Section 3: Address Details -->
                <div class="mobile-card">
                    <h3 class="text-xs font-black uppercase text-purple-600 mb-3 tracking-wider">3. Address Information</h3>
                    <div class="space-y-4">
                        <p class="text-[10px] font-bold text-gray-400 uppercase">A. Current Address</p>
                        <div class="grid grid-cols-3 gap-2">
                            <input type="text" id="tch-curr-street" class="p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs" placeholder="Street/Tole">
                            <input type="text" id="tch-curr-city" class="p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs" placeholder="City">
                            <input type="text" id="tch-curr-district" class="p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs" placeholder="District">
                        </div>

                        <div class="flex items-center gap-2 py-1">
                            <input type="checkbox" id="tch-sync-addr" onchange="syncTeacherAddress(this)" class="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500">
                            <label for="tch-sync-addr" class="text-[10px] font-bold text-purple-700 uppercase cursor-pointer">Permanent address same as current</label>
                        </div>

                        <p class="text-[10px] font-bold text-gray-400 uppercase">B. Permanent Address</p>
                        <div class="grid grid-cols-3 gap-2">
                            <input type="text" id="tch-perm-street" class="p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs" placeholder="Street/Tole">
                            <input type="text" id="tch-perm-city" class="p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs" placeholder="City">
                            <input type="text" id="tch-perm-district" class="p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs" placeholder="District">
                        </div>
                    </div>
                </div>

                <!-- Section 4: Professional Qualifications & ID proof -->
                <div class="mobile-card">
                    <h3 class="text-xs font-black uppercase text-purple-600 mb-3 tracking-wider">4. Professional & Verifiable Records</h3>
                    <div class="space-y-4">
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Highest Qualification / Degree</label>
                                <input type="text" id="tch-qualification" class="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-xs" placeholder="Master of Science (Math)">
                            </div>
                            <div>
                                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Experience Years</label>
                                <input type="number" id="tch-experience" class="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-xs" placeholder="e.g. 5">
                            </div>
                        </div>

                        <div class="space-y-4">
                            <div class="flex justify-between items-center">
                                <label class="block text-[10px] font-black text-gray-400 uppercase tracking-wider">Verification Document Vault</label>
                                <button onclick="addDocumentRow('tch-doc-vault')" class="px-3 py-1 bg-purple-50 text-purple-600 rounded-lg text-[9px] font-black uppercase shadow-sm active:scale-95 transition-all">
                                    <i class="fas fa-plus-circle mr-1"></i> Add Document
                                </button>
                            </div>
                            <div id="tch-doc-vault" class="space-y-3">
                                <div class="doc-row grid grid-cols-12 gap-2 items-end">
                                    <div class="col-span-5">
                                        <label class="text-[8px] font-black text-gray-300 uppercase ml-1">Label</label>
                                        <input type="text" class="doc-label w-full p-2 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-bold outline-none" value="Citizenship Card">
                                    </div>
                                    <div class="col-span-7">
                                        <input type="file" class="doc-file w-full text-[10px] text-gray-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:bg-purple-600 file:text-white" accept="image/*">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Section 5: Assignments -->
                <div class="mobile-card">
                    <h3 class="text-xs font-black uppercase text-purple-600 mb-3 tracking-wider">5. Assigned Academic Workload & Hierarchy</h3>
                    <div class="space-y-4">
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Assigned Classes (e.g. 1, 2, 3)</label>
                                <input type="text" id="tch-classes" class="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-xs" placeholder="1, 2, 3">
                            </div>
                            <div>
                                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Primary Subjects</label>
                                <input type="text" id="tch-subjects" class="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-xs" placeholder="Math, Science">
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Professional Title</label>
                                <input type="text" id="tch-title" class="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-xs" placeholder="e.g. Faculty Member, Principal" value="Faculty Member">
                            </div>
                            <div>
                                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Sort Order (Hierarchy)</label>
                                <input type="number" id="tch-sortOrder" class="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-xs" placeholder="e.g. 1 for Principal, 10 for regular" value="10">
                            </div>
                        </div>
                    </div>
                </div>

                <button onclick="saveTeacher()" class="w-full bg-purple-700 text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all">
                    <i class="fas fa-user-check mr-2"></i> Register and Onboard Faculty
                </button>
                <button onclick="adminRouter('dashboard')" class="w-full text-gray-400 font-bold py-2 text-xs">
                    Cancel
                </button>
            </div>
            `;
        }
    },
    sendNotice: {
        render: () => `
            <div class="mb-6">
                <h2 class="text-xl font-black text-gray-800">Broadcast Message</h2>
                <p class="text-xs text-gray-500 mt-1">Send notifications to parents and teachers</p>
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
                <button onclick="adminRouter('dashboard')" class="w-full text-gray-400 font-bold py-2 text-xs">
                    Cancel
                </button>
            </div>
        `
    },
    parentSuggestionsBoard: {
        title: 'Parent Suggestions Feed',
        render: () => {
            setTimeout(() => {
                loadAdminSuggestionsFeed();
            }, 50);

            return `
                <div class="mb-6 animate-fade-in">
                    <h2 class="text-xl font-black text-gray-800 tracking-tight">Parent Suggestions Feed</h2>
                    <p class="text-xs text-gray-500">Read feedback and suggestions submitted by school parents</p>
                </div>

                <div id="admin-suggestions-list" class="space-y-4 pb-10">
                    <div class="text-center py-10 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Syncing suggestions board...</div>
                </div>
            `;
        }
    },
    classReassignmentQueue: {
        title: 'Class Reassignment Applications',
        render: () => {
            setTimeout(() => {
                loadAdminReassignmentQueue();
            }, 50);

            return `
                <div class="mb-6 animate-fade-in">
                    <h2 class="text-xl font-black text-gray-800 tracking-tight">Class Reassignment Requests</h2>
                    <p class="text-xs text-gray-500">Approve or deny applications submitted by faculty members</p>
                </div>

                <div id="admin-reassignment-list" class="space-y-4 pb-10">
                    <div class="text-center py-10 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Syncing application queue...</div>
                </div>
            `;
        }
    }
};

function adminRouter(viewName) {
    const view = adminViews[viewName] || adminViews.dashboard;
    const backAction = (viewName !== 'dashboard') ? () => adminRouter('dashboard') : null;
    
    renderHeader(view.title, backAction);
    triggerViewTransition();

    document.getElementById('main-content').innerHTML = view.render();

    db.ref('school/students').off();
    db.ref('school/teachers').off();

    if (viewName === 'dashboard') {
        db.ref('school/students').on('value', snap => {
            const el = document.getElementById('stat-students');
            if (el) el.innerText = SafeResolvers.count(snap.numChildren());
        });
        db.ref('school/teachers').on('value', snap => {
            const el = document.getElementById('stat-teachers');
            if (el) el.innerText = SafeResolvers.count(snap.numChildren());
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
            if (targetSelect.value === 'specific') {
                classDiv.classList.remove('hidden');
            } else {
                classDiv.classList.add('hidden');
            }
        });
    }

    if (viewName === 'examsManagement') {
        loadExamWindowsList();
    }

    if (viewName === 'helpDesk') {
        loadHelpDeskTicketsList();
    }

    if (viewName === 'subjectManager') {
        loadClassSubjects();
    }

    if (viewName === 'parentSuggestionsBoard') {
        loadAdminSuggestionsFeed();
    }

    if (viewName === 'classReassignmentQueue') {
        loadAdminReassignmentQueue();
    }

    document.getElementById('main-content').scrollTop = 0;
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

async function initializeDirectoryFilters() {
    const { classes, sections } = await getSchoolMetadata();
    const lvlSelect = document.getElementById('filter-level');
    
    if (lvlSelect) {
        classes.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c; opt.innerText = `Class ${c}`;
            lvlSelect.appendChild(opt);
        });
    }
    loadStudentsList();
}

async function loadAdminNotices() {
    const container = document.getElementById('admin-recent-notices');
    if (!container) return;
    try {
        const snap = await db.ref('school/notices').limitToLast(3).once('value');
        const notices = snap.val();
        if (!notices) {
            container.innerHTML = `<div class="text-center py-6 text-gray-300 text-xs italic">No announcements found.</div>`;
            return;
        }
        container.innerHTML = Object.values(notices).reverse().map(n => `
            <div class="mobile-card !p-4 border-l-4 border-teal-500 bg-white shadow-sm">
                <h4 class="text-xs font-black text-gray-800">${SafeResolvers.text(n.title)}</h4>
                <p class="text-[10px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">${SafeResolvers.text(n.body)}</p>
                <div class="flex justify-between items-center mt-3 pt-2 border-t border-gray-50">
                    <span class="text-[9px] font-bold text-teal-600 uppercase">${SafeResolvers.text(n.target)}</span>
                    <span class="text-[9px] text-gray-300 font-medium">${convertToNepaliDate(n.timestamp)}</span>
                </div>
        `).join('');
    } catch (e) { 
        console.error(e); 
    }
}

async function broadcastNotice() {
    const target = document.getElementById('notice-target').value;
    const title = document.getElementById('notice-title').value.trim();
    const body = document.getElementById('notice-body').value.trim();
    const targetClass = document.getElementById('notice-class').value.trim();

    if (!title || !body) {
        await alert("Please fill in title and message.");
        return;
    }

    const noticeData = {
        target,
        targetClass: target === 'specific' ? targetClass : null,
        title,
        body,
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        sender: currentUser.name || 'Admin'
    };

    try {
        await db.ref('school/notices').push(noticeData);
        await alert("Notice Broadcasted!");
        adminRouter('dashboard');
    } catch (e) {
        console.error(e);
        await alert("Failed to send notice.");
    }
}

async function loadAdminSuggestionsFeed() {
    const container = document.getElementById('admin-suggestions-list');
    if (!container) return;

    try {
        const snap = await db.ref('school/suggestions').once('value');
        const list = snap.val();

        if (!list) {
            container.innerHTML = `<div class="text-center py-10 text-gray-400 text-xs italic bg-white rounded-xl border border-gray-100 p-6">No suggestions have been submitted by parents yet.</div>`;
            return;
        }

        const suggestions = Object.values(list);
        suggestions.sort((a, b) => b.timestamp - a.timestamp);

        container.innerHTML = suggestions.map(s => `
            <div class="mobile-card bg-white p-4 shadow-sm relative overflow-hidden border-l-4 border-amber-500 text-left">
                <div class="flex justify-between items-center mb-2">
                    <div class="flex items-center gap-1.5">
                        <span class="text-xs font-black text-gray-800">${s.parentName}</span>
                        <span class="text-[9px] text-gray-400 font-bold">(${s.parentPhone})</span>
                    </div>
                    <span class="text-[8px] text-gray-400 font-bold">${convertToNepaliDateTime(s.timestamp)}</span>
                </div>
                <p class="text-xs text-gray-700 leading-relaxed font-semibold bg-gray-50 p-3 rounded-xl">${s.message}</p>
                <div class="mt-2 text-[8px] font-black text-blue-600 uppercase tracking-wider">
                    Parent of: ${s.studentName}
                </div>
    
            </div>
        `).join('');

    } catch (e) {
        console.error(e);
        container.innerHTML = `<div class="text-center py-10 text-red-400 text-xs">Error loading suggestions feed: ${e.message}</div>`;
    }
}

async function loadAdminReassignmentQueue() {
    const container = document.getElementById('admin-reassignment-list');
    if (!container) return;

    try {
        const snap = await db.ref('school/class_change_requests').once('value');
        const list = snap.val();

        if (!list) {
            container.innerHTML = `<div class="text-center py-10 text-gray-400 text-xs italic bg-white rounded-xl border border-gray-100 p-6">No reassignment requests submitted.</div>`;
            return;
        }

        const requests = Object.values(list);
        requests.sort((a, b) => b.timestamp - a.timestamp);

        container.innerHTML = requests.map(r => {
            const isPending = r.status === 'Pending';
            let statusColor = "bg-yellow-100 text-yellow-700";
            if (r.status === 'Approved') statusColor = "bg-green-100 text-green-700";
            else if (r.status === 'Denied') statusColor = "bg-red-100 text-red-700";

            let actionButtons = '';
            if (isPending) {
                actionButtons = `
                    <div class="grid grid-cols-2 gap-3 mt-4">
                        <button onclick="handleApproveRequest('${r.requestId}')" class="bg-green-600 text-white font-black py-2 rounded-xl text-[10px] uppercase shadow-sm active:scale-95 transition-all">
                            <i class="fas fa-check mr-1"></i> Approve
                        </button>
                        <button onclick="handleDenyRequest('${r.requestId}')" class="bg-red-600 text-white font-black py-2 rounded-xl text-[10px] uppercase shadow-sm active:scale-95 transition-all">
                            <i class="fas fa-times mr-1"></i> Deny
                        </button>
                    </div>
                `;
            }

            return `
                <div class="mobile-card bg-white p-4 shadow-sm relative overflow-hidden border-l-4 ${isPending ? 'border-yellow-500' : (r.status === 'Approved' ? 'border-green-500' : 'border-red-500')} text-left">
                    <div class="flex justify-between items-center mb-2">
                        <div class="flex items-center gap-1.5">
                            <span class="text-xs font-black text-gray-800">${r.teacherName}</span>
                            <span class="text-[9px] text-gray-400 font-bold">(ID: ${r.teacherId})</span>
                        </div>
                        <span class="px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${statusColor}">${r.status}</span>
                    </div>
                    <h4 class="font-bold text-gray-800 text-sm">Requested: Class ${r.requestedClass} | ${r.requestedSubject}</h4>
                    <p class="text-[9px] text-gray-400 font-bold mt-1 uppercase">Applied: ${convertToNepaliDate(r.timestamp)}</p>
                    ${actionButtons}
                </div>
            `;
        }).join('');
    } catch (e) {
        console.error(e);
        container.innerHTML = `<div class="text-center py-10 text-red-400 text-xs">Error loading request queue: ${e.message}</div>`;
    }
}

async function handleApproveRequest(requestId) {
    if (!confirm("Are you sure you want to APPROVE this workload change request? It will automatically update the teacher's profile and schedule node.")) return;
    try {
        const snap = await db.ref('school/class_change_requests/' + requestId).once('value');
        if (!snap.exists()) {
            await alert("Request not found!");
            return;
        }

        const req = snap.val();
        const teacherId = req.teacherId;

        // 1. Update request status to Approved
        await db.ref('school/class_change_requests/' + requestId).update({ status: 'Approved' });

        // 2. Fetch current teacher's profile to update assignedClasses and schedule
        const tchSnap = await db.ref('school/teachers/' + teacherId).once('value');
        if (tchSnap.exists()) {
            const t = tchSnap.val();
            let classes = t.assignedClasses || [ ];
            if (!classes.includes(req.requestedClass)) {
                classes.push(req.requestedClass);
            }

            let subjects = t.subjects || [ ];
            if (!subjects.includes(req.requestedSubject)) {
                subjects.push(req.requestedSubject);
            }

            // Let's create or update schedule node
            let schedule = t.schedule || [ ];
            // Find if there is a slot, otherwise add one
            const newPeriod = {
                period: (schedule.length + 1) + 'th',
                class: req.requestedClass,
                subject: req.requestedSubject,
                time: '12:00 PM' // default slot
            };
            schedule.push(newPeriod);

            await db.ref('school/teachers/' + teacherId).update({
                assignedClasses: classes,
                subjects: subjects,
                schedule: schedule
            });
        }

        await alert("Request approved and teacher profile updated automatically!");
        loadAdminReassignmentQueue();
    } catch (e) {
        console.error(e);
        await alert("Failed to approve request: " + e.message);
    }
}

async function handleDenyRequest(requestId) {
    if (!confirm("Are you sure you want to DENY this class reassignment request?")) return;
    try {
        await db.ref('school/class_change_requests/' + requestId).update({ status: 'Denied' });
        await alert("Request denied successfully.");
        loadAdminReassignmentQueue();
    } catch (e) {
        console.error(e);
        await alert("Failed to deny request: " + e.message);
    }
}
    