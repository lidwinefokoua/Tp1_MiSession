import express from "express";
import cors from "cors";
import router from "./v1.js";

const app = express();

// Active CORS pour toutes les origines (développement)
app.use(cors());

// 🔹 Middlewares standards
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔹 Routes
app.use("/api/v1", router);

// 🔹 Démarrage du serveur
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Serveur en ligne sur http://localhost:${PORT}/api/v1`);
});
