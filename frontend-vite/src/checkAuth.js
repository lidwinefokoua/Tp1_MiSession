const API_URL = import.meta.env.VITE_API_URL;

/**
 * Vérifie si l'utilisateur est authentifié.
 * Si le JWT est invalide → retour à la page de connexion.
 * Si valide → rempli les infos du menu profil.
 */
export async function checkAuth() {
    console.log("🔒 Vérification de la session…");

    try {
        const res = await fetch(`${API_URL}/auth/me`, {
            credentials: "include"
        });

        if (!res.ok) {
            console.warn("⚠️ Session invalide → redirection vers index.html");
            window.location.href = "index.html";
            return;
        }

        const data = await res.json();
        console.log("✅ Session valide :", data);

        const user = data.user;

        // Mettre à jour les infos du profil dans l’UI
        document.getElementById("profileName").textContent =
            `${user.prenom} ${user.nom}`;

        document.getElementById("profileRole").textContent =
            `Rôle : ${user.role}`;

        document.getElementById("profilePhoto").src =
            `public/photos/${user.sub || user.id}.png`;

        return user;

    } catch (err) {
        console.error("❌ Erreur lors de la vérification de session :", err);
        window.location.href = "index.html";
    }
}
