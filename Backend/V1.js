// v1.js
import express from "express";
import { writePdf } from "./writePdf.js";
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
    addInscription,
    deleteInscription,
    searchEtudiants,
    countSearchEtudiants, getInscriptionsByEtudiant
} from "./database.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();

// Appliquer middleware
router.use(baseUrl);

// =======================
// 🔹 ÉTUDIANTS
// =======================
router.get("/users", accepts("application/json ", "application/pdf"), async (req, res) => {
    try {
        let { page = 1, limit = 10, search = "", format } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);

        //  Vérification du paramètre "limit"
        if (isNaN(limit) || limit < 5) {
            limit = 5;
        } else if (limit > 100) {
            console.warn(`Requête avec limit=${limit} tronquée à 100.`);
            return res.status(400).json({
                status: 400,
                message: "La limite maximale d’étudiants par page est 100.",
                limit_utilisee: 100
            });
        }

        //  Vérification du paramètre "page"
        if (isNaN(page) || page < 1) {
            return res.status(400).json({
                status: 400,
                message: "Le numéro de page doit être supérieur ou égal à 1."
            });
        }
        if (search && search.trim() !== "") {
            const total = await countSearchEtudiants(search);
            const totalPages = Math.ceil(total / limit);
            const offset = (page - 1) * limit;

            const results = await searchEtudiants(search, limit, offset);

            return res.status(200).json({
                status: 200,
                message: "Résultats de la recherche.",
                data: results.map(e => ({
                    id: e.id,
                    prenom: e.prenom,
                    nom: e.nom,
                    courriel: e.courriel,
                    da: e.da
                })),
                meta: { page, limit, totalItems: total, totalPages },
                links: {
                    first_page: `${req.protocol}://${req.get("host")}/api/v1/users?page=1&limit=${limit}&search=${encodeURIComponent(search)}`,
                    prev_page: page > 1 ? `${req.protocol}://${req.get("host")}/api/v1/users?page=${page - 1}&limit=${limit}&search=${encodeURIComponent(search)}` : null,
                    next_page: page < totalPages ? `${req.protocol}://${req.get("host")}/api/v1/users?page=${page + 1}&limit=${limit}&search=${encodeURIComponent(search)}` : null,
                    last_page: `${req.protocol}://${req.get("host")}/api/v1/users?page=${totalPages}&limit=${limit}&search=${encodeURIComponent(search)}`
                }
            });
        }

        const allEtudiants = await getAllEtudiants(1000, 0);
        const total = await getEtudiantsCount();
        const totalPages = Math.ceil(total / limit);


        if (totalPages > 0 && page > totalPages) {
            return res.status(404).json({
                status: 404,
                message: `La page ${page} est hors limites. Il n’existe que ${totalPages} page(s).`
            });
        }

        const start = (page - 1) * limit;
        const pageEtudiants = allEtudiants.slice(start, start + limit);

        if (req.query.format === "pdf") {
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", `attachment; filename=etudiants_page_${page}.pdf`);
            return writePdf(
                pageEtudiants.map(e => ({
                    prenom: e.prenom,
                    nom: e.nom,
                    courriel: e.courriel
                })),
                res
            );
        }

        if (page > totalPages && totalPages > 0) {
            return res.status(404).json({ message: "Page hors limites" });
        }

        return res.status(200).json({
            status: 200,
            message: "Liste d’étudiants récupérée avec succès.",
            data: pageEtudiants.map(e => ({
                id: e.id,
                prenom: e.prenom,
                nom: e.nom,
                courriel: e.courriel,
                da: e.da,
                pdf: `${req.protocol}://${req.get("host")}/api/v1/users?format=pdf&page=${page}&limit=${limit}`
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
        console.error("Erreur /users :", err.stack || err);
        res.status(500).json({ message: "Erreur serveur", error: err.message });
    }
});


router.post("/users", accepts("application/json"), async (req, res) => {
    try {
        const { prenom, nom, email, da } = req.body;
        if (!prenom || !nom || !email || !da) {
            return res.status(400).json({ message: "Champs obligatoires manquants" });
        }

        const etudiant = await addEtudiant({
            prenom,
            nom,
            courriel: email,
            da
        });

        if (!etudiant) {
            return res.status(409).json({ message: "Conflit : l'étudiant existe déjà." });
        }

        res.status(201).json(etudiant);
    } catch (err) {
        console.error("Erreur ajout étudiant :", err);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

// === POST /api/v1/users/:id/photo ===
// Téléverse une photo PNG dans frontend-vite/public/photos/{id}.png

// Configuration de multer pour accepter uniquement les PNG
const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            // Chemin absolu vers ton dossier de photos dans le frontend
            const dest = path.resolve("../frontend-vite/public/photos");
            fs.mkdirSync(dest, { recursive: true }); // crée le dossier s'il n'existe pas
            cb(null, dest);
        },
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname).toLowerCase();
            if (ext !== ".png") {
                return cb(new Error("Format PNG uniquement"));
            }
            cb(null, `${req.params.id}.png`);
        }
    }),
    fileFilter: (req, file, cb) => {
        if (file.mimetype !== "image/png") {
            return cb(new Error("Seuls les fichiers PNG sont acceptés"));
        }
        cb(null, true);
    }
});

//Route d’upload de photo
router.post("/users/:id/photo", upload.single("photo"), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Aucune image reçue" });
        }

        res.json({
            message: "Photo téléversée avec succès",
            file: `${req.params.id}.png`
        });
    } catch (err) {
        console.error("Erreur upload photo :", err);
        res.status(500).json({ message: "Erreur lors du téléversement de la photo" });
    }
});

// === PUT /api/v1/users/:id ===
router.put("/users/:id", accepts("application/json"), async (req, res) => {
    try {
        const { id } = req.params;
        const { prenom, nom, email } = req.body;

        if (!prenom || !nom || !email) {
            return res.status(400).json({ message: "Champs manquants" });
        }

        const updated = await updateEtudiant({
            id,
            prenom,
            nom,
            courriel: email
        });

        if (!updated) {
            return res.status(404).json({ message: "Étudiant introuvable" });
        }

        return res.status(200).json({
            status: 200,
            message: "Étudiant mis à jour avec succès.",
            data: updated
        });
    } catch (err) {
        console.error("Erreur PUT /users/:id :", err);
        res.status(500).json({ message: "Erreur serveur" });
    }
});



// === GET /api/v1/users/:id ===
router.get("/users/:id", accepts("application/json"), async (req, res) => {
    try {
        const { id } = req.params;
        const e = await getEtudiantById(id);
        if (!e) return res.status(404).json({ message: "Étudiant introuvable" });

        return res.status(200).json({
            status: 200,
            message: "Étudiant trouvé.",
            data: {
                id: e.id,
                prenom: e.prenom,
                nom: e.nom,
                courriel: e.courriel,
                da: e.da
            }
        });
    } catch (err) {
        console.error("Erreur GET /users/:id :", err);
        return res.status(500).json({
            status: 500,
            message: "Erreur interne du serveur.",
            error: err.message
        });
    }
});


// === GET /api/v1/users/:id/courses ===
router.get("/users/:id/courses", accepts("application/json"), async (req, res) => {
    try {
        const { id } = req.params;
        const cours = await getCoursByEtudiant(id);

        if (!cours || cours.length === 0) {
            return res.status(200).json({
                status: 200,
                message: "Aucun cours inscrit pour cet étudiant.",
                data: []
            });
        }

        const filteredCours = cours.map(c => ({
            code: c.code,
            nom: c.nom_cours,
            enseignant: c.enseignant,
            date_inscription: c.date_inscription
        }));

        return res.status(200).json({
            status: 200,
            message: "Cours récupérés avec succès.",
            data: filteredCours
        });
    } catch (err) {
        console.error("Erreur /users/:id/courses :", err);
        res.status(500).json({ message: "Erreur serveur" });
    }
});


//Récupérer tous les cours
// === GET /api/v1/courses ===
// Retourne uniquement id et nom (pour le select d'inscription)
router.get("/courses", accepts("application/json"), async (req, res) => {
    try {
        const cours = await getAllCours();

        if (!cours || cours.length === 0) {
            return res.status(200).json({
                status: 200,
                message: "Aucun cours disponible.",
                data: []
            });
        }

        //On ne garde que les champs nécessaires pour la liste déroulante
        const filteredCours = cours.map(c => ({
            id: c.id,
            nom: c.nom,
            code: c.code
        }));

        return res.status(200).json({
            status: 200,
            message: "Liste des cours récupérée avec succès.",
            data: filteredCours
        });
    } catch (err) {
        console.error("Erreur /courses :", err);
        res.status(500).json({ message: "Erreur serveur" });
    }
});




// === POST /api/v1/inscriptions ===
router.post("/inscriptions", accepts("application/json"), async (req, res) => {
    try {
        const { etudiantId, coursId } = req.body;

        if (!etudiantId || !coursId) {
            return res.status(400).json({
                status: 400,
                message: "Les champs 'etudiantId' et 'coursId' sont requis."
            });
        }

        //Vérifie si l’inscription existe déjà
        const inscriptions = await getInscriptionsByEtudiant(etudiantId);
        const dejaInscrit = inscriptions.some(i => i.id === parseInt(coursId));

        if (dejaInscrit) {
            return res.status(409).json({
                status: 409,
                message: "L'étudiant est déjà inscrit à ce cours."
            });
        }

        //Ajout de l’inscription
        const inscription = await addInscription(etudiantId, coursId);
        if (!inscription) {
            return res.status(500).json({
                status: 500,
                message: "Erreur lors de l’ajout de l’inscription."
            });
        }

        //Succès
        return res.status(201).json({
            status: 201,
            message: "Inscription créée avec succès.",
            data: {
                id_inscription: inscription.id,
                etudiant_id: etudiantId,
                cours_id: coursId,
                date_inscription: inscription.date_inscription
            },
            links: {
                etudiant: `${req.protocol}://${req.get("host")}/api/v1/users/${etudiantId}`,
                cours: `${req.protocol}://${req.get("host")}/api/v1/courses/${coursId}`
            }
        });

    } catch (err) {
        console.error("Erreur POST /inscriptions :", err);
        return res.status(500).json({
            status: 500,
            message: "Erreur interne du serveur.",
            error: err.message
        });
    }
});


// === DELETE /api/v1/inscriptions ===
router.delete("/inscriptions/:etudiantId/:coursId", accepts("application/json"), async (req, res) => {
    const { etudiantId, coursId } = req.params;

    try {
        if (!etudiantId || !coursId) {
            return res.status(400).json({
                status: 400,
                message: "Les paramètres 'etudiantId' et 'coursId' sont requis."
            });
        }
        const deleted = await deleteInscription(etudiantId, coursId);

        if (!deleted) {
            return res.status(404).json({ message: "Inscription non trouvée" });
        }

        return res.status(200).json({
            status: 200,
            message: "Inscription supprimée avec succès.",
            data: {
                etudiant_id: etudiantId,
                cours_id: coursId
            }
        });
    } catch (err) {
        res.status(500).json({ message: "Erreur serveur" });
    }
});

// === DELETE /api/v1/users/:id ===
router.delete("/users/:id", accepts("application/json"), async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await deleteEtudiant(id);

        if (!deleted) {
            return res.status(404).json({ message: "Étudiant introuvable" });
        }

        return res.status(200).json({
            status: 200,
            message: "Étudiant supprimé avec succès.",
            data: { id }
        });
    } catch (err) {
        console.error("Erreur DELETE /users/:id :", err);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

export default router;