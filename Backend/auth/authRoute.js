import express from "express";
import argon2 from "argon2";

import { createUser } from "./dbUsers.js";
import { getUserByEmail } from "./dbUsers.js";
import { getUserById } from "./dbUsers.js";
import { updatePassword } from "./dbUsers.js";
import {updateSubscribed} from "./dbUsers.js";

import {createSession} from "./jwt.js";
import {authRequired} from "./middlewar_auth.js";


export const authRouter = express.Router();

authRouter.get("/me", authRequired, async (req, res) => {
    // ⚠️ req.user.sub contient l'ID extrait du JWT
    const dbUser = await getUserById(req.user.sub);

    if (!dbUser) {
        return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    res.status(200).json({
        message: "Utilisateur connecté",
        user: {
            id: dbUser.id,
            nom: dbUser.nom,
            prenom: dbUser.prenom,
            role: dbUser.role
        }
    });
});


authRouter.post("/register", async (req, res) => {
    try {
        const { nom, prenom, email, password } = req.body;

        const hash = await argon2.hash(password, {
            type: argon2.argon2id
        });

        const user = await createUser({
            nom,
            prenom,
            email,
            password_hash: hash,
            role: "normal"  ,
            subscribed: true
        });

        res.status(201).json({ message: "Utilisateur créé", user });

    } catch (err) {
        if (err.code === "23505") {
            return res.status(409).json({ message: "Ce courriel existe déjà" });
        }
        res.status(500).json({ message: "Erreur serveur" });
    }
});

//
// 🔑 Connexion
//
authRouter.post("/login", async (req, res) => {
    const { email, password } = req.body;

    const user = await getUserByEmail(email);
    if (!user.subscribed) {
        return res.status(403).json({
            message: "Votre compte est désactivé. Contactez un administrateur."
        });
    }

    if (!user) return res.status(401).json({ message: "Identifiants invalides" });

    const ok = await argon2.verify(user.password_hash, password);
    if (!ok) return res.status(401).json({ message: "Mot de passe incorrect" });

    const session = createSession({
        sub: user.id,
        role: user.role,
        email: user.email
    });

    res.cookie("access_token", session, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 15 * 60 * 1000
    });

    res.status(200).json({
        message: "Connexion réussie",
        user: {
            id: user.id,
            nom: user.nom,
            prenom: user.prenom,
            courriel: user.email,
            role: user.role
        }
    });
});

// PUT /auth/password
authRouter.put("/password", authRequired, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const userId = req.user.sub; // ⭐ vient du JWT validé

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ message: "Les deux champs sont requis." });
        }

        // Récupérer l'utilisateur dans la BD
        const user = await getUserById(userId);
        if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

        // Vérifier ancien mot de passe
        const match = await argon2.verify(user.password_hash, oldPassword);
        if (!match) {
            return res.status(401).json({ message: "Ancien mot de passe incorrect." });
        }

        // Hash du nouveau mot de passe
        const newHash = await argon2.hash(newPassword, { type: argon2.argon2id });

        // Mise à jour BD
        await updatePassword(userId, newHash);

        res.status(200).json({ message: "Mot de passe mis à jour avec succès." });

    } catch (err) {
        console.error("Erreur PUT /auth/password :", err.stack || err);
        res.status(500).json({ message: "Erreur serveur." });
    }
});


//
// 🚪 Déconnexion
//
authRouter.delete("/disable", authRequired, async (req, res) => {
    try {
        const userId = req.user.sub;

        // Désactiver le compte
        await updateSubscribed(userId, false);

        // Supprimer le cookie
        res.clearCookie("access_token");

        res.status(200).json({ message: "Compte déconnecté et désactivé." });

    } catch (err) {
        console.error("Erreur DELETE /auth/logout :", err);
        res.status(500).json({ message: "Erreur serveur" });
    }
});