import express from "express";
import dotenv from "dotenv";
dotenv.config();


import cors from "cors";
import cookieParser from "cookie-parser";


import v1Router from "./V1.js";
import v2Router from "./V2.js";
import { authRouter } from "./auth/authRoute.js";
import {authenticated} from "./auth/middlewar_auth.js";


const app = express();

// Middleware global
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,

}));

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE");
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ====== Montage des routes ======

// Routes d'authentification
//app.use("/api", authenticated);


// API V1
// Routes d’auth
app.use("/auth", authRouter);

// Toutes les routes API V2 nécessitent une session
app.use("/api/v2", authenticated, v2Router);


// ==================================

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Serveur en ligne : http://localhost:${port}`);

});
