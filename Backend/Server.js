import express from "express";
import cors from "cors";
import router from "./v1.js";
import dotenv from "dotenv";
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1", router);

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Serveur en ligne sur http://localhost:${port}/api/v1`);
});
