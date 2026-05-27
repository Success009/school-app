# Plan: Shared Faculty Directory & Operational Status Labels

This document details the design of a reusable, cross-portal **Faculty Directory Component** and the implementation of operational **Status Labels** for teachers (such as Active, On Leave, In Class, etc.).

---

## 1. Unified Operational Status Labels

Rather than representing rigid administrative hierarchy levels, the **Status Label** represents a teacher's real-time operational state or professional title. This label is displayed consistently across all app portals to inform parents, colleagues, and school administrators of a teacher's current availability.

### 1.1 Status Label Definitions
Every teacher profile in the database is assigned an operational status that dynamically updates:

| Status Label | Visual indicator | Description & Context |
| :--- | :--- | :--- |
| **Active / On Duty** | Green Badge | Currently on duty, available for class assignments or inquiries. |
| **In Class** | Amber Badge | Actively teaching a class period. Direct calls should be avoided. |
| **On Leave** | Red Badge | Temporarily away on approved leave. |
| **Off Duty** | Gray Badge | Outside of school operating hours. |
| **Principal / HOD** | Blue/Purple Badge | Holds leadership or administrative titles (HOD, VP, Principal). |

### 1.2 Updated Database Schema under `/school/teachers/{id}`
json
{
  "statusLabel": "Active",
  "professionalTitle": "Senior Mathematics Faculty",
  "isAvailable": true
}
---

## 2. Reusable Shared Component Architecture

To minimize redundant code, the **Faculty Directory** is implemented as a **Shared UI Component** inside `shared.js`. Any of the separate portals (Parent, Teacher, Admin, Principal) can import this component as a "Tab" or "View" by simply declaring a placeholder container and calling the shared renderer.

+-----------------------------------+
                  |             shared.js             |
                  |  renderSharedTeacherDirectory()   |
                  +-----------------+-----------------+
                                    |
         +--------------------------+--------------------------+
         |                          |                          |
+--------v--------+        +--------v--------+        +--------v--------+
|   parent.html   |        |  principal.html |        |    admin.html   |
| <div id="tab">  |        | <div id="tab">  |        | <div id="tab">  |
+-----------------+        +-----------------+        +-----------------+
### 2.1 Technical Implementation in `shared.js`
We define a global, customizable renderer function:
javascript
/**
 * Renders the shared Teacher Directory dynamically into any container.
 * @param {string} containerId - The DOM element ID to render into.
 * @param {Object} options - Customization toggles (e.g. canClickToCall, showAdminActions).
 */
async function renderSharedTeacherDirectory(containerId, options = { }) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `<div class="text-center py-10 text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Loading Faculty Directory...</div>`;

    try {
        const snap = await db.ref('school/teachers').once('value');
        const teachers = snap.val();
        
        if (!teachers) {
            container.innerHTML = `<div class="text-center py-10 text-gray-400">No faculty members found.</div>`;
            return;
        }

        container.innerHTML = Object.entries(teachers).map(([teacherId, t]) => {
            const fullName = t.name && typeof t.name === 'object' 
                ? `${t.name.first || ''} ${t.name.middle || ''} ${t.name.last || ''}`.replace(/\s+/g, ' ').trim()
                : t.name || 'Faculty Member';

            // Resolve color indicators based on status label
            let badgeClass = "bg-gray-100 text-gray-600";
            if (t.statusLabel === 'Active') badgeClass = "bg-green-100 text-green-700";
            else if (t.statusLabel === 'In Class') badgeClass = "bg-yellow-100 text-yellow-700";
            else if (t.statusLabel === 'On Leave') badgeClass = "bg-red-100 text-red-700";

            return `
                <div class="mobile-card flex items-center p-4 bg-white border border-gray-100 shadow-sm relative overflow-hidden">
                    <img src="${SafeResolvers.photo(t.photo)}" class="w-12 h-12 rounded-xl object-cover mr-4 border border-gray-100">
                    <div class="flex-grow">
                        <div class="flex items-center gap-2">
                            <h4 class="font-bold text-gray-800 text-sm">${fullName}</h4>
                            <span class="px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${badgeClass}">${SafeResolvers.text(t.statusLabel, 'Active')}</span>
                        </div>
                        <p class="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">${SafeResolvers.text(t.professionalTitle, 'Faculty')} | ${t.subjects ? t.subjects.join(', ') : 'N/A'}</p>
                    </div>
                    
                    <!-- Conditional click-to-call for Parents & Teachers -->
                    ${options.canClickToCall && t.phone ? `
                        <a href="tel:${t.phone}" class="w-9 h-9 bg-green-50 text-green-600 rounded-full flex items-center justify-center active:scale-90 transition-transform">
                            <i class="fas fa-phone-alt text-sm"></i>
                        </a>
                    ` : ''}

                    <!-- Conditional Admin edit controls -->
                    ${options.showAdminActions ? `
                        <button onclick="viewTeacherProfileDetails('${teacherId}')" class="w-9 h-9 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center active:scale-90 transition-transform">
                            <i class="fas fa-edit text-sm"></i>
                        </button>
                    ` : ''}
                </div>
            `;
        }).join('');

    } catch (e) {
        console.error(e);
        container.innerHTML = `<div class="text-center py-10 text-red-400">Failed to render Shared Directory: ${e.message}</div>`;
    }
}
---

## 3. Benefits of Shared Component Imports

1.  **Unified Source of Truth:** Any changes to the layout, visual styles, badge classifications, or card animations are edited once in `shared.js`, instantly updating the Parent, Admin, Principal, and Teacher portals.
2.  **Lighter Build Size:** Eliminates hundreds of lines of duplicate UI templates across `parent.js`, `admin.js`, and `principal.js`. This is critical for keeping Cordova/Capacitor app wrapping lightweight.
3.  **Encapsulation of Behaviors:** Options parameters enable role-specific actions (e.g., Parent view enables a telephone call trigger; Admin view overlays edit forms; Principal view provides contract overviews) while utilizing the exact same backend queries and card layouts.