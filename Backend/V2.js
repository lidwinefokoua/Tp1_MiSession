import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

import { writePdf } from "./writePdf.js";
import { accepts, baseUrl } from "./route_middlewar.js";
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
    countSearchEtudiants,
    getInscriptionsByEtudiant
} from "./database.js";
import {validateEtudiant, validateInscription} from "./validators/Validator.js";
import {authRequired, roleRequired} from "./auth/middlewar_auth.js";
import {
    createEtudiantSchema, createInscriptionSchema, deleteInscriptionParamsSchema,
    etudiantIdParamSchema, getCoursesQuerySchema,
    listEtudiantsSchema,
    updateEtudiantSchema
} from "./validators/etudiantsValidators.js";
import {validateBody, validateParams, validateQuery} from "./validators/validate.js";

const router = express.Router();
router.use(baseUrl);

// section etudiants

// GET /etudiants (liste + recherche + PDF)
router.get(
    "/etudiants",
    authRequired,
    roleRequired("normal", "editeur"),
    validateQuery(listEtudiantsSchema),
    accepts("application/json"),
    async (req, res) => {
        try {
            const { page, limit, search, format } = req.validated.query;

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
                    first_page: `${req.protocol}://${req.get("host")}/api/v2/etudiants?page=1&limit=${limit}&search=${encodeURIComponent(search)}`,
                    prev_page: page > 1 ? `${req.protocol}://${req.get("host")}/api/v2/etudiants?page=${page - 1}&limit=${limit}&search=${encodeURIComponent(search)}` : null,
                    next_page: page < totalPages ? `${req.protocol}://${req.get("host")}/api/v2/etudiants?page=${page + 1}&limit=${limit}&search=${encodeURIComponent(search)}` : null,
                    last_page: `${req.protocol}://${req.get("host")}/api/v2/etudiants?page=${totalPages}&limit=${limit}&search=${encodeURIComponent(search)}`
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

        // Export PDF
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

        return res.status(200).json({
            status: 200,
            message: "Liste d’étudiants récupérée avec succès.",
            data: pageEtudiants.map(e => ({
                href: `${req.protocol}://${req.get("host")}/api/v2/etudiants/${e.id}`,
                id: e.id,
                prenom: e.prenom,
                nom: e.nom,
                courriel: e.courriel,

            })),
            meta: { page, limit, totalItems: total, totalPages },
            links: {
                pdf: `${req.protocol}://${req.get("host")}/api/v2/etudiants?format=pdf&page=${page}&limit=${limit}`,
                first_page: `${req.protocol}://${req.get("host")}/api/v2/etudiants?page=1&limit=${limit}`,
                prev_page: page > 1 ? `${req.protocol}://${req.get("host")}/api/v2/etudiants?page=${page - 1}&limit=${limit}` : null,
                next_page: page < totalPages ? `${req.protocol}://${req.get("host")}/api/v2/etudiants?page=${page + 1}&limit=${limit}` : null,
                last_page: `${req.protocol}://${req.get("host")}/api/v2/etudiants?page=${totalPages}&limit=${limit}`
            }
        });
    } catch (err) {
        console.error("Erreur /etudiants :", err.stack || err);
        res.status(500).json({ message: "Erreur serveur", error: err.message });
    }
});

// POST /etudiants (ajouter un étudiant)
router.post(
    "/etudiants",
    authRequired,
    roleRequired("editeur"),
    accepts("application/json"),
    validateBody(createEtudiantSchema),
    async (req, res) => {
        try {
            const { prenom, nom, email, da } = req.validated.body;

        const etudiant = await addEtudiant({ prenom, nom, courriel: email, da });

        if (!etudiant)
            return res.status(409).json({ message: "Conflit : l'étudiant existe déjà." });

            return res.status(201).json({
                status: 201,
                message: "Étudiant créé avec succès.",
                data: {
                    id: etudiant.id,
                    prenom: etudiant.prenom,
                    nom: etudiant.nom,
                    courriel: etudiant.courriel,
                    da: etudiant.da
                }
        });

    } catch (err) {
        console.error("Erreur ajout étudiant :", err);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            const dest = path.resolve("../frontend-vite/public/photos");
            fs.mkdirSync(dest, { recursive: true });
            cb(null, dest);
        },
        filename: (req, file, cb) => {
            cb(null, `${req.params.id}.png`);
        }
    }),
    fileFilter: (req, file, cb) => {
        if (file.mimetype !== "image/png")
            return cb(new Error("PNG obligatoire"));
        cb(null, true);
    }
});

// POST /etudiants/:id/photo (upload photo)
router.post("/etudiants/:id/photo",authRequired, roleRequired( "editeur"), upload.single("photo"), (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "Aucune image reçue" });
        res.json({ message: "Photo téléversée avec succès", file: `${req.params.id}.png` });
    } catch (err) {
        console.error("Erreur upload photo :", err);
        res.status(500).json({ message: "Erreur lors du téléversement de la photo" });
    }
});

// PUT /etudiants/:id (modifier un étudiant)
router.put(
    "/etudiants/:id",
    authRequired,
    roleRequired("editeur"),
    accepts("application/json"),
    validateParams(etudiantIdParamSchema),
    validateBody(updateEtudiantSchema),
    async (req, res) => {
        try {
            const { id } = req.validated.params;
            const { prenom, nom, email } = req.validated.body;

        const updated = await updateEtudiant({ id, prenom, nom, courriel: email });
        if (!updated) return res.status(404).json({ message: "Étudiant introuvable" });

        res.status(200).json({
            status: 200,
            message: "Étudiant mis à jour avec succès.",
            data: updated
        });
    } catch (err) {
        console.error("Erreur PUT /etudiants/:id :", err);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

// GET /etudiants/:id (récupérer un étudiant)
router.get(
    "/etudiants/:id",
    accepts("application/json"),
    validateParams(etudiantIdParamSchema),
    async (req, res) => {
        try {
            const { id } = req.validated.params;
        const e = await getEtudiantById(id);
        if (!e) return res.status(404).json({ message: "Étudiant introuvable" });

        res.status(200).json({
            status: 200,
            message: "Étudiant trouvé.",
            data: {href: `${req.protocol}://${req.get("host")}/api/v2/etudiants/${id}`,
                prenom: e.prenom,
                nom: e.nom,
                courriel: e.courriel,
                da: e.da }
        });
    } catch (err) {
        console.error("Erreur GET /etudiants/:id :", err);
        res.status(500).json({ status: 500, message: "Erreur interne du serveur.", error: err.message });
    }
});

// DELETE /etudiants/:id (supprimer un étudiant)
router.delete(
    "/etudiants/:id",
    authRequired,
    roleRequired("editeur"),
    accepts("application/json"),
    validateParams(etudiantIdParamSchema),
    async (req, res) => {
        try {
            const { id } = req.validated.params;
        const deleted = await deleteEtudiant(id);
        if (!deleted) return res.status(404).json({ message: "Étudiant introuvable" });

        res.status(200).json({
            status: 200,
            message: "Étudiant supprimé avec succès.",
            data: { id }
        });
    } catch (err) {
        console.error("Erreur DELETE /etudiants/:id :", err);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

// section cours

// GET /etudiants/:id/courses (cours d’un étudiant)
router.get(
    "/etudiants/:id/courses",
    accepts("application/json"),
    validateParams(etudiantIdParamSchema),
    async (req, res) => {
        try {
            const { id } = req.validated.params;
        const cours = await getCoursByEtudiant(id);

        if (!cours || cours.length === 0)
            return res.status(200).json({
                status: 200,
                message: "Aucun cours inscrit pour cet étudiant.",
                data: []
            });

        const filteredCours = cours.map(c => ({
            code: c.code,
            nom: c.nom_cours,
            enseignant: c.enseignant,
            date_inscription: c.date_inscription
        }));

        res.status(200).json({
            status: 200,
            message: "Cours récupérés avec succès.",
            data: filteredCours
        });
    } catch (err) {
        console.error("Erreur /etudiants/:id/courses :", err);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

// GET /courses (liste des cours)
router.get(
    "/courses",
    accepts("application/json"),
    validateQuery(getCoursesQuerySchema),
    async (req, res) => {
        try {
            const cours = await getAllCours();
        if (!cours || cours.length === 0)
            return res.status(200).json({
                status: 200,
                message: "Aucun cours disponible.",
                data: []
            });

        const filteredCours = cours.map(c => ({
            id: c.id,
            nom: c.nom,
            code: c.code
        }));

        res.status(200).json({
            status: 200,
            message: "Liste des cours récupérée avec succès.",
            data: filteredCours
        });
    } catch (err) {
        console.error("Erreur /courses :", err);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

// section inscriptions

// POST /inscriptions (ajouter)
router.post(
    "/inscriptions",
    authRequired,
    roleRequired("editeur"),
    accepts("application/json"),
    validateBody(createInscriptionSchema),
    async (req, res) => {
        try {
            const { etudiantId, coursId } = req.validated.body;

        const inscriptions = await getInscriptionsByEtudiant(etudiantId);
        const dejaInscrit = inscriptions.some(i => i.id === parseInt(coursId));

        if (dejaInscrit)
            return res.status(409).json({
                status: 409,
                message: "L'étudiant est déjà inscrit à ce cours."
            });

        const inscription = await addInscription(etudiantId, coursId);
        if (!inscription)
            return res.status(500).json({
                status: 500,
                message: "Erreur lors de l’ajout de l’inscription."
            });

        res.status(201).json({
            status: 201,
            message: "Inscription créée avec succès.",
            data: {
                id_inscription: inscription.id,
                etudiant_id: etudiantId,
                cours_id: coursId,
                date_inscription: inscription.date_inscription
            },
            links: {
                etudiant: `${req.protocol}://${req.get("host")}/api/v2/etudiants/${etudiantId}`,
                cours: `${req.protocol}://${req.get("host")}/api/v2/courses/${coursId}`
            }
        });
    } catch (err) {
        console.error("Erreur POST /inscriptions :", err);
        res.status(500).json({ status: 500, message: "Erreur interne du serveur.", error: err.message });
    }
});

// DELETE /inscriptions/:etudiantId/:coursId (supprimer)
router.delete(
    "/inscriptions/:etudiantId/:coursId",
    authRequired,
    roleRequired("editeur"),
    accepts("application/json"),
    validateParams(deleteInscriptionParamsSchema),
    async (req, res) => {
        try {
            const { etudiantId, coursId } = req.validated.params;

        const deleted = await deleteInscription(etudiantId, coursId);

        if (!deleted)
            return res.status(404).json({ message: "Inscription non trouvée" });

        res.status(200).json({
            status: 200,
            message: "Inscription supprimée avec succès.",
            data: { etudiant_id: etudiantId, cours_id: coursId }
        });
    } catch (err) {
        res.status(500).json({ message: "Erreur serveur" });
    }
});

export default router;
