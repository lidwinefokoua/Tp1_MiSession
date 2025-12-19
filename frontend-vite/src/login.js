const API_URL = import.meta.env.VITE_API_URL;

document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const msgBox = document.getElementById("loginMsg");

    console.log("Tentative de connexion…", { email, password });

    let response;
    try {
        response = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include", // important pour cookie
            body: JSON.stringify({ email, password })
        });
    } catch (err) {
        console.error("Erreur réseau :", err);
        msgBox.className = "alert alert-danger";
        msgBox.textContent = "Impossible de contacter le serveur.";
        msgBox.classList.remove("d-none");
        return;
    }

    let result;
    try {
        result = await response.json();
        console.log("JSON reçu :", result);
    } catch (err) {
        console.error(" Impossible de lire le JSON :", err);
        return;
    }

    if (!response.ok) {
        msgBox.className = "alert alert-danger";
        msgBox.innerText = result.message || "Identifiants invalides.";
        msgBox.classList.remove("d-none");
        return;
    }

    // Connexion OK
    localStorage.setItem("user", JSON.stringify(result.user));

    msgBox.className = "alert alert-success";
    msgBox.innerText = "Connexion réussie !";
    msgBox.classList.remove("d-none");

    setTimeout(() => {
        window.location.href = "acceuil.html";
    }, 500);
});
