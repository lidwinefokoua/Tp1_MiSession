/*****************************************************
 * CONFIGURATION GLOBALE
 *****************************************************/
const API_URL = "http://localhost:3000/api/v1";

let currentPage = 1;
let pageSize = 50;
let currentEtudiantId = null; // ID de l'étudiant sélectionné

window.onload = () => {
    loadEtudiants();
    chargerCoursInscription();
};

/*****************************************************
 * SECTION ÉTUDIANTS
 *****************************************************/
async function loadEtudiants(url = `${API_URL}/users?page=${currentPage}&limit=${pageSize}`) {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
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

    // Pagination
    document.getElementById("firstBtn").dataset.url = data.links.first_page || "";
    document.getElementById("prevBtn").dataset.url = data.links.prev_page || "";
    document.getElementById("nextBtn").dataset.url = data.links.next_page || "";
    document.getElementById("lastBtn").dataset.url = data.links.last_page || "";
}

/*****************************************************
 * VARIABLES ET ÉTATS GLOBAUX
 *****************************************************/
const btnAjouter = document.getElementById("btnAjouter");
const btnModifier = document.getElementById("btnModifier");
const photoEtudiant = document.getElementById("photoEtudiant");

const inputFile = document.createElement("input");
inputFile.type = "file";
inputFile.accept = "image/png";

let modeAjout = false;
let modeEdition = false;
let selectedFile = null;

// Modal Bootstrap pour confirmation (modification)
const modalConfirm = new bootstrap.Modal(document.getElementById("confirmSaveModal"));
const confirmSaveBtn = document.getElementById("confirmSaveBtn");
const cancelSaveBtn = document.getElementById("cancelSaveBtn");


/*****************************************************
 * GESTION DES CHAMPS DU FORMULAIRE
 *****************************************************/
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


/*****************************************************
 * GESTION DE LA PHOTO
 *****************************************************/
photoEtudiant.addEventListener("click", () => {
    if (modeAjout || modeEdition) {
        inputFile.click();
    }
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


/*****************************************************
 * AJOUT D’ÉTUDIANT
 *****************************************************/
btnAjouter.addEventListener("click", async () => {
    if (!modeAjout) {
        // 🔹 Passe en mode AJOUT
        activerModeAjout();
    } else {
        // 🔹 Enregistre le nouvel étudiant
        await enregistrerNouvelEtudiant();
    }
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

        if (!prenom || !nom || !email || !da) {
            alert("Veuillez remplir tous les champs.");
            return;
        }

        // 🔹 Étape 1 : Ajouter étudiant dans la BD
        const res = await fetch(`${API_URL}/users`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prenom, nom, email, da })
        });

        if (!res.ok) throw new Error("Erreur lors de l’ajout de l’étudiant.");
        const newEtudiant = await res.json();

        // 🔹 Étape 2 : Upload de la photo
        if (selectedFile) {
            const formData = new FormData();
            formData.append("photo", selectedFile);

            const uploadRes = await fetch(`${API_URL}/users/${newEtudiant.id}/photo`, {
                method: "POST",
                body: formData
            });

            if (!uploadRes.ok) throw new Error("Erreur upload photo.");
        }

        alert("✅ Étudiant ajouté avec succès !");
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


/*****************************************************
 * MODIFICATION D’ÉTUDIANT AVEC MODAL
 *****************************************************/
btnModifier.addEventListener("click", async () => {
    if (modeAjout) {
        // 🔹 Si on est en ajout → annuler
        desactiverModeAjout();
        return;
    }

    if (!currentEtudiantId) {
        alert("Veuillez d’abord sélectionner un étudiant.");
        return;
    }

    if (!modeEdition) {
        activerModeEdition();
    } else {
        modalConfirm.show();
    }
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

// ✅ Confirmation du modal
confirmSaveBtn.addEventListener("click", async () => {
    modalConfirm.hide();
    setTimeout(() => document.activeElement.blur(), 100); // évite le warning aria
    await enregistrerModificationEtudiant();
});

// ❌ Annulation du modal
cancelSaveBtn.addEventListener("click", () => {
    desactiverModeEdition();
    if (currentEtudiantId) afficherDetailsEtudiant(currentEtudiantId);
});

async function enregistrerModificationEtudiant() {
    try {
        const prenom = document.getElementById("prenom").value.trim();
        const nom = document.getElementById("nom").value.trim();
        const email = document.getElementById("email").value.trim();

        if (!prenom || !nom || !email) {
            alert("Veuillez remplir tous les champs.");
            return;
        }

        const res = await fetch(`${API_URL}/users/${currentEtudiantId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prenom, nom, email })
        });

        if (!res.ok) throw new Error("Erreur lors de la modification.");
        const updatedEtudiant = await res.json();

        alert("✅ Étudiant modifié avec succès !");
        await afficherDetailsEtudiant(updatedEtudiant.id);
        await loadEtudiants();

        desactiverModeEdition();
    } catch (err) {
        console.error("Erreur modification étudiant :", err);
        alert("Erreur lors de la sauvegarde des modifications.");
    }
}


/*****************************************************
 * SUPPRESSION D’ÉTUDIANT AVEC MODAL
 *****************************************************/
const btnSupprimer = document.getElementById("btnSupprimer");
const modalDelete = new bootstrap.Modal(document.getElementById("confirmDeleteModal"));
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");

btnSupprimer.addEventListener("click", () => {
    if (!currentEtudiantId) {
        alert("Veuillez d’abord sélectionner un étudiant à supprimer.");
        return;
    }
    modalDelete.show();
});

// ✅ Si l’utilisateur confirme la suppression
confirmDeleteBtn.addEventListener("click", async () => {
    modalDelete.hide();
    setTimeout(() => document.activeElement.blur(), 100); // éviter le warning aria

    try {
        console.log("Suppression :", `${API_URL}/users/${currentEtudiantId}`);

        const res = await fetch(`${API_URL}/users/${currentEtudiantId}`, {
            method: "DELETE",
            headers: { Accept: "application/json" }
        });

        if (!res.ok) throw new Error("Erreur suppression étudiant");
        const result = await res.json();

        alert("🗑️ Étudiant supprimé avec succès !");
        resetForm();
        toggleForm(true);
        photoEtudiant.src = "photos/0.png";
        currentEtudiantId = null;
        await loadEtudiants();
    } catch (err) {
        console.error("Erreur suppression étudiant :", err);
        alert("Erreur lors de la suppression de l’étudiant.");
    }
});

// ❌ Si on clique sur “Annuler”
cancelDeleteBtn.addEventListener("click", () => {
    modalDelete.hide();
});

// 🔸 Pagination
["firstBtn", "prevBtn", "nextBtn", "lastBtn"].forEach(id => {
    document.getElementById(id).addEventListener("click", e => {
        const url = e.target.dataset.url;
        if (url) loadEtudiants(url);
    });
});

// 🔸 Recherche
document.getElementById("btnSearch").addEventListener("click", () => {
    const query = document.getElementById("searchEtudiant").value.trim();
    const url = `${API_URL}/users?page=1&limit=${pageSize}&search=${encodeURIComponent(query)}`;
    loadEtudiants(url);
});

document.getElementById("btnReset").addEventListener("click", () => {
    document.getElementById("searchEtudiant").value = "";
    loadEtudiants(`${API_URL}/users?page=1&limit=${pageSize}`);
});

// Entrée clavier
document.getElementById("searchEtudiant").addEventListener("keypress", e => {
    if (e.key === "Enter") {
        e.preventDefault();
        document.getElementById("btnSearch").click();
    }
});

// 🔸 Sélection du nombre d'éléments par page
document.getElementById("nombre").addEventListener("change", e => {
    let limit = parseInt(e.target.value);
    limit = Math.min(Math.max(limit, 10), 100);
    pageSize = limit;
    loadEtudiants(`${API_URL}/users?page=1&limit=${limit}`);
});

/*****************************************************
 * AFFICHAGE DÉTAILS + COURS D’UN ÉTUDIANT
 *****************************************************/
async function afficherDetailsEtudiant(id) {
    try {
        const res = await fetch(`${API_URL}/users/${id}`, { headers: { Accept: "application/json" } });
        if (!res.ok) throw new Error("Étudiant introuvable");

        const response = await res.json();
        const etudiant = response.data;
        currentEtudiantId = id;

        // ✅ Remplir les champs du formulaire Étudiant
        document.getElementById("prenom").value = etudiant.prenom || "";
        document.getElementById("nom").value = etudiant.nom || "";
        document.getElementById("email").value = etudiant.courriel || "";
        document.getElementById("DA").value = etudiant.da || "";

        // ✅ Afficher la photo
        const photo = document.getElementById("photoEtudiant");
        photo.src = `photos/${id}.png`;
        photo.onerror = () => { photo.src = "photos/0.png"; };

        // ✅ Charger les cours de l'étudiant
        await afficherCoursEtudiant(id);

        // ✅ Mettre à jour la section Inscriptions
        const selectEtudiant = document.getElementById("selectEtudiant");
        selectEtudiant.innerHTML = "";
        const option = document.createElement("option");
        option.value = id;
        option.textContent = `${etudiant.prenom} ${etudiant.nom} (${etudiant.da || ""})`;
        option.selected = true;
        selectEtudiant.appendChild(option);

    } catch (err) {
        console.error(err);
        showMessage("Impossible de charger les détails de l'étudiant.");
    }
}


/*****************************************************
 * AFFICHAGE DES COURS D’UN ÉTUDIANT
 *****************************************************/
async function afficherCoursEtudiant(etudiantId) {
    const tbody = document.getElementById("tableCours");
    tbody.innerHTML = `<tr><td colspan="4" class="text-muted">Chargement...</td></tr>`;

    try {
        const res = await fetch(`${API_URL}/users/${etudiantId}/courses`, {
            headers: { Accept: "application/json" }
        });
        if (!res.ok) throw new Error("Cours introuvables");

        const response = await res.json();

        // ✅ Récupère le vrai tableau de cours
        const cours = Array.isArray(response.data) ? response.data : [];

        tbody.innerHTML = "";

        if (cours.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-muted">Aucun cours inscrit pour cet étudiant.</td></tr>`;
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
        tbody.innerHTML = `<tr><td colspan="4" class="text-danger">Erreur lors du chargement des cours.</td></tr>`;
    }
}




/*****************************************************
 * FORMULAIRE INSCRIPTION : Recherche / Inscrire / Désinscrire
 *****************************************************/
async function rechercherEtudiants(term) {
    const res = await fetch(`${API_URL}/users?search=${encodeURIComponent(term)}`, {
        headers: { Accept: "application/json" }
    });
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

// 🔹 Inscrire un étudiant
document.querySelector("#formInscription .btn-success").addEventListener("click", async () => {
    const etudiantId = document.getElementById("selectEtudiant").value;
    const coursId = document.getElementById("selectCours").value;
    if (!etudiantId || !coursId) return showMessage("Sélectionnez un étudiant et un cours.");

    try {
        const res = await fetch(`${API_URL}/inscriptions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ etudiantId, coursId })
        });

        const data = await res.json();
        if (!res.ok) {
            console.warn("Erreur backend:", data);
            showMessage(data.message || "Erreur d’inscription.", "error");
            return;
        }
        showMessage("Étudiant inscrit !");
        if (etudiantId == currentEtudiantId) await afficherCoursEtudiant(currentEtudiantId);
    } catch (err) {
        console.error(err);
        showMessage("Impossible d’inscrire l’étudiant.");
    }
});

// 🔹 Désinscrire un étudiant
document.querySelector("#formInscription .btn-danger").addEventListener("click", async () => {
    const etudiantId = document.getElementById("selectEtudiant").value;
    const coursId = document.getElementById("selectCours").value;
    if (!etudiantId || !coursId) return showMessage("Sélectionnez un étudiant et un cours.");
    if (!confirm("Voulez-vous désinscrire cet étudiant ?")) return;

    try {
        const res = await fetch(`${API_URL}/inscriptions/${etudiantId}/${coursId}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ etudiantId, coursId })
        });
        if (!res.ok) throw new Error("Erreur de désinscription");

        showMessage("Étudiant désinscrit !");
        if (etudiantId == currentEtudiantId) await afficherCoursEtudiant(currentEtudiantId);
    } catch (err) {
        console.error(err);
        showMessage("Impossible de désinscrire l’étudiant.");
    }
});

/*****************************************************
 * CHARGEMENT DES COURS POUR LE FORMULAIRE D’INSCRIPTION
 *****************************************************/
async function chargerCoursInscription() {
    try {
        const res = await fetch(`${API_URL}/courses`, { headers: { Accept: "application/json" } });
        if (!res.ok) throw new Error("Erreur chargement cours");

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

function showMessage(text, type = "success") {
    const box = document.getElementById("messageBox");
    box.textContent = text;
    box.className = `message-box ${type}`;
    box.style.display = "block";

    // Disparition automatique après 4 secondes
    setTimeout(() => {
        box.style.display = "none";
    }, 3000);
}
