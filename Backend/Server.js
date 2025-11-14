import express from "express";
import cors from "cors";
import router from "./v1.js";

const app = express();

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1", router);

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Serveur en ligne sur http://localhost:${PORT}/api/v1`);
});
