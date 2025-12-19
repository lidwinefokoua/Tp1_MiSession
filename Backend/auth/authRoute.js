import express from "express";
import argon2 from "argon2";

import { createUser } from "./dbUsers.js";
import { getUserByEmail } from "./dbUsers.js";
import { getUserById } from "./dbUsers.js";
import { updatePassword } from "./dbUsers.js";
import {updateSubscribed} from "./dbUsers.js";

import {createSession} from "./jwt.js";
import {authRequired} from "./middlewar_auth.js";
import {validateBody, validateUserFromToken} from "../validators/validate.js";
import {
    loginSchema,
    registerUserSchema,
    updatePasswordSchema,
    userIdFromTokenSchema
} from "../validators/userValidators.js";


export const authRouter = express.Router();

authRouter.get(
    "/me",
    authRequired,
    validateUserFromToken(userIdFromTokenSchema),
    async (req, res) => {
        try {
            const { sub } = req.validated.user;

            const dbUser = await getUserById(sub);

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
} catch (err) {
    console.error("Erreur GET /auth/me :", err);
    res.status(500).json({ message: "Erreur serveur" });
}
}
);


authRouter.post(
    "/register",
    validateBody(registerUserSchema),
    async (req, res) => {
        try {
            const { nom, prenom, email, password } = req.validated.body;

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
authRouter.post(
    "/login",
    validateBody(loginSchema),
    async (req, res) => {
        try {
            const { email, password } = req.validated.body;

            const user = await getUserByEmail(email);

            if (!user) {
                return res.status(401).json({ message: "Identifiants invalides." });
            }

            if (!user.subscribed) {
                return res.status(403).json({
                    message: "Votre compte est désactivé. Contactez un administrateur."
                });
            }


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
        } catch (err) {
            console.error("Erreur POST /login :", err);
            res.status(500).json({ message: "Erreur serveur." });
        }
    }
);

// PUT /auth/password
authRouter.put(
    "/password",
    authRequired,
    validateBody(updatePasswordSchema),
    async (req, res) => {
        try {
            const userId = req.user.sub;
            const { oldPassword, newPassword } = req.validated.body;

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


// Déconnexion

authRouter.delete(
    "/disable",
    authRequired,
    validateUserFromToken(userIdFromTokenSchema),
    async (req, res) => {
        try {
            const { sub: userId } = req.validated.user;

        await updateSubscribed(userId, false);

        res.clearCookie("access_token");

        res.status(200).json({ message: "Compte déconnecté et désactivé." });

    } catch (err) {
        console.error("Erreur DELETE /auth/logout :", err);
        res.status(500).json({ message: "Erreur serveur" });
    }
});