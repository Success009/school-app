// Administration Sub-Application Logic (Updated with Advanced Forms, Sectioned Grids, Address Copying, and Document Uploads)

// Check authorization on load
if (checkAuth([ROLES.ADMIN])) {
    document.addEventListener('DOMContentLoaded', () => {
        adminRouter('dashboard');
    });
}

const adminViews = {
    principalConfig: {
        title: 'Principal Configuration',
        render: () => {
            setTimeout(() => { loadPrincipalData(); }, 100);
            return `
            <div class="space-y-6 animate-fade-in">
                <div class="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                    <div class="flex flex-col items-center mb-4">
                        <div id="prin-photo-preview" class="w-24 h-24 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden mb-2">
                            <i class="fas fa-user-tie text-gray-300 text-2xl"></i>
                        </div>
                        <input type="file" id="prin-photo-input" class="hidden" onchange="previewImage(this, 'prin-photo-preview')">
                        <button onclick="document.getElementById('prin-photo-input').click()" class="text-blue-600 text-[10px] font-bold uppercase tracking-wider">Change Official Photo</button>
                    </div>
                    <div class="space-y-3">
                        <div>
                            <label class="text-[10px] font-black text-gray-400 uppercase ml-1">Full Name</label>
                            <input type="text" id="prin-name" class="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-purple-500 outline-none" placeholder="e.g. Dr. Hari Bansha">
                        </div>
                        <div>
                            <label class="text-[10px] font-black text-gray-400 uppercase ml-1">Primary Login Phone</label>
                            <input type="tel" id="prin-phone-1" class="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-purple-500 outline-none" placeholder="98XXXXXXXX">
                        </div>
                        <div>
                            <label class="text-[10px] font-black text-gray-400 uppercase ml-1">Secondary Phone</label>
                            <input type="tel" id="prin-phone-2" class="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-purple-500 outline-none" placeholder="98XXXXXXXX">
                        </div>
                    </div>
                    <button onclick="savePrincipalConfig()" class="w-full bg-gray-900 text-white font-black py-4 rounded-2xl shadow-xl active:scale-95 transition-transform mt-4">
                        Update Principal Account
                    </button>
                    <button onclick="adminRouter('dashboard')" class="w-full text-gray-400 font-bold py-2 text-xs">Cancel</button>
                </div>
            </div>`;
        }
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
                <button onclick="adminRouter('principalConfig')" class="mobile-card flex flex-col items-center justify-center p-6 text-purple-700 bg-white hover:bg-gray-50">
                    <i class="fas fa-user-tie text-xl mb-2"></i>
                    <span class="text-[10px] font-black uppercase">Principal Settings</span>
                </button>
            </div>

            <div onclick="adminRouter('helpDesk')" class="mobile-card flex items-center p-4 bg-teal-50 hover:bg-teal-100/30 border-none shadow-none mb-8 cursor-pointer active:scale-98 transition-all">
                <div class="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 mr-4">
                    <i class="fas fa-ticket-alt text-sm"></i>
                </div>
                <div class="flex-grow">
                    <h4 class="text-sm font-bold text-gray-800">Support Help Desk</h4>
                    <p class="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Manage and resolve parent support tickets</p>
                </div>
                <i class="fas fa-chevron-right text-gray-400 text-xs"></i>
            </div>

            <div class="flex justify-between items-center mb-4">
                <h3 class="font-bold text-gray-800">Recent Notices</h3>
                <span onclick="alert('Opening Notice Board Manager...')" class="text-[10px] font-bold text-blue-600 uppercase cursor-pointer">View All</span>
            </div>
            <div id="admin-recent-notices" class="space-y-3 pb-10">
                <div class="text-center py-6 text-gray-300 text-xs italic">No announcements found.</div>
            </div>
        `
    },
    viewStudents: {
        title: 'Students Directory',
        render: () => `
            <div class="mb-4 space-y-3">
                <div class="relative">
                    <input type="text" onkeyup="filterList(this, 'student-list')" class="w-full p-4 bg-white border border-gray-100 rounded-xl shadow-sm outline-none pl-12 text-sm" placeholder="Search students by name...">
                    <i class="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 font-bold"></i>
                </div>
                <div class="mobile-card flex items-center justify-between !py-2 bg-white">
                    <label class="text-[10px] font-bold text-gray-400 uppercase">Sort by Class</label>
                    <select id="class-sort-select" onchange="loadStudentsList()" class="p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold outline-none">
                        <option value="all">All Classes</option>
                        <option value="10-A">Class 10-A</option>
                        <option value="9-B">Class 9-B</option>
                    </select>
                </div>
            </div>
            <div id="student-list" class="space-y-3">
                <div class="text-center py-10 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Loading Directory...</div>
            </div>
            <button onclick="adminRouter('dashboard')" class="w-full text-gray-400 font-bold py-6 text-xs text-center block">
                <i class="fas fa-arrow-left mr-1"></i> Back to Panel
            </button>
        `
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
        title: 'Student Profile',
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
                <!-- Configure New Window Form -->
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
                                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Opening Date</label>
                                <input type="date" id="exam-opening" class="w-full p-2 bg-gray-50 border border-gray-100 rounded-xl outline-none text-xs font-bold" value="${new Date().toISOString().split('T')[0]}">
                            </div>
                            <div>
                                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Closing Date</label>
                                <input type="date" id="exam-closing" class="w-full p-2 bg-gray-50 border border-gray-100 rounded-xl outline-none text-xs font-bold" value="${new Date(Date.now() + 14*24*60*60*1000).toISOString().split('T')[0]}">
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Full Marks (Default)</label>
                                <input type="number" id="exam-fm" class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm font-bold" value="100">
                            </div>
                            <div>
                                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Pass Marks (Default)</label>
                                <input type="number" id="exam-pm" class="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm font-bold" value="40">
                            </div>
                        </div>
                        <button onclick="saveExamWindow()" class="w-full bg-orange-600 hover:bg-orange-700 text-white font-black py-3.5 rounded-xl shadow-md active:scale-95 transition-all text-xs">
                            <i class="fas fa-save mr-1"></i> Save Exam Window
                        </button>
                    </div>
                </div>

                <!-- Existing Scheduled Windows -->
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
        render: () => `
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
                                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Date of Birth</label>
                                <input type="date" id="std-dob" class="w-full p-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs">
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Student Age</label>
                                <input type="number" id="std-age" class="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs" placeholder="15">
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
                                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Admitted Class-Section</label>
                                <input type="text" id="std-class" class="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs" placeholder="10-A">
                            </div>
                            <div>
                                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Admission Join Year</label>
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
        `
    },
    addTeacher: {
        title: 'Add Teacher',
        render: () => `
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
                                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Date of Birth</label>
                                <input type="date" id="tch-dob" class="w-full p-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-xs">
                            </div>
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

                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Government ID Type</label>
                                <select id="tch-id-type" class="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-xs">
                                    <option value="Citizenship Card">Citizenship Card</option>
                                    <option value="Passport">Passport</option>
                                    <option value="National ID">National ID Card</option>
                                    <option value="License">Driver License</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Government ID Number</label>
                                <input type="text" id="tch-id-num" class="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-xs" placeholder="e.g. 45-01-72-903">
                            </div>
                        </div>

                        <div>
                            <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1">Government ID Attachment</label>
                            <input type="file" id="tch-id-file" class="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200" accept="image/*">
                        </div>
                    </div>
                </div>

                <!-- Section 5: Assignments -->
                <div class="mobile-card">
                    <h3 class="text-xs font-black uppercase text-purple-600 mb-3 tracking-wider">5. Assigned Academic Workload</h3>
                    <div class="space-y-4">
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Assigned Classes</label>
                                <input type="text" id="tch-classes" class="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-xs" placeholder="10-A, 9-B">
                            </div>
                            <div>
                                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Primary Subjects</label>
                                <input type="text" id="tch-subjects" class="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-xs" placeholder="Math, Science">
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
        `
    },
    sendNotice: {
        title: 'Announcements',
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
    }
};

function adminRouter(viewName) {
    const view = adminViews[viewName] || adminViews.dashboard;
    
    renderHeader(view.title);
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

// Interactive helper: Copy current student address to permanent inputs
function syncStudentAddress(checkbox) {
    const fields = ['street', 'city', 'district'];
    fields.forEach(f => {
        const currVal = document.getElementById('std-curr-' + f).value;
        const permInput = document.getElementById('std-perm-' + f);
        if (checkbox.checked) {
            permInput.value = currVal;
        } else {
            permInput.value = '';
        }
    });
}

// Interactive helper: Copy current teacher address to permanent inputs
function syncTeacherAddress(checkbox) {
    const fields = ['street', 'city', 'district'];
    fields.forEach(f => {
        const currVal = document.getElementById('tch-curr-' + f).value;
        const permInput = document.getElementById('tch-perm-' + f);
        if (checkbox.checked) {
            permInput.value = currVal;
        } else {
            permInput.value = '';
        }
    });
}

async function loadStudentsList() {
    const list = document.getElementById('student-list');
    const sortVal = document.getElementById('class-sort-select')?.value || 'all';
    if (!list) return;
    try {
        const snap = await db.ref('school/students').once('value');
        const students = snap.val();
        if (!students) {
            list.innerHTML = `<div class="text-center py-10 text-gray-400">No students registered yet.</div>`;
            return;
        }
        let studentEntries = Object.entries(students);

        if (sortVal !== 'all') {
            let targetClass = sortVal;
            let targetSection = "General";
            if (sortVal.includes('-')) {
                const parts = sortVal.split('-');
                targetClass = parts[0];
                targetSection = parts[1];
            }
            studentEntries = studentEntries.filter(([id, data]) => {
                return String(data.class) === String(targetClass) && String(data.section) === String(targetSection);
            });
        }

        if (studentEntries.length === 0) {
            list.innerHTML = `<div class="text-center py-8 text-yellow-600 bg-yellow-50 rounded-xl text-xs p-4 border border-yellow-100">No students found matching Class ${sortVal}.</div>`;
            return;
        }

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
                <div onclick="viewStudentProfile('${studentId}')" class="mobile-card list-item flex items-center p-4 cursor-pointer active:bg-gray-50 bg-white">
                    <img src="${SafeResolvers.photo(data.photo)}" class="w-12 h-12 rounded-xl object-cover mr-4 border border-gray-100">
                    <div class="flex-grow">
                        <h4 class="font-bold text-gray-800">${fullName}</h4>
                        <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">${SafeResolvers.text(data.class)}-${SafeResolvers.text(data.section)} | ID: ${studentId}</p>
                    </div>
                    <i class="fas fa-chevron-right text-gray-200 text-xs"></i>
                </div>
            `;
        }).join('');
    } catch (e) {
        list.innerHTML = `<div class="text-center py-10 text-red-400">Error retrieving data: ${e.message}</div>`;
    }
}
    

async function loadTeachersList() {
    renderSharedTeacherDirectory('teacher-list-container', { showAdminActions: true });
}

async function viewStudentProfile(studentId) {
    adminRouter('studentDetails');
    const container = document.getElementById('student-profile-container');
    if (!container) return;
    try {
        const snap = await db.ref('school/students/' + studentId).once('value');
        const data = snap.val();

        let fname = '', mname = '', lname = '';
        if (data.name && typeof data.name === 'object') {
            fname = data.name.first || '';
            mname = data.name.middle || '';
            lname = data.name.last || '';
        } else {
            const parts = (data.name || '').split(' ');
            fname = parts[0] || '';
            lname = parts.slice(1).join(' ') || '';
        }

        const bloodGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-", "Unknown"];
        const bloodSelectHtml = bloodGroups.map(bg => `
            <option value="${bg}" ${data.bloodGroup === bg ? 'selected' : ''}>${bg}</option>
        `).join('');
        
        container.innerHTML = `
            <div class="flex flex-col items-center py-6">
                <div class="w-32 h-32 rounded-3xl overflow-hidden border-4 border-white shadow-xl mb-4 relative">
                    <img src="${SafeResolvers.photo(data.photo)}" class="w-full h-full object-cover">
                </div>
                <h2 class="text-2xl font-black text-gray-800">${fname} ${lname}</h2>
                <span class="text-xs text-blue-600 font-bold uppercase tracking-widest mt-1">Class ${SafeResolvers.text(data.class)}-${SafeResolvers.text(data.section)}</span>
                <p class="text-[10px] text-gray-400 mt-1 font-bold">Student ID: ${studentId}</p>
            </div>

            <!-- INTERACTIVE PROFILE FORM -->
            <div class="space-y-4">
                <div class="mobile-card space-y-3">
                    <h4 class="text-xs font-black uppercase text-blue-600 mb-2 tracking-wider">1. Academic & Personal Names</h4>
                    <div class="grid grid-cols-3 gap-2">
                        <div>
                            <label class="block text-[8px] font-bold text-gray-400 uppercase mb-0.5">First Name</label>
                            <input type="text" id="edit-std-fname" value="${fname}" class="w-full p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold outline-none">
                        </div>
                        <div>
                            <label class="block text-[8px] font-bold text-gray-400 uppercase mb-0.5">Middle Name</label>
                            <input type="text" id="edit-std-mname" value="${mname}" class="w-full p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold outline-none">
                        </div>
                        <div>
                            <label class="block text-[8px] font-bold text-gray-400 uppercase mb-0.5">Last Name</label>
                            <input type="text" id="edit-std-lname" value="${lname}" class="w-full p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold outline-none">
                        </div>
                    </div>
                </div>

                <div class="mobile-card grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1">Class Code</label>
                        <input type="text" id="edit-std-class" value="${SafeResolvers.text(data.class)}" class="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold outline-none">
                    </div>
                    <div>
                        <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1">Section</label>
                        <input type="text" id="edit-std-section" value="${SafeResolvers.text(data.section)}" class="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold outline-none">
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <div class="mobile-card">
                        <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1">Blood Group</label>
                        <select id="edit-std-blood" class="w-full p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold outline-none">
                            ${bloodSelectHtml}
                        </select>
                    </div>
                    <div class="mobile-card">
                        <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1">Roll Number</label>
                        <input type="text" id="edit-std-roll" value="${SafeResolvers.text(data.roll)}" class="w-full p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold outline-none">
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <div class="mobile-card">
                        <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1">Student Age</label>
                        <input type="number" id="edit-std-age" value="${data.age || ''}" class="w-full p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold outline-none">
                    </div>
                    <div class="mobile-card">
                        <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1">Join Year</label>
                        <input type="text" id="edit-std-joinYear" value="${data.joinYear || ''}" class="w-full p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold outline-none">
                    </div>
                </div>

                <div class="mobile-card space-y-3">
                    <h4 class="text-xs font-black uppercase text-blue-600 mb-1 tracking-wider">2. Contact & Family Info</h4>
                    <div>
                        <label class="block text-[8px] font-bold text-gray-400 uppercase mb-0.5">Father's Name</label>
                        <input type="text" id="edit-std-father" value="${SafeResolvers.text(data.fatherName || data.parentName)}" class="w-full p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold outline-none">
                    </div>
                    <div>
                        <label class="block text-[8px] font-bold text-gray-400 uppercase mb-0.5">Mother's Name</label>
                        <input type="text" id="edit-std-mother" value="${SafeResolvers.text(data.motherName)}" class="w-full p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold outline-none">
                    </div>
                    <div>
                        <label class="block text-[8px] font-bold text-gray-400 uppercase mb-0.5">Registered Mobiles</label>
                        <input type="text" id="edit-std-phone" value="${SafeResolvers.text(data.phone)}" class="w-full p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold outline-none">
                    </div>
                </div>

                <button onclick="updateStudentProfile('${studentId}')" class="w-full bg-blue-700 text-white font-black py-4 rounded-2xl shadow-md active:scale-95 transition-all text-sm mb-4">
                    <i class="fas fa-save mr-2"></i> Save Profile Changes
                </button>
            </div>

            <div class="mt-4 grid grid-cols-2 gap-3">
                <button onclick="alert('Attendance logs are summarized dynamically inside Parent App Dashboard!')" class="bg-gray-800 text-white p-4 rounded-xl text-xs font-bold shadow-lg active:scale-95 transition-all">
                    View Attendance
                </button>
                <button onclick="adminRouter('examsManagement')" class="bg-indigo-600 text-white p-4 rounded-xl text-xs font-bold shadow-lg active:scale-95 transition-all">
                    Manage Marks
                </button>
            </div>
            
            <button onclick="deleteStudent('${studentId}')" class="w-full mt-4 bg-red-50 text-red-600 p-4 rounded-xl text-xs font-black active:scale-95 transition-all">
                <i class="fas fa-trash-alt mr-2"></i> Delete Student Record
            </button>

            <button onclick="adminRouter('viewStudents')" class="w-full text-gray-400 font-bold py-6 text-xs text-center block">
                <i class="fas fa-arrow-left mr-1"></i> Back to Directory
            </button>
        `;
    } catch (e) {
        container.innerHTML = `<div class="text-center py-10 text-red-400">Error fetching student profile: ${e.message}</div>`;
    }
}

async function updateStudentProfile(studentId) {
    try {
        const first = document.getElementById('edit-std-fname').value.trim();
        const middle = document.getElementById('edit-std-mname').value.trim();
        const last = document.getElementById('edit-std-lname').value.trim();
        const stdClass = document.getElementById('edit-std-class').value.trim();
        const stdSection = document.getElementById('edit-std-section').value.trim();
        const blood = document.getElementById('edit-std-blood').value;
        const roll = document.getElementById('edit-std-roll').value.trim();
        const age = parseInt(document.getElementById('edit-std-age').value) || null;
        const joinYear = document.getElementById('edit-std-joinYear').value.trim();
        const father = document.getElementById('edit-std-father').value.trim();
        const mother = document.getElementById('edit-std-mother').value.trim();
        const phone = document.getElementById('edit-std-phone').value.trim();

        if (!first || !last || !stdClass || !stdSection || !phone) {
            alert("Names, Class, Section, and Registered Mobile are required fields!");
            return;
        }

        const updates = {
            "name/first": first,
            "name/middle": middle,
            "name/last": last,
            class: stdClass,
            section: stdSection,
            bloodGroup: blood,
            roll: roll,
            age: age,
            joinYear: joinYear,
            fatherName: father,
            motherName: mother,
            phone: phone
        };

        await db.ref('school/students/' + studentId).update(updates);
        alert("Student profile updated successfully!");
        viewStudentProfile(studentId);
    } catch (e) {
        console.error(e);
        alert("Failed to update student profile: " + e.message);
    }
}
    

async function viewTeacherProfileDetails(teacherId) {
    adminRouter('studentDetails'); // Recycle same subview container
    const container = document.getElementById('student-profile-container');
    if (!container) return;
    try {
        const snap = await db.ref('school/teachers/' + teacherId).once('value');
        const data = snap.val();

        let fullName = '';
        if (data.name && typeof data.name === 'object') {
            fullName = `${data.name.first || ''} ${data.name.middle || ''} ${data.name.last || ''}`.replace(/\s+/g, ' ').trim();
        } else {
            fullName = data.name || 'Faculty';
        }

        const statuses = ["Active", "On Duty", "In Class", "On Leave", "Off Duty", "Principal", "Vice Principal", "HOD"];
        const statusOptions = statuses.map(s => `<option value="${s}" ${data.statusLabel === s ? 'selected' : ''}>${s}</option>`).join('');

        const departments = [
            { key: "None", val: "None / Administrative" },
            { key: "DEPARTMENT_MATH", val: "Mathematics Dept." },
            { key: "DEPARTMENT_SCIENCE", val: "Science Dept." },
            { key: "DEPARTMENT_LANGUAGES", val: "Languages Dept." },
            { key: "DEPARTMENT_SOCIAL", val: "Social Studies Dept." },
            { key: "DEPARTMENT_COMPUTERS", val: "Computer Science Dept." }
        ];
        const deptOptions = departments.map(d => `<option value="${d.key}" ${data.department === d.key ? 'selected' : ''}>${d.val}</option>`).join('');

        const divisions = [
            { key: "None", val: "None / Specialist" },
            { key: "DIVISION_PRIMARY", val: "Primary Division (Grades 1-5)" },
            { key: "DIVISION_LOWER_SEC", val: "Lower Secondary Division (Grades 6-8)" },
            { key: "DIVISION_SECONDARY", val: "Secondary Division (Grades 9-10)" }
        ];
        const divOptions = divisions.map(d => `<option value="${d.key}" ${data.division === d.key ? 'selected' : ''}>${d.val}</option>`).join('');
        
        container.innerHTML = `
            <div class="flex flex-col items-center py-6">
                <div class="w-32 h-32 rounded-3xl overflow-hidden border-4 border-white shadow-xl mb-4">
                    <img src="${SafeResolvers.photo(data.photo)}" class="w-full h-full object-cover">
                </div>
                <h2 class="text-2xl font-black text-gray-800">${fullName}</h2>
                <span class="text-xs text-purple-600 font-bold uppercase tracking-widest mt-1">${SafeResolvers.text(data.statusLabel, 'Active')}</span>
                <p class="text-[10px] text-gray-400 mt-1 font-bold">Faculty ID: ${teacherId}</p>
            </div>

            <!-- INTERACTIVE TEACHER OPERATIONS FORM -->
            <div class="space-y-4">
                <div class="mobile-card space-y-3">
                    <h4 class="text-xs font-black uppercase text-purple-600 mb-2 tracking-wider">1. Hierarchy & Availability Status</h4>
                    
                    <div>
                        <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1">Professional Title</label>
                        <input type="text" id="edit-t-title" value="${SafeResolvers.text(data.professionalTitle, 'Faculty Member')}" class="w-full p-2.5 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold outline-none">
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1">Availability Status</label>
                            <select id="edit-t-status" class="w-full p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold outline-none">
                                ${statusOptions}
                            </select>
                        </div>
                        <div>
                            <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1">Joined Year</label>
                            <input type="text" id="edit-t-joinedYear" value="${data.joinedYear || ''}" class="w-full p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold outline-none">
                        </div>
                    </div>

                    <div class="flex items-center gap-2 pt-2">
                        <input type="checkbox" id="edit-t-available" ${data.isAvailable !== false ? 'checked' : ''} class="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500">
                        <label for="edit-t-available" class="text-xs font-bold text-gray-600">Currently Available for Schedule Blocks</label>
                    </div>
                </div>

                <div class="mobile-card space-y-3">
                    <h4 class="text-xs font-black uppercase text-purple-600 mb-2 tracking-wider">2. Academic Department & divisions</h4>
                    
                    <div>
                        <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1">Subject Department</label>
                        <select id="edit-t-dept" class="w-full p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold outline-none">
                            ${deptOptions}
                        </select>
                    </div>

                    <div>
                        <label class="block text-[9px] font-bold text-gray-400 uppercase mb-1">Grade-Level Division</label>
                        <select id="edit-t-div" class="w-full p-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold outline-none">
                            ${divOptions}
                        </select>
                    </div>

                    <div class="flex items-center gap-2 pt-2">
                        <input type="checkbox" id="edit-t-isHead" ${data.isDepartmentHead ? 'checked' : ''} class="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500">
                        <label for="edit-t-isHead" class="text-xs font-bold text-gray-600">Head of Department (HOD) Status</label>
                    </div>
                </div>

                <button onclick="updateTeacherProfile('${teacherId}')" class="w-full bg-purple-700 text-white font-black py-4 rounded-2xl shadow-md active:scale-95 transition-all text-sm mb-4">
                    <i class="fas fa-save mr-2"></i> Save Faculty Settings
                </button>
            </div>

            <div class="mobile-card space-y-4">
                <h4 class="text-xs font-black uppercase text-purple-600 mb-2 tracking-wider">Workload Assignments</h4>
                <div>
                    <p class="text-[9px] font-bold text-gray-400 uppercase">Assigned Classes</p>
                    <p class="font-bold text-gray-700 mt-1">${SafeResolvers.text(data.assignedClasses ? data.assignedClasses.join(', ') : 'N/A')}</p>
                </div>
                <div>
                    <p class="text-[9px] font-bold text-gray-400 uppercase">Primary Subjects</p>
                    <p class="font-bold text-gray-700 mt-1">${SafeResolvers.text(data.subjects ? data.subjects.join(', ') : 'N/A')}</p>
                </div>
            </div>

            <div class="mobile-card space-y-4">
                <h4 class="text-xs font-black uppercase text-purple-600 mb-2 tracking-wider">Qualifications & ID Info</h4>
                <div>
                    <p class="text-[9px] font-bold text-gray-400 uppercase">Highest Qualification</p>
                    <p class="font-bold text-gray-700 mt-1">${SafeResolvers.text(data.qualification)}</p>
                </div>
                <hr class="border-gray-50">
                <div>
                    <p class="text-[9px] font-bold text-gray-400 uppercase">${SafeResolvers.text(data.governmentIdType, 'Government ID')}</p>
                    <p class="font-bold text-gray-700 mt-1">${SafeResolvers.text(data.governmentIdNumber)}</p>
                </div>
            </div>

            <button onclick="deleteTeacher('${teacherId}')" class="w-full mt-4 bg-red-50 text-red-600 p-4 rounded-xl text-xs font-black active:scale-95 transition-all">
                <i class="fas fa-trash-alt mr-2"></i> Terminate Faculty Contract
            </button>

            <button onclick="adminRouter('viewTeachers')" class="w-full text-gray-400 font-bold py-6 text-xs text-center block">
                <i class="fas fa-arrow-left mr-1"></i> Back to Faculty List
            </button>
        `;
    } catch (e) {
        container.innerHTML = `<div class="text-center py-10 text-red-400">Error fetching teacher profile: ${e.message}</div>`;
    }
}

async function updateTeacherProfile(teacherId) {
    try {
        const title = document.getElementById('edit-t-title').value.trim();
        const status = document.getElementById('edit-t-status').value;
        const joinedYear = document.getElementById('edit-t-joinedYear').value.trim();
        const available = document.getElementById('edit-t-available').checked;
        const dept = document.getElementById('edit-t-dept').value;
        const div = document.getElementById('edit-t-div').value;
        const isHead = document.getElementById('edit-t-isHead').checked;

        if (!title) {
            alert("Professional Title cannot be empty!");
            return;
        }

        const updates = {
            professionalTitle: title,
            statusLabel: status,
            joinedYear: joinedYear,
            isAvailable: available,
            department: dept,
            division: div,
            isDepartmentHead: isHead
        };

        await db.ref('school/teachers/' + teacherId).update(updates);
        alert("Teacher faculty record updated successfully!");
        viewTeacherProfileDetails(teacherId);
    } catch (e) {
        console.error(e);
        alert("Failed to update teacher settings: " + e.message);
    }
}
    

async function saveStudent() {
    const fname = document.getElementById('std-fname').value.trim();
    const mname = document.getElementById('std-mname').value.trim();
    const lname = document.getElementById('std-lname').value.trim();
    const gender = document.getElementById('std-gender').value;
    const dob = document.getElementById('std-dob').value;
    const blood = document.getElementById('std-blood').value;
    const age = document.getElementById('std-age').value.trim();
    const joinYear = document.getElementById('std-join').value.trim() || new Date().getFullYear();
    const father = document.getElementById('std-father').value.trim();
    const mother = document.getElementById('std-mother').value.trim();
    const phoneInput = document.getElementById('std-phone').value.trim();
    const email = document.getElementById('std-email').value.trim();
    const className = document.getElementById('std-class').value.trim();

    // Address current
    const cStreet = document.getElementById('std-curr-street').value.trim();
    const cCity = document.getElementById('std-curr-city').value.trim();
    const cDistrict = document.getElementById('std-curr-district').value.trim();
    // Address permanent
    const pStreet = document.getElementById('std-perm-street').value.trim();
    const pCity = document.getElementById('std-perm-city').value.trim();
    const pDistrict = document.getElementById('std-perm-district').value.trim();

    // Documents inputs
    const photoFile = document.getElementById('std-photo-input').files[0];
    const birthFile = document.getElementById('std-birth-input').files[0];
    const transferFile = document.getElementById('std-transfer-input').files[0];

    if (!fname || !lname || !phoneInput || !className) {
        alert("Please fill all required fields (First & Last Name, Class, Phone)");
        return;
    }

    let finalClass = className;
    let section = "General";
    if (className.includes('-')) {
        const parts = className.split('-');
        finalClass = parts[0];
        section = parts[1];
    }

    const studentId = generateStudentID(joinYear);
    let photoUrl = "https://via.placeholder.com/150";
    let birthUrl = "N/A";
    let transferUrl = "N/A";

    try {
        if (photoFile) {
            photoUrl = await uploadFile(photoFile, `school/students/${studentId}/profile.jpg`);
        }
        if (birthFile) {
            birthUrl = await uploadFile(birthFile, `school/students/${studentId}/birth_certificate.jpg`);
        }
        if (transferFile) {
            transferUrl = await uploadFile(transferFile, `school/students/${studentId}/transfer_certificate.jpg`);
        }

        const studentData = {
            id: studentId,
            name: {
                first: fname,
                middle: mname,
                last: lname
            },
            gender,
            dob,
            age: age || 'N/A',
            bloodGroup: blood,
            class: finalClass,
            section: section,
            roll: '01',
            joinYear: joinYear,
            fatherName: father,
            motherName: mother,
            phone: phoneInput,
            parentEmail: email || 'N/A',
            address: {
                current: { street: cStreet, city: cCity, district: cDistrict },
                permanent: { street: pStreet, city: pCity, district: pDistrict }
            },
            photo: photoUrl,
            birthCertificate: birthUrl,
            transferCertificate: transferUrl,
            createdAt: firebase.database.ServerValue.TIMESTAMP
        };

        // Split multiple phone mapping log entries
        const phones = phoneInput.split(',').map(p => p.trim()).filter(p => p.length >= 10);

        // Save core student profile details
        await db.ref('school/students/' + studentId).set(studentData);

        // Save multiple login mapping accounts
        for (const phone of phones) {
            await db.ref('school/login_mappings/' + phone).set({
                studentId: studentId,
                role: 'parent'
            });
        }

        alert(`Student Registered Successfully!\nGenerated Student ID: ${studentId}`);
        adminRouter('dashboard');
    } catch (e) {
        console.error(e);
        alert("Error saving student record: " + e.message);
    }
}

async function saveTeacher() {
    const fname = document.getElementById('tch-fname').value.trim();
    const mname = document.getElementById('tch-mname').value.trim();
    const lname = document.getElementById('tch-lname').value.trim();
    const gender = document.getElementById('tch-gender').value;
    const dob = document.getElementById('tch-dob').value;
    const blood = document.getElementById('tch-blood').value;
    const phone = document.getElementById('tch-phone').value.trim();
    const phone2 = document.getElementById('tch-phone2').value.trim();
    const email = document.getElementById('tch-email').value.trim();

    // Address current
    const cStreet = document.getElementById('tch-curr-street').value.trim();
    const cCity = document.getElementById('tch-curr-city').value.trim();
    const cDistrict = document.getElementById('tch-curr-district').value.trim();
    // Address permanent
    const pStreet = document.getElementById('tch-perm-street').value.trim();
    const pCity = document.getElementById('tch-perm-city').value.trim();
    const pDistrict = document.getElementById('tch-perm-district').value.trim();

    // Professional
    const qualification = document.getElementById('tch-qualification').value.trim();
    const experience = document.getElementById('tch-experience').value.trim();
    const idType = document.getElementById('tch-id-type').value;
    const idNum = document.getElementById('tch-id-num').value.trim();

    // Assignments
    const subjects = document.getElementById('tch-subjects').value.trim();
    const classes = document.getElementById('tch-classes').value.trim();

    // Files
    const photoFile = document.getElementById('tch-photo-input').files[0];
    const idFile = document.getElementById('tch-id-file').files[0];

    if (!fname || !lname || !phone) {
        alert("First Name, Last Name, and Primary Phone are required.");
        return;
    }

    const randDigits = Math.floor(1000 + Math.random() * 9000);
    const teacherId = `UT-${new Date().getFullYear()}-${randDigits}`;

    let photoUrl = "https://images.unsplash.com/photo-1544717305-2782549b5136?w=150"; // Faculty placeholder portrait
    let idFileUrl = "N/A";

    try {
        if (photoFile) {
            photoUrl = await uploadFile(photoFile, `school/teachers/${teacherId}/profile.jpg`);
        }
        if (idFile) {
            idFileUrl = await uploadFile(idFile, `school/teachers/${teacherId}/gov_id.jpg`);
        }

        const teacherData = {
            id: teacherId,
            name: {
                first: fname,
                middle: mname,
                last: lname
            },
            gender,
            dob,
            bloodGroup: blood,
            phone,
            secondaryPhone: phone2 || 'N/A',
            email: email || 'N/A',
            address: {
                current: { street: cStreet, city: cCity, district: cDistrict },
                permanent: { street: pStreet, city: pCity, district: pDistrict }
            },
            qualification,
            experienceYears: experience || '0',
            governmentIdType: idType,
            governmentIdNumber: idNum || 'N/A',
            governmentIdPhoto: idFileUrl,
            subjects: subjects.split(',').map(s => s.trim()).filter(s => s.length > 0),
            assignedClasses: classes.split(',').map(c => c.trim()).filter(c => c.length > 0),
            photo: photoUrl,
            role: 'teacher',
            schedule: [
                { period: '1st', class: classes.split(',')[0] || '10-A', subject: subjects.split(',')[0] || 'Mathematics', time: '10:00 AM' }
            ],
            createdAt: firebase.database.ServerValue.TIMESTAMP
        };

        // 1. Save core teacher profile details
        await db.ref('school/teachers/' + teacherId).set(teacherData);

        // 2. Save login mapping lookup so the teacher can log in using their primary mobile number
        await db.ref('school/login_mappings/' + phone).set({
            studentId: teacherId, // Map to teacher ID profile
            role: 'teacher'
        });

        alert(`Teacher Onboarded successfully!\nAssigned Teacher ID: ${teacherId}`);
        adminRouter('dashboard');
    } catch (e) {
        console.error(e);
        alert("Failed to onboarding faculty member: " + e.message);
    }
}

async function deleteStudent(studentId) {
    if (!confirm("Are you sure you want to permanently delete this student record?")) return;
    try {
        const snap = await db.ref('school/students/' + studentId).once('value');
        if (snap.exists()) {
            const data = snap.val();
            if (data.phone) {
                const phones = data.phone.split(',').map(p => p.trim()).filter(p => p.length >= 10);
                for (const phone of phones) {
                    await db.ref('school/login_mappings/' + phone).remove();
                }
            }
        }
        await db.ref('school/students/' + studentId).remove();
        alert("Student record deleted successfully.");
        adminRouter('viewStudents');
    } catch (e) {
        alert("Failed to delete record: " + e.message);
    }
}

async function deleteTeacher(teacherId) {
    if (!confirm("Are you sure you want to permanently terminate this faculty contract and revoke all login accesses?")) return;
    try {
        const snap = await db.ref('school/teachers/' + teacherId).once('value');
        if (snap.exists()) {
            const data = snap.val();
            if (data.phone) {
                await db.ref('school/login_mappings/' + data.phone).remove();
            }
        }
        await db.ref('school/teachers/' + teacherId).remove();
        alert("Faculty record terminated successfully.");
        adminRouter('viewTeachers');
    } catch (e) {
        alert("Failed to delete record: " + e.message);
    }
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
                    <span class="text-[9px] text-gray-300 font-medium">${new Date(n.timestamp).toLocaleDateString()}</span>
                </div>
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
        alert("Please fill in title and message.");
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
        alert("Notice Broadcasted!");
        adminRouter('dashboard');
    } catch (e) {
        console.error(e);
        alert("Failed to send notice.");
    }
}

// ==========================================
// BUSINESS LOGIC: EXAMS TERM CONFIGURATIONS
// ==========================================

async function saveExamWindow() {
    const title = document.getElementById('exam-title').value.trim();
    const termId = document.getElementById('exam-term-id').value;
    const status = document.getElementById('exam-status').value;
    const openingDate = document.getElementById('exam-opening').value;
    const closingDate = document.getElementById('exam-closing').value;
    const defaultFullMarks = parseInt(document.getElementById('exam-fm').value) || 100;
    const defaultPassMarks = parseInt(document.getElementById('exam-pm').value) || 40;

    if (!title || !openingDate || !closingDate) {
        alert("Please enter title and dates.");
        return;
    }

    const examId = termId.replace(/\s+/g, '').toLowerCase() + '_' + new Date(openingDate).getFullYear();

    const data = {
        title,
        termId,
        status,
        openingDate,
        closingDate,
        defaultFullMarks,
        defaultPassMarks,
        createdAt: firebase.database.ServerValue.TIMESTAMP
    };

    try {
        await db.ref('school/exam_windows/' + examId).set(data);
        alert("Exam window successfully scheduled!");
        document.getElementById('exam-title').value = '';
        loadExamWindowsList();
    } catch (e) {
        console.error(e);
        alert("Failed to save window: " + e.message);
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
            const isClosed = item.status === 'Closed' || new Date(item.closingDate) < new Date();
            const badgeStyle = isClosed 
                ? "bg-red-100 text-red-700" 
                : "bg-green-100 text-green-700";

            return `
                <div class="mobile-card flex items-center justify-between p-4 bg-white border border-gray-100 shadow-sm relative overflow-hidden">
                    <div class="flex-grow">
                        <div class="flex items-center gap-2">
                            <h4 class="font-bold text-gray-800 text-sm">${item.title}</h4>
                            <span class="px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${badgeStyle}">${item.status}</span>
                        </div>
                        <p class="text-[9px] text-gray-400 font-bold uppercase mt-1 tracking-wider">Dates: ${item.openingDate} to ${item.closingDate}</p>
                        <p class="text-[9px] text-gray-400 font-bold uppercase">Scale: FM ${item.defaultFullMarks} | PM ${item.defaultPassMarks}</p>
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
            alert("No draft marks were found to publish for this exam.");
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
            alert("No drafts match this exam ID to publish.");
            return;
        }

                updates[`school/exam_windows/${examId}/status`] = 'Published';

        await db.ref().update(updates);
        alert(`Successfully published and archived ${countPublished} marks cards for this exam!`);
        loadExamWindowsList();
    } catch (e) {
        console.error(e);
        alert("Publishing failed: " + e.message);
    }
}

// ==========================================
// BUSINESS LOGIC: SUPPORT HELP DESK
// ==========================================

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
                    <span>${new Date(r.timestamp).toLocaleString()}</span>
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
                    <span>Raised: ${new Date(t.timestamp).toLocaleDateString()}</span>
                </div>
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
        alert("Please enter a response message!");
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
        alert("Reply successfully posted to parent discussion!");
        viewTicketDetails(ticketId);
    } catch (e) {
        console.error(e);
        alert("Failed to send reply: " + e.message);
    }
}

async function resolveTicket(ticketId) {
    if (!confirm("Are you sure you want to resolve and close this ticket?")) return;
    try {
        await db.ref(`school/tickets/${ticketId}/status`).set('Resolved');
        alert("Ticket marked as Resolved.");
        viewTicketDetails(ticketId);
    } catch (e) {
        console.error(e);
        alert("Failed to resolve ticket.");
    }
}

/**
 * Principal (Head) Configuration Logic
 */
function loadPrincipalData() {
    // This is now called via the router setTimeout to populate the config view
    db.ref('school/principal_profile').once('value', snap => {
        const p = snap.val();
        if (p) {
            const nameEl = document.getElementById('prin-name');
            const phone1El = document.getElementById('prin-phone-1');
            const phone2El = document.getElementById('prin-phone-2');
            const photoPrev = document.getElementById('prin-photo-preview');

            if (nameEl) nameEl.value = p.name || '';
            if (phone1El) phone1El.value = p.phonePrimary || '';
            if (phone2El) phone2El.value = p.phoneSecondary || '';
            if (photoPrev && p.photo) {
                photoPrev.innerHTML = `<img src="${p.photo}" class="w-full h-full object-cover">`;
            }
        }
    });
}

async function savePrincipalConfig() {
    const name = document.getElementById('prin-name').value.trim();
    const phone1 = document.getElementById('prin-phone-1').value.trim();
    const phone2 = document.getElementById('prin-phone-2').value.trim();
    const photoInput = document.getElementById('prin-photo-input');

    if (!name || !phone1) {
        showToast("Name and Primary Phone are required!", "error");
        return;
    }

    try {
        let photoUrl = '';
        if (photoInput.files && photoInput.files[0]) {
            photoUrl = await uploadFile(photoInput.files[0], `school/profiles/principal_${Date.now()}`);
        } else {
            const existing = (await db.ref('school/principal_profile/photo').once('value')).val();
            photoUrl = existing || '';
        }

        // 1. Update Profile Data
        await db.ref('school/principal_profile').set({
            name, phonePrimary: phone1, phoneSecondary: phone2, photo: photoUrl, updatedAt: Date.now()
        });

        // 2. Configure Login Node (Ensures only one principal can exist)
        await db.ref('school/head').remove(); // Clear old head logins
        await db.ref('school/head/' + phone1).set(true);
        if (phone2) await db.ref('school/head/' + phone2).set(true);

        showToast("Principal configuration updated successfully!", "success");
    } catch (e) {
        showToast("Update failed: " + e.message, "error");
    }
}
