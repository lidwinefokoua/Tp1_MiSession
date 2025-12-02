const API_URL = import.meta.env.VITE_API_URL;

document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const nom = document.getElementById("reg_nom").value;
    const prenom = document.getElementById("reg_prenom").value;
    const email = document.getElementById("reg_email").value;
    const password = document.getElementById("reg_password").value;

    const payload = { nom, prenom, email, password };

    const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    const msgBox = document.getElementById("regMsg");

    if (response.status === 201) {
        msgBox.className = "alert alert-success";
        msgBox.innerText = "Compte créé avec succès !";
        msgBox.classList.remove("d-none");

        setTimeout(() => {
            window.location.href = "index.html"; // page login
        }, 1000);
    } else {
        const err = await response.json();
        msgBox.className = "alert alert-danger";
        msgBox.innerText = err.message || "Erreur lors de la création du compte.";
        msgBox.classList.remove("d-none");
    }
});
