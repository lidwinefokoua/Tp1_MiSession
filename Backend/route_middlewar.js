
export function baseUrl(req, res, next) {
    req.fullUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    next();
}

export function accepts(...mime) {
    return (req, res, next) => {
        if (req.accepts(mime)) next();
        else res.status(406).end();
    };
}
