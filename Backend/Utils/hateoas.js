const ALLOWED_LIMITS = [10, 20, 25, 30, 35, 40, 50, 100];

export function buildEtudiantsLinks(req, { page, limit, totalPages, search }) {
    const baseUrl = `${req.protocol}://${req.get("host")}/api/v2/etudiants`;
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";

    const links = {
        self: `${baseUrl}?page=${page}&limit=${limit}${searchParam}`,
        first_page: `${baseUrl}?page=1&limit=${limit}${searchParam}`,
        prev_page:
            page > 1
                ? `${baseUrl}?page=${page - 1}&limit=${limit}${searchParam}`
                : null,
        next_page:
            page < totalPages
                ? `${baseUrl}?page=${page + 1}&limit=${limit}${searchParam}`
                : null,
        last_page: `${baseUrl}?page=${totalPages}&limit=${limit}${searchParam}`,
        pdf: `${baseUrl}?format=pdf&page=${page}&limit=${limit}${searchParam}`,
    };

    ALLOWED_LIMITS.forEach(l => {
        links[`limit_${l}`] = `${baseUrl}?page=1&limit=${l}${searchParam}`;
    });

    return links;
}
