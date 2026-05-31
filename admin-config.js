// Admin Principal Settings Configuration Module

function loadPrincipalData() {
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

        await db.ref('school/principal_profile').set({
            name, phonePrimary: phone1, phoneSecondary: phone2, photo: photoUrl, updatedAt: Date.now()
        });

        await db.ref('school/head').remove(); // Clear old head logins
        await db.ref('school/head/' + phone1).set(true);
        if (phone2) await db.ref('school/head/' + phone2).set(true);

        showToast("Principal configuration updated successfully!", "success");
    } catch (e) {
        showToast("Update failed: " + e.message, "error");
    }
}
    