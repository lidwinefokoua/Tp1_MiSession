import pg from "pg";
const { Pool } = pg;

const pool = new Pool({
    ssl: { rejectUnauthorized: false }
});

export async function createUser({ nom, prenom, email, password_hash, role, subscribed }) {
    const client = await pool.connect();
    try {
        const query = `
            INSERT INTO s4205se_${process.env.PGUSER}.users 
            (nom, prenom, courriel, password_hash, role, subscribed)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, nom, prenom, courriel, role, subscribed
        `;

        const values = [nom, prenom, email, password_hash, role, subscribed];

        const { rows } = await client.query(query, values);
        return rows[0];
    } finally {
        client.release();
    }
}


export async function getUserByUsername(username) {
    const client = await pool.connect();
    try {
        const { rows } = await client.query(
            `SELECT * FROM s4205se_${process.env.PGUSER}.users WHERE nom = $1`,
            [username]
        );
        return rows[0];
    } finally {
        client.release();
    }
}

export async function getUserByEmail(email) {
    const client = await pool.connect();
    try {
        const { rows } = await client.query(
            `SELECT * FROM s4205se_${process.env.PGUSER}.users WHERE courriel = $1`,
            [email]
        );
        return rows[0];
    } finally {
        client.release();
    }
}
