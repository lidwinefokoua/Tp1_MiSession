// server.js
import express from "express";
import v1Router from "./v1.js";

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Version de l’API
app.use("/api/v1", v1Router);

// page d’accueil simple
app.get("/", (req, res) => {
    res.send("API en ligne sur /api/v1/users");
});

app.listen(PORT, () => {
    console.log(`Serveur en ligne sur http://localhost:${PORT}/api/v1/users`);
});