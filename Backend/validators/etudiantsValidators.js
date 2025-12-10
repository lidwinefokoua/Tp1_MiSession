import Joi from "joi";

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

export const listEtudiantsSchema = Joi.object({
    page: Joi.number()
        .integer()
        .min(1)
        .default(1)
        .messages({
            "number.base": "La page doit être un nombre.",
            "number.min": "La page doit être supérieure ou égale à 1."
        }),

    limit: Joi.number()
        .integer()
        .min(5)
        .max(100)
        .default(10)
        .messages({
            "number.base": "La limite doit être un nombre.",
            "number.min": "La limite minimale est 10.",
            "number.max": "La limite maximale est 100."
        }),

    search: Joi.string()
        .allow("")
        .trim()
        .default(""),

    format: Joi.string()
        .valid("pdf")
        .optional()
});

export const createEtudiantSchema = Joi.object({
    prenom: Joi.string().min(2).max(50).required(),
    nom: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().max(100).required(),
    da: Joi.string()
        .max(20)
        .required()
});

export const etudiantIdParamSchema = Joi.object({
    id: Joi.number().integer().positive().required()
});

export const updateEtudiantSchema = Joi.object({
    prenom: Joi.string().min(2).max(50).required(),
    nom: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().max(100).required()
});

export const getCoursesQuerySchema = Joi.object({}).unknown(false);

export const createInscriptionSchema = Joi.object({
    etudiantId: Joi.number().integer().positive().required()
        .messages({
            "number.base": "L'identifiant de l'étudiant doit être un nombre.",
            "any.required": "Le champ 'etudiantId' est requis.",
            "number.positive": "L'identifiant de l'étudiant doit être positif."
        }),

    coursId: Joi.number().integer().positive().required()
        .messages({
            "number.base": "L'identifiant du cours doit être un nombre.",
            "any.required": "Le champ 'coursId' est requis.",
            "number.positive": "L'identifiant du cours doit être positif."
        })
});

import Joi from "joi";

export const deleteInscriptionParamsSchema = Joi.object({
    etudiantId: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
            "number.base": "L'identifiant de l'étudiant doit être un nombre.",
            "number.integer": "L'identifiant de l'étudiant doit être un entier.",
            "number.positive": "L'identifiant de l'étudiant doit être positif.",
            "any.required": "Le paramètre 'etudiantId' est requis."
        }),

    coursId: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
            "number.base": "L'identifiant du cours doit être un nombre.",
            "number.integer": "L'identifiant du cours doit être un entier.",
            "number.positive": "L'identifiant du cours doit être positif.",
            "any.required": "Le paramètre 'coursId' est requis."
        })
});
