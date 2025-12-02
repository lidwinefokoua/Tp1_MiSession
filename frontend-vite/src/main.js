//CONFIGURATION GLOBALE
const API_BASE = import.meta.env.VITE_API_URL;
const API_URL = `${API_BASE}/api/v2`;

let currentPage = 1;
let pageSize = 50;
let currentEtudiantId = null;

window.addEventListener("DOMContentLoaded", async () => {
    const user = await checkAuth();
    if (!user) return;

    appliquerRestrictionsSelonRole(user.role);

    await loadEtudiants();
    await chargerCoursInscription();
});

// --- FIX 1 : checkAuth doit RETOURNER le user ---
async function checkAuth() {
    console.log("🔒 Vérification de la session…");

    const res = await fetch(`${API_BASE}/auth/me`, {
        credentials: "include"
    });

    if (!res.ok) {
        console.warn("⚠️ Session invalide → retour login.html");
        window.location.href = "index.html";
        return null;
    }

    const data = await res.json();
    const user = data.user;

    // Affichage profil
    document.getElementById("profileName").textContent =
        user.nom && user.prenom
            ? `${user.prenom} ${user.nom}`
            : `Utilisateur #${user.sub}`;

    document.getElementById("profileRole").textContent =
        `Rôle : ${user.role}`;

    document.getElementById("profilePhoto").src = "public/photos/profile.png";


    return user;
}


// window.onload = async () => {
//     await checkAuth();
//     await loadEtudiants();
//     await chargerCoursInscription();
// };


//VARIABLES ET ÉTATS GLOBAUX

const btnAjouter = document.getElementById("btnAjouter");
const btnModifier = document.getElementById("btnModifier");
const btnSupprimer = document.getElementById("btnSupprimer");
const photoEtudiant = document.getElementById("photoEtudiant");

const inputFile = document.createElement("input");
inputFile.type = "file";
inputFile.accept = "image/png";

let modeAjout = false;
let modeEdition = false;
let selectedFile = null;

// Modaux Bootstrap
const modalConfirm = new bootstrap.Modal(document.getElementById("confirmSaveModal"));
const confirmSaveBtn = document.getElementById("confirmSaveBtn");
const cancelSaveBtn = document.getElementById("cancelSaveBtn");

const modalDelete = new bootstrap.Modal(document.getElementById("confirmDeleteModal"));
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");

//SECTION ÉTUDIANTS — Liste et Pagination

async function loadEtudiants(url = `${API_URL}/users?page=${currentPage}&limit=${pageSize}`) {
    const res = await fetch(url, {
        headers: { Accept: "application/json" },
        credentials: "include",
    });

    if (res.status === 401) {
        console.warn("⚠️ 401 sur /users → retour login");
        window.location.href = "index.html";
        return;
    }

    const data = await res.json();

    const tbody = document.getElementById("tableEtudiants");
    tbody.innerHTML = "";

    data.data.forEach(user => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${user.nom}</td>
            <td>${user.prenom}</td>
            <td>${user.courriel}</td>
        `;
        tr.addEventListener("click", () => afficherDetailsEtudiant(user.id));
        tbody.appendChild(tr);
    });

    document.getElementById("firstBtn").dataset.url = data.links.first_page || "";
    document.getElementById("prevBtn").dataset.url = data.links.prev_page || "";
    document.getElementById("nextBtn").dataset.url = data.links.next_page || "";
    document.getElementById("lastBtn").dataset.url = data.links.last_page || "";
}

//FORMULAIRE — Gestion des champs

function resetForm() {
    document.getElementById("prenom").value = "";
    document.getElementById("nom").value = "";
    document.getElementById("email").value = "";
    document.getElementById("DA").value = "";
}

function toggleForm(disabled = true) {
    document.getElementById("prenom").disabled = disabled;
    document.getElementById("nom").disabled = disabled;
    document.getElementById("email").disabled = disabled;
    document.getElementById("DA").disabled = disabled;
}


//GESTION DE LA PHOTO

photoEtudiant.addEventListener("click", () => {
    if (modeAjout || modeEdition) inputFile.click();
});

inputFile.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file && file.type === "image/png") {
        selectedFile = file;
        const reader = new FileReader();
        reader.onload = (ev) => (photoEtudiant.src = ev.target.result);
        reader.readAsDataURL(file);
    } else {
        alert("Veuillez choisir un fichier PNG uniquement.");
        selectedFile = null;
    }
});


// AJOUT D’ÉTUDIANT

btnAjouter.addEventListener("click", async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user.role === "normal") return;

    if (!modeAjout) activerModeAjout();
    else await enregistrerNouvelEtudiant();
});

function activerModeAjout() {
    modeAjout = true;
    btnAjouter.textContent = "Enregistrer";
    btnModifier.textContent = "Annuler";
    resetForm();
    toggleForm(false);
    document.getElementById("DA").disabled = false;

    photoEtudiant.src = "photos/upload.png";
    photoEtudiant.style.cursor = "pointer";
    photoEtudiant.title = "Cliquez pour choisir une photo (.png)";
}

async function enregistrerNouvelEtudiant() {
    try {
        const prenom = document.getElementById("prenom").value.trim();
        const nom = document.getElementById("nom").value.trim();
        const email = document.getElementById("email").value.trim();
        const da = document.getElementById("DA").value.trim();

        if (!prenom || !nom || !email || !da) return alert("Veuillez remplir tous les champs.");

        // Étape 1 : ajout BD
        const res = await fetch(`${API_URL}/users`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ prenom, nom, email, da })
        });
        if (!res.ok) throw new Error("Erreur ajout étudiant");

        const newEtudiant = await res.json();

        // Étape 2 : upload photo
        if (selectedFile) {
            const formData = new FormData();
            formData.append("photo", selectedFile);
            const uploadRes = await fetch(`${API_URL}/users/${newEtudiant.id}/photo`, {method: "POST", body: formData});
            if (!uploadRes.ok) throw new Error("Erreur upload photo");
        }

        alert("Étudiant ajouté avec succès !");
        desactiverModeAjout();
        await loadEtudiants();
    } catch (err) {
        console.error("Erreur ajout étudiant:", err);
        alert("Erreur lors de l’enregistrement de l’étudiant.");
    }
}

function desactiverModeAjout() {
    modeAjout = false;
    btnAjouter.textContent = "Ajouter";
    btnModifier.textContent = "Modifier";
    toggleForm(true);
    selectedFile = null;
    photoEtudiant.src = "photos/0.png";
    photoEtudiant.style.cursor = "default";
    photoEtudiant.title = "";
}


// MODIFICATION D’ÉTUDIANT

btnModifier.addEventListener("click", async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user.role === "normal") return;

    if (modeAjout) return desactiverModeAjout();
    if (!currentEtudiantId) return alert("Veuillez d’abord sélectionner un étudiant.");

    if (!modeEdition) activerModeEdition();
    else modalConfirm.show();
});

function activerModeEdition() {
    modeEdition = true;
    btnModifier.textContent = "Enregistrer";
    btnAjouter.textContent = "Annuler";
    toggleForm(false);
    document.getElementById("DA").disabled = true;
    photoEtudiant.style.cursor = "pointer";
    photoEtudiant.title = "Cliquez pour changer la photo";
}

function desactiverModeEdition() {
    modeEdition = false;
    btnModifier.textContent = "Modifier";
    btnAjouter.textContent = "Ajouter";
    toggleForm(true);
    photoEtudiant.style.cursor = "default";
    photoEtudiant.title = "";
}

// Modal de confirmation
confirmSaveBtn.addEventListener("click", async () => {
    modalConfirm.hide();
    setTimeout(() => document.activeElement.blur(), 100);
    await enregistrerModificationEtudiant();
});

cancelSaveBtn.addEventListener("click", () => {
    desactiverModeEdition();
    if (currentEtudiantId) afficherDetailsEtudiant(currentEtudiantId);
});

async function enregistrerModificationEtudiant() {
    try {
        const prenom = document.getElementById("prenom").value.trim();
        const nom = document.getElementById("nom").value.trim();
        const email = document.getElementById("email").value.trim();
        if (!prenom || !nom || !email) return alert("Veuillez remplir tous les champs.");

        const res = await fetch(`${API_URL}/users/${currentEtudiantId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ prenom, nom, email })
        });

        if (!res.ok) throw new Error("Erreur modification");
        const updated = await res.json();

        alert("Étudiant modifié !");
        await afficherDetailsEtudiant(updated.id);
        await loadEtudiants();
        desactiverModeEdition();
    } catch (err) {
        console.error("Erreur modification étudiant :", err);
        alert("Erreur lors de la sauvegarde.");
    }
}

//SUPPRESSION D’ÉTUDIANT

btnSupprimer.addEventListener("click", () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user.role === "normal") return;

    if (!currentEtudiantId) return alert("Veuillez d’abord sélectionner un étudiant à supprimer.");
    modalDelete.show();
});

confirmDeleteBtn.addEventListener("click", async () => {
    modalDelete.hide();
    setTimeout(() => document.activeElement.blur(), 100);

    try {
        const res = await fetch(`${API_URL}/users/${currentEtudiantId}`, {method: "DELETE"});
        if (!res.ok) throw new Error("Erreur suppression étudiant");

        alert("Étudiant supprimé !");
        resetForm();
        toggleForm(true);
        photoEtudiant.src = "photos/0.png";
        currentEtudiantId = null;
        await loadEtudiants();
    } catch (err) {
        console.error("Erreur suppression étudiant :", err);
        alert("Erreur lors de la suppression.");
    }
});

cancelDeleteBtn.addEventListener("click", () => modalDelete.hide());


//RECHERCHE, PAGINATION, NOMBRE PAR PAGE

["firstBtn", "prevBtn", "nextBtn", "lastBtn"].forEach(id => {
    document.getElementById(id).addEventListener("click", e => {
        const url = e.target.dataset.url;
        if (!url) return;

        const params = new URL(url).searchParams;
        currentPage = parseInt(params.get("page")) || 1;

        loadEtudiants(url);
    });
});

document.getElementById("btnSearch").addEventListener("click", () => {
    const query = document.getElementById("searchEtudiant").value.trim();
    const url = `${API_URL}/users?page=1&limit=${pageSize}&search=${encodeURIComponent(query)}`;
    loadEtudiants(url);
});

document.getElementById("btnReset").addEventListener("click", () => {
    document.getElementById("searchEtudiant").value = "";
    loadEtudiants(`${API_URL}/users?page=1&limit=${pageSize}`);
});

document.getElementById("searchEtudiant").addEventListener("keypress", e => {
    if (e.key === "Enter") {
        e.preventDefault();
        document.getElementById("btnSearch").click();
    }
});

document.getElementById("nombre").addEventListener("change", e => {
    pageSize = parseInt(e.target.value);
    currentPage = 1; // on revient à page 1
    loadEtudiants(`${API_URL}/users?page=1&limit=${pageSize}`);
});


//AFFICHAGE DÉTAILS + COURS ÉTUDIANT

async function afficherDetailsEtudiant(id) {
    try {
        const res = await fetch(`${API_URL}/users/${id}`, {
            headers: { Accept: "application/json" },
            credentials: "include",
        });

        if (!res.ok) throw new Error("Étudiant introuvable");

        const response = await res.json();
        const e = response.data;
        currentEtudiantId = id;

        document.getElementById("prenom").value = e.prenom || "";
        document.getElementById("nom").value = e.nom || "";
        document.getElementById("email").value = e.courriel || "";
        document.getElementById("DA").value = e.da || "";

        const photo = document.getElementById("photoEtudiant");
        photo.src = `photos/${id}.png`;
        photo.onerror = () => {
            photo.src = "photos/0.png";
        };

        await afficherCoursEtudiant(id);

        const selectEtudiant = document.getElementById("selectEtudiant");
        selectEtudiant.innerHTML = "";
        const option = document.createElement("option");
        option.value = id;
        option.textContent = `${e.prenom} ${e.nom} (${e.da || ""})`;
        option.selected = true;
        selectEtudiant.appendChild(option);
    } catch (err) {
        console.error(err);
        showMessage("Impossible de charger les détails de l'étudiant.");
    }
}


//AFFICHAGE DES COURS D’UN ÉTUDIANT

async function afficherCoursEtudiant(etudiantId) {
    const tbody = document.getElementById("tableCours");
    tbody.innerHTML = `<tr><td colspan="4" class="text-muted">Chargement...</td></tr>`;

    try {

        const res = await fetch(`${API_URL}/users/${etudiantId}/courses`, {
            headers: { Accept: "application/json" },
            credentials: "include",
        });

        const response = await res.json();
        const cours = Array.isArray(response.data) ? response.data : [];
        tbody.innerHTML = "";

        if (cours.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-muted">Aucun cours inscrit.</td></tr>`;
            return;
        }

        cours.forEach(c => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${c.code}</td>
                <td>${c.nom}</td>
                <td>${c.enseignant || "—"}</td>
                <td>${c.date_inscription ? new Date(c.date_inscription).toLocaleDateString() : "—"}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error("Erreur afficherCoursEtudiant:", err);
        tbody.innerHTML = `<tr><td colspan="4" class="text-danger">Erreur lors du chargement.</td></tr>`;
    }
}


// FORMULAIRE D’INSCRIPTION — Recherche / Ajouter / Supprimer

async function rechercherEtudiants(term) {
    const res = await fetch(
        `${API_URL}/users?search=${encodeURIComponent(term)}`,
        {
            headers: { Accept: "application/json" },
            credentials: "include",
        }
    );

    const data = await res.json();
    return data.data;
}

const searchInput = document.getElementById("searchEtudiantInscription");
const selectEtudiant = document.getElementById("selectEtudiant");

searchInput.addEventListener("input", async () => {
    const term = searchInput.value.trim();
    if (term.length < 2) return;
    const results = await rechercherEtudiants(term);
    selectEtudiant.innerHTML = "";
    results.forEach(e => {
        const option = document.createElement("option");
        option.value = e.id;
        option.textContent = `${e.prenom} ${e.nom} (${e.da})`;
        selectEtudiant.appendChild(option);
    });
});

// Inscrire
document.querySelector("#formInscription .btn-success").addEventListener("click", async () => {
    const etudiantId = document.getElementById("selectEtudiant").value;
    const coursId = document.getElementById("selectCours").value;
    if (!etudiantId || !coursId) return showMessage("Sélectionnez un étudiant et un cours.");

    try {
        const res = await fetch(`${API_URL}/inscriptions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ etudiantId, coursId }),
        });

        const data = await res.json();

        if (!res.ok) return showMessage(data.message || "Erreur d’inscription.", "error");
        showMessage("Étudiant inscrit !");
        if (etudiantId == currentEtudiantId) await afficherCoursEtudiant(currentEtudiantId);
    } catch (err) {
        console.error(err);
        showMessage("Impossible d’inscrire l’étudiant.");
    }
});

// Désinscrire
document.querySelector("#formInscription .btn-danger").addEventListener("click", async () => {
    const etudiantId = document.getElementById("selectEtudiant").value;
    const coursId = document.getElementById("selectCours").value;
    if (!etudiantId || !coursId) return showMessage("Sélectionnez un étudiant et un cours.");
    if (!confirm("Voulez-vous désinscrire cet étudiant ?")) return;

    try {
        const res = await fetch(
            `${API_URL}/inscriptions/${etudiantId}/${coursId}`,
            {
                method: "DELETE",
                credentials: "include",
            }
        );

        if (!res.ok) throw new Error("Erreur désinscription");
        showMessage("Étudiant désinscrit !");
        if (etudiantId == currentEtudiantId) await afficherCoursEtudiant(currentEtudiantId);
    } catch (err) {
        console.error(err);
        showMessage("Impossible de désinscrire l’étudiant.");
    }
});

// CHARGEMENT DES COURS DISPONIBLES

async function chargerCoursInscription() {
    try {
        const res = await fetch(`${API_URL}/courses`, {
            headers: { Accept: "application/json" },
            credentials: "include",
        });

        const data = await res.json();
        const cours = Array.isArray(data) ? data : data.data;

        const selectCours = document.getElementById("selectCours");
        selectCours.innerHTML = '<option value="">-- Sélectionnez un cours --</option>';

        if (!cours || cours.length === 0) {
            const opt = document.createElement("option");
            opt.textContent = "Aucun cours disponible";
            opt.disabled = true;
            selectCours.appendChild(opt);
            return;
        }

        cours.forEach(c => {
            const option = document.createElement("option");
            option.value = c.id;
            option.textContent = `${c.code} - ${c.nom}`;
            selectCours.appendChild(option);
        });
    } catch (err) {
        console.error("Erreur chargerCoursInscription:", err);
    }
}

// UTILITAIRE : Message d’information

function showMessage(text, type = "success") {
    const box = document.getElementById("messageBox");
    box.textContent = text;
    box.className = `message-box ${type}`;
    box.style.display = "block";
    setTimeout(() => {
        box.style.display = "none";
    }, 3000);
}

//EXPORT PDF

document.getElementById("pdf").addEventListener("click", (e) => {
    e.preventDefault();
    const pdfUrl = `${API_URL}/users?format=pdf&page=${currentPage}&limit=${pageSize}`;
    window.open(pdfUrl, "_blank");
});


// Remplir les infos du profil au moment du clic

document.getElementById("btnLogout").addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "index.html";
});

function appliquerRestrictionsSelonRole(role) {
    console.log("🎭 Rôle détecté :", role);

    const isNormal = role === "normal";

    // Étudiants
    document.getElementById("btnAjouter").disabled = isNormal;
    document.getElementById("btnModifier").disabled = isNormal;
    document.getElementById("btnSupprimer").disabled = isNormal;

    document.getElementById("prenom").disabled = true;
    document.getElementById("nom").disabled = true;
    document.getElementById("email").disabled = true;
    document.getElementById("DA").disabled = true;

    // Inscription
    document.querySelector("#formInscription .btn-success").disabled = isNormal;
    document.querySelector("#formInscription .btn-danger").disabled = isNormal;
    document.getElementById("selectEtudiant").disabled = isNormal;
    document.getElementById("selectCours").disabled = isNormal;
    document.getElementById("searchEtudiantInscription").disabled = isNormal;

    //mots de passes

    const passwordModal = new bootstrap.Modal(document.getElementById("passwordModal"));

    document.getElementById("btnOpenPasswordModal").addEventListener("click", () => {
        document.getElementById("oldPassword").value = "";
        document.getElementById("newPassword").value = "";
        document.getElementById("pwMessage").classList.add("d-none");
        passwordModal.show();
    });

    document.getElementById("btnConfirmPassword").addEventListener("click", async () => {
        const oldPassword = document.getElementById("oldPassword").value.trim();
        const newPassword = document.getElementById("newPassword").value.trim();

        const msgBox = document.getElementById("pwMessage");

        if (!oldPassword || !newPassword) {
            msgBox.className = "alert alert-danger";
            msgBox.innerText = "Veuillez remplir les deux champs.";
            msgBox.classList.remove("d-none");
            return;
        }

        const res = await fetch(`${API_BASE}/auth/password`, {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ oldPassword, newPassword })
        });

        const data = await res.json();

        if (!res.ok) {
            msgBox.className = "alert alert-danger";
            msgBox.innerText = data.message || "Erreur.";
            msgBox.classList.remove("d-none");
            return;
        }

        msgBox.className = "alert alert-success";
        msgBox.innerText = "Mot de passe mis à jour !";
        msgBox.classList.remove("d-none");

        setTimeout(() => passwordModal.hide(), 1200);
    });

    // PDF
    // const pdfBtn = document.getElementById("pdf");
    // pdfBtn.classList.toggle("disabled", isNormal);
    // if (isNormal) pdfBtn.onclick = (e) => e.preventDefault();

    // Photo
    document.getElementById("photoEtudiant").style.pointerEvents = isNormal ? "none" : "auto";

    document.getElementById("profileRole").textContent =
        "Rôle : " + (isNormal ? "Normal" : "Éditeur");


    document.getElementById("btnLogout").addEventListener("click", async () => {
        const res = await fetch(`${API_BASE}/auth/logout`, {
            method: "DELETE",
            credentials: "include"
        });

        localStorage.removeItem("user");

        window.location.href = "index.html";
    });

}


