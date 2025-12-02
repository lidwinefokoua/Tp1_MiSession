
import Joi from "joi";

/* ----------------------------------------------------------
   SCHEMA : Étudiant
   ----------------------------------------------------------
   Règles avancées :
   - Prénom / nom : lettres, accents, tirets
   - Email : format strict
   - DA : 7 à 12 chiffres
   - Id : interdit dans POST / PUT
---------------------------------------------------------- */

export const userRegisterSchema = Joi.object({
    nom: Joi.string().min(2).max(50).required(),
    prenom: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(100).required()
});

export const etudiantSchema = Joi.object({
    prenom: Joi.string()
        .trim()
        .regex(/^[A-Za-zÀ-ÿ\-'\s]+$/)
        .min(2)
        .max(50)
        .required(),

    nom: Joi.string()
        .trim()
        .regex(/^[A-Za-zÀ-ÿ\-'\s]+$/)
        .min(2)
        .max(50)
        .required(),

    email: Joi.string()
        .email({ tlds: { allow: false } })
        .required(),

    da: Joi.string()
        .regex(/^[0-9]{7,12}$/)
        .required(),

    id: Joi.any().forbidden()
});


/* ----------------------------------------------------------
   SCHEMA : Inscription (relation étudiant ↔ cours)
   ----------------------------------------------------------
---------------------------------------------------------- */
export const inscriptionSchema = Joi.object({
    etudiantId: Joi.number().integer().positive().required(),
    coursId: Joi.number().integer().positive().required()
});

/* ----------------------------------------------------------
   SCHEMA : Authentification
   ----------------------------------------------------------
   - username : lettres / chiffres
   - password : fort, min 8 chars
   - role : "editeur" ou "normal"
---------------------------------------------------------- */
export const authSchema = Joi.object({
    username: Joi.string()
        .alphanum()
        .min(3)
        .max(30)
        .required(),

    password: Joi.string()
        .min(8)
        .max(50)
        .required(),

    role: Joi.string()
        .valid("normal", "editeur")
        .default("normal"),

    id: Joi.any().forbidden()
});

/* ----------------------------------------------------------
   MIDDLEWARES GÉNÉRIQUES
---------------------------------------------------------- */
export function makeValidator(schema) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body);

        if (error) {
            return res.status(400).json({
                status: 400,
                message: "Validation échouée.",
                details: error.details[0].message
            });
        }

        req.validated = value;
        next();
    };
}

// Middlewares prêts à l’emploi
export const validateEtudiant = makeValidator(etudiantSchema);
export const validateInscription = makeValidator(inscriptionSchema);
export const validateUserAuth = makeValidator(authSchema);
