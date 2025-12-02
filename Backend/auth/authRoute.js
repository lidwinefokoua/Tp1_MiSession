import express from "express";
import argon2 from "argon2";

import { createUser } from "./dbUsers.js";
import { getUserByEmail } from "./dbUsers.js";

import {createSession} from "./jwt.js";
import {authRequired} from "./middlewar_auth.js";


export const authRouter = express.Router();

authRouter.get("/me",authRequired, (req, res) => {
    res.status(200).json({
        message: "Utilisateur connecté",
        user: req.user
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
            role: "normal"   // ⭐ par défaut rôle normal
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
    if (!user) return res.status(401).json({ message: "Identifiants invalides" });

    const ok = await argon2.verify(user.password_hash, password);
    if (!ok) return res.status(401).json({ message: "Mot de passe incorrect" });

    const session = createSession({
        sub: user.id,
        role: user.role,       // ⭐ normal ou editeur
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

//
// 🚪 Déconnexion
//
authRouter.delete("/login", (req, res) => {
    res.clearCookie("access_token");
    res.status(200).json({ message: "Déconnecté" });
});