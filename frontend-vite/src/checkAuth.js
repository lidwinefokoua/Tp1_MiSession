const API_URL = import.meta.env.VITE_API_URL;

/**
 * Vérifie si l'utilisateur est authentifié.
 * Si le JWT est invalide → retour à la page de connexion.
 * Si valide → rempli les infos du menu profil.
 */
export async function checkAuth() {
    console.log("🔒 Vérification de la session…");

    const res = await fetch(`${API_URL}/auth/me`, {
        credentials: "include"
    });

    if (!res.ok) {
        console.warn("⚠️ Session invalide → retour login.html");
        window.location.href = "index.html";
        return null;
    }

    const data = await res.json();
    console.log("✅ Session valide :", data);

    const user = data.user;

    // Sauvegarder localement pour les actions (ajout/modif)
    localStorage.setItem("user", JSON.stringify(user));

// UI du menu profil
    const profileName = document.getElementById("profileName");
    const profileRole = document.getElementById("profileRole");
    const profilePhoto = document.getElementById("profilePhoto");

    if (profileName) profileName.textContent = `${user.prenom} ${user.nom}`;
    if (profileRole) profileRole.textContent = `Rôle : ${user.role}`;


    return user;
}
