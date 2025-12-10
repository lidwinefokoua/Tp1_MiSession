import Joi from "joi";

export const userIdFromTokenSchema = Joi.object({
    sub: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
            "number.base": "L'identifiant utilisateur doit être un nombre.",
            "number.integer": "L'identifiant utilisateur doit être un entier.",
            "number.positive": "L'identifiant utilisateur doit être positif.",
            "any.required": "Le token ne contient pas d'identifiant utilisateur valide."
        })

});

export const registerUserSchema = Joi.object({
    nom: Joi.string()
        .trim()
        .min(2)
        .max(50)
        .regex(/^[A-Za-zÀ-ÿ\-'\s]+$/)
        .required()
        .messages({
            "string.pattern.base": "Le nom contient des caractères invalides."
        }),

    prenom: Joi.string()
        .trim()
        .min(2)
        .max(50)
        .regex(/^[A-Za-zÀ-ÿ\-'\s]+$/)
        .required()
        .messages({
            "string.pattern.base": "Le prénom contient des caractères invalides."
        }),

    email: Joi.string()
        .email({ tlds: { allow: false } })
        .required(),

    password: Joi.string()
        .min(6)
        .max(255)
        .regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9]).{6,}$/)
        .required()
        .messages({
            "string.pattern.base":
                "Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre. " +
                "minimun 6 caractères"
        })
});

export const loginSchema = Joi.object({
    email: Joi.string()
        .email({ tlds: { allow: false } })
        .required()
        .messages({
            "string.email": "Le courriel est invalide.",
            "any.required": "Le courriel est requis."
        }),

    password: Joi.string()
        .min(1)
        .max(255)
        .required()
        .messages({
            "any.required": "Le mot de passe est requis."
        })
});

export const updatePasswordSchema = Joi.object({
    oldPassword: Joi.string()
        .min(4)
        .max(255)
        .required()
        .messages({
            "any.required": "L'ancien mot de passe est requis."
        }),

    newPassword: Joi.string()
        .min(6)
        .max(255)
        .regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9]).+$/)
        .required()
        .messages({
            "string.min": "Le nouveau mot de passe doit contenir au moins 8 caractères.",
            "string.pattern.base":
                "Le nouveau mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre.",
            "any.required": "Le nouveau mot de passe est requis."
        })
});


