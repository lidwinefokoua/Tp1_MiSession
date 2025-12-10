export function validateQuery(schema) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.query, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            return res.status(400).json({
                status: 400,
                message: "Paramètres de requête invalides.",
                errors: error.details.map(d => d.message)
            });
        }

        req.validated = req.validated || {};
        req.validated.query = value;

        next();
    };
}

export function validateBody(schema) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            return res.status(400).json({
                status: 400,
                message: "Corps de requête invalide.",
                errors: error.details.map(d => d.message)
            });
        }

        req.validated = req.validated || {};
        req.validated.body = value;

        next();
    };
}

export function validateParams(schema) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.params, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            return res.status(400).json({
                status: 400,
                message: "Paramètres d’URL invalides.",
                errors: error.details.map(d => d.message)
            });
        }

        req.validated = req.validated || {};
        req.validated.params = value;

        next();
    };
}


