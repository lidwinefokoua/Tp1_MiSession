const API_URL = "http://localhost:3000/api/v1";

let currentPage = 1;
let pageSize = 50;

window.onload = () => {
    loadEtudiants();
    loadCours();
    loadInscriptions();
};

// ========================
// ETUDIANTS
// ========================
async function loadEtudiants(url = `${API_URL}/users?page=${currentPage}&limit=${pageSize}`) {
    const res = await fetch(url, {headers: {Accept: "application/json"}});
    const data = await res.json();

    const tbody = document.getElementById("tableEtudiants");
    tbody.innerHTML = "";

    data.data.forEach(user => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${user.last_name}</td>
            <td>${user.first_name}</td>
            <td>${user.email}</td>
            <td>${user.da || ""}</td>
            <td><button class="btn btn-outline-info btn-sm">👁</button></td>
        `;

        tr.querySelector("button").addEventListener("click", () => {
            afficherDetailsEtudiant(user.id);
        });

        tbody.appendChild(tr);
    });

    // Pagination dataset
    document.getElementById("firstBtn").dataset.url = data.links.first_page || "";
    document.getElementById("prevBtn").dataset.url = data.links.prev_page || "";
    document.getElementById("nextBtn").dataset.url = data.links.next_page || "";
    document.getElementById("lastBtn").dataset.url = data.links.last_page || "";
}

// --- Pagination events ---
["firstBtn", "prevBtn", "nextBtn", "lastBtn"].forEach(id => {
    document.getElementById(id).addEventListener("click", e => {
        const url = e.target.dataset.url;
        if (url) loadEtudiants(url);
    });
});

// --- Nombre d’éléments par page ---
document.getElementById("nombre").addEventListener("change", e => {
    let limit = parseInt(e.target.value);
    if (limit < 10) limit = 10;
    if (limit > 100) limit = 100;

    pageSize = limit;
    loadEtudiants(`${API_URL}/users?page=1&limit=${limit}`);
});


// --- Afficher détails étudiant ---
async function afficherDetailsEtudiant(id) {
    try {
        const res = await fetch(`${API_URL}/users/${id}`);
        if (!res.ok) throw new Error("Utilisateur introuvable");
        const etudiant = await res.json();

        // Remplir formulaire Étudiant
        document.getElementById("prenom").value = etudiant.first_name;
        document.getElementById("nom").value = etudiant.last_name;
        document.getElementById("email").value = etudiant.email;
        document.getElementById("DA").value = etudiant.da || "";

        // Afficher la photo selon l'id
        const photoEtudiant = document.getElementById("photoEtudiant");
        photoEtudiant.src = `photos/${id}.png`;
        photoEtudiant.onerror = () => { photoEtudiant.src = "photos/0.png"; };

        // Afficher les cours associés
        afficherCoursEtudiant(id);

        // Sélectionner cet étudiant dans le menu Inscriptions
        const selectEtudiant = document.getElementById("selectEtudiant");
        selectEtudiant.value = id;
    } catch (err) {
        console.error("Erreur lors du chargement des détails étudiant:", err);
    }
}

// --- Charger les cours de l’étudiant sélectionné ---
async function afficherCoursEtudiant(etudiantId) {
    try {
        const res = await fetch(`${API_URL}/users/${etudiantId}/courses`);
        const cours = await res.json();

        const tbody = document.getElementById("tableCours");
        tbody.innerHTML = "";

        cours.forEach(c => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${c.code}</td>
                <td>${c.nom}</td>
                <td><button class="btn btn-outline-danger btn-sm">🗑</button></td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error("Erreur lors du chargement des cours de l’étudiant:", err);
    }
}

// ========================
// COURS
// ========================
async function loadCours() {
    const res = await fetch(`${API_URL}/courses`);
    const cours = await res.json();

    const tbody = document.getElementById("tableCours");
    tbody.innerHTML = "";

    cours.forEach(c => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${c.code}</td>
            <td>${c.nom}</td>
            <td><button class="btn btn-outline-info btn-sm">👁</button></td>
        `;
        tbody.appendChild(tr);
    });

    // Mettre à jour la liste déroulante dans "Inscriptions"
    const selectCours = document.getElementById("selectCours");
    selectCours.innerHTML = "";
    cours.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c.id;
        opt.textContent = c.nom;
        selectCours.appendChild(opt);
    });
}

// ========================
// INSCRIPTIONS
// ========================
async function loadInscriptions() {
    const res = await fetch(`${API_URL}/inscriptions`);
    const data = await res.json();

    const tbody = document.getElementById("tableInscriptions");
    tbody.innerHTML = "";

    data.forEach(insc => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${insc.etudiant_nom}</td>
            <td>${insc.cours_nom}</td>
            <td>${insc.date}</td>
            <td><button class="btn btn-outline-danger btn-sm">❌</button></td>
        `;
        tbody.appendChild(tr);
    });

    // Mettre à jour la liste déroulante d'étudiants
    const resEtudiants = await fetch(`${API_URL}/users?page=1&limit=100`);
    const dataEtud = await resEtudiants.json();
    const selectEtudiant = document.getElementById("selectEtudiant");
    selectEtudiant.innerHTML = "";
    dataEtud.data.forEach(e => {
        const opt = document.createElement("option");
        opt.value = e.id;
        opt.textContent = `${e.first_name} ${e.last_name}`;
        selectEtudiant.appendChild(opt);
    });
}

