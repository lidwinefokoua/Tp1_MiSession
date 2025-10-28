// v1.js
import express from "express";

import {accepts, baseUrl} from "./route_middlewar.js";
import {
    getAllEtudiants,
    getEtudiantsCount,
    getEtudiantById,
    getAllCours,
    getCoursByEtudiant,
    addEtudiant,
    updateEtudiant,
    deleteEtudiant,
    addCours,
    updateCours,
    deleteCours,
    addInscription,
   deleteInscription,
    searchEtudiants,
    countSearchEtudiants
} from "./database.js";

const router = express.Router();

// Appliquer middleware
router.use(baseUrl);

// =======================
// 🔹 ÉTUDIANTS
// =======================
router.get("/users", accepts("application/json"), async (req, res) => {
    try {
        let { page = 1, limit = 50, search = "" } = req.query;
        page = parseInt(page);
        limit = Math.min(Math.max(parseInt(limit) || 50, 10), 100);
        const offset = (page - 1) * limit;

        let etudiants, total;

        if (search.trim() !== "") {
            etudiants = await searchEtudiants(search, limit, offset);
            total = await countSearchEtudiants(search);
        } else {
            etudiants = await getAllEtudiants(limit, offset);
            total = await getEtudiantsCount();
        }

        const totalPages = Math.ceil(total / limit);

        res.json({
            data: etudiants.map(e => ({
                id: e.id,
                first_name: e.prenom,
                last_name: e.nom,
                email: e.courriel,
                da: e.da
            })),
            meta: {
                page,
                limit,
                totalItems: total,
                totalPages
            },
            links: {
                first_page: `${req.protocol}://${req.get("host")}/api/v1/users?page=1&limit=${limit}`,
                prev_page: page > 1 ? `${req.protocol}://${req.get("host")}/api/v1/users?page=${page - 1}&limit=${limit}` : null,
                next_page: page < totalPages ? `${req.protocol}://${req.get("host")}/api/v1/users?page=${page + 1}&limit=${limit}` : null,
                last_page: `${req.protocol}://${req.get("host")}/api/v1/users?page=${totalPages}&limit=${limit}`
            }
        });
    } catch (err) {
        console.error("Erreur /users :", err);
        res.status(500).json({message: "Erreur serveur"});
    }

});


// === GET /api/v1/users/:id ===
router.get("/users/:id", accepts("application/json"), async (req, res) => {
    try {
        const { id } = req.params;
        const e = await getEtudiantById(id);
        if (!e) return res.status(404).json({ message: "Étudiant introuvable" });

        res.json({
            id: e.id,
            first_name: e.prenom,
            last_name: e.nom,
            email: e.courriel,
            da: e.da
        });
    } catch (err) {
        console.error("Erreur /users/:id :", err);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

// === GET /api/v1/users/:id/courses ===
router.get("/users/:id/courses", accepts("application/json"), async (req, res) => {
    try {
        const { id } = req.params;
        const cours = await getCoursByEtudiant(id);
        res.json(
            cours.map(c => ({
                id: c.id,
                code: c.code,
                nom: c.nom_cours,
                duree: c.duree,
                enseignant: c.enseignant,
                date_inscription: c.date_inscription
            }))
        );
    } catch (err) {
        console.error("Erreur /users/:id/courses :", err);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

// Récupérer tous les cours
router.get("/courses", accepts("application/json"), async (req, res) => {
    try {
        const cours = await getAllCours();
        res.json(cours);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

// === POST /api/v1/courses ===
router.post("/courses", accepts("application/json"), async (req, res) => {
    const { code, nom } = req.body;

    if (!code || !nom) {
        return res.status(400).json({ message: "Code et nom du cours requis" });
    }

    try {
        const c = await addCours({ code, nom });
        res.status(201).json(c);
    } catch (err) {
        console.error("Erreur ajout cours:", err);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

// === PUT /api/v1/courses/:id ===
router.put("/courses/:id", accepts("application/json"), async (req, res) => {
    console.log("PUT /courses/:id", req.params, req.body);
    const { id } = req.params;
    const { code, nom } = req.body;

    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
        return res.status(400).json({ message: "ID invalide" });
    }

    try {
        const updated = await updateCours({ id: parsedId, code, nom });
        if (!updated)
            return res.status(404).json({ message: "Cours introuvable ou non modifié" });
        res.json(updated);
    } catch (err) {
        console.error("Erreur update cours:", err);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

// === DELETE /api/v1/courses/:id ===
router.delete("/courses/:id", accepts("application/json"), async (req, res) => {
    const { id } = req.params;
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
        return res.status(400).json({ message: "ID invalide" });
    }

    try {
        const success = await deleteCours(parsedId);
        if (success) res.json({ message: "Cours supprimé" });
        else res.status(404).json({ message: "Cours introuvable" });
    } catch (err) {
        console.error("Erreur suppression cours:", err);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

// === POST /api/v1/inscriptions ===
router.post("/inscriptions", accepts("application/json"), async (req, res) => {
    const { etudiantId, coursId } = req.body;
    if (!etudiantId || !coursId) {
        return res.status(400).json({ message: "Étudiant et cours requis" });
    }

    try {
        const inscription = await addInscription(etudiantId, coursId);
        if (!inscription) return res.status(500).json({ message: "Erreur ajout inscription" });
        res.status(201).json(inscription);
    } catch (err) {
        console.error("Erreur ajout inscription:", err);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

router.delete("/inscriptions/:etudiantId/:coursId", accepts("application/json"), async (req, res) => {
    const { etudiantId, coursId } = req.params;

    try {
        const deleted = await deleteInscription(etudiantId, coursId);

        if (!deleted) {
            return res.status(404).json({ message: "Inscription non trouvée" });
        }

        res.json({ message: "Inscription supprimée" });
    } catch (err) {
        res.status(500).json({ message: "Erreur serveur" });
    }
});


export default router;