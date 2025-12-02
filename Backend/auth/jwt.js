import jwt from "jsonwebtoken";

export function createSession(payload) {
    return jwt.sign(payload, process.env.SESSION_SECRET, {
        expiresIn: "15m"
    });
}

export function verifySession(token) {
    return jwt.verify(token, process.env.SESSION_SECRET);
}

