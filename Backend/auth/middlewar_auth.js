import jwt from "jsonwebtoken";

//
// 🔐 Vérifie que l’utilisateur est authentifié
//
export function authenticated(req, res, next) {
    const token = req.cookies?.access_token;

    if (!token) {
        return res.status(401).json({ message: "Authentification requise." });
    }

    try {
        const payload = jwt.verify(token, process.env.SESSION_SECRET);

        // Déposer les infos dans req.user
        req.user = {
            id: payload.sub,
            role: payload.role,
            email: payload.email
        };

        next();
    } catch (err) {
        return res.status(401).json({ message: "Session invalide ou expirée." });
    }
}

//
// 🔐 Vérifie que l’utilisateur a UN DES rôles autorisés
//
// Exemple :
// app.get("/cours", authorized("editeur"), ...)
//
export function roleRequired(...allowedRoles) {
    return (req, res, next) => {

        if (!req.user) {
            return res.status(401).json({ message: "Authentification requise." });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: "Accès refusé : rôle insuffisant."
            });
        }

        next();
    };
}



export function authRequired(req, res, next) {
    const token = req.cookies?.access_token;

    if (!token) {
        return res.status(401).json({ message: "Authentification requise." });
    }

    try {
        req.user = jwt.verify(token, process.env.SESSION_SECRET);
        next();
    } catch (err) {
        return res.status(401).json({ message: "Session invalide ou expirée." });
    }
}

