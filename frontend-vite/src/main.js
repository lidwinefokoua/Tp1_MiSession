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
            <td>${user.last_name}</td>
            <td>${user.first_name}</td>
            <td>${user.email}</td>
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

        const etudiant = await res.json();
        currentEtudiantId = id;

        // ✅ Remplir les champs du formulaire Étudiant
        document.getElementById("prenom").value = etudiant.first_name;
        document.getElementById("nom").value = etudiant.last_name;
        document.getElementById("email").value = etudiant.email;
        document.getElementById("DA").value = etudiant.da || "";

        // ✅ Afficher la photo
        const photo = document.getElementById("photoEtudiant");
        photo.src = `photos/${id}.png`;
        photo.onerror = () => { photo.src = "photos/0.png"; };

        // ✅ Charger les cours de l'étudiant
        afficherCoursEtudiant(id);

        // ✅ Mettre à jour la section Inscriptions
        const selectEtudiant = document.getElementById("selectEtudiant");
        selectEtudiant.innerHTML = "";
        const option = document.createElement("option");
        option.value = id;
        option.textContent = `${etudiant.first_name} ${etudiant.last_name} (${etudiant.da || ""})`;
        option.selected = true;
        selectEtudiant.appendChild(option);

    } catch (err) {
        console.error(err);
        alert("Impossible de charger les détails de l'étudiant.");
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

        const cours = await res.json();
        tbody.innerHTML = "";

        if (!cours || cours.length === 0) {
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
        option.textContent = `${e.first_name} ${e.last_name} (${e.da})`;
        selectEtudiant.appendChild(option);
    });
});

// 🔹 Inscrire un étudiant
document.querySelector("#formInscription .btn-success").addEventListener("click", async () => {
    const etudiantId = document.getElementById("selectEtudiant").value;
    const coursId = document.getElementById("selectCours").value;
    if (!etudiantId || !coursId) return alert("Sélectionnez un étudiant et un cours.");

    try {
        const res = await fetch(`${API_URL}/inscriptions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ etudiantId, coursId })
        });
        if (!res.ok) throw new Error("Erreur d’inscription");

        alert("Étudiant inscrit !");
        if (etudiantId == currentEtudiantId) await afficherCoursEtudiant(currentEtudiantId);
    } catch (err) {
        console.error(err);
        alert("Impossible d’inscrire l’étudiant.");
    }
});

// 🔹 Désinscrire un étudiant
document.querySelector("#formInscription .btn-danger").addEventListener("click", async () => {
    const etudiantId = document.getElementById("selectEtudiant").value;
    const coursId = document.getElementById("selectCours").value;
    if (!etudiantId || !coursId) return alert("Sélectionnez un étudiant et un cours.");
    if (!confirm("Voulez-vous désinscrire cet étudiant ?")) return;

    try {
        const res = await fetch(`${API_URL}/inscriptions`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ etudiantId, coursId })
        });
        if (!res.ok) throw new Error("Erreur de désinscription");

        alert("Étudiant désinscrit !");
        if (etudiantId == currentEtudiantId) await afficherCoursEtudiant(currentEtudiantId);
    } catch (err) {
        console.error(err);
        alert("Impossible de désinscrire l’étudiant.");
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
