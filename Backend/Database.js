import pg from "pg";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

let options = {
    ssl: { rejectUnauthorized: false }
};

const { Pool } = pg;
const pool = new Pool(options);

export async function getAllEtudiants(limit, offset = 0) {
    const client = await pool.connect();
    try {
        const sql = `
            SELECT id, nom, prenom, courriel, da
            FROM s4205se_${process.env.PGUSER}.etudiants
            ORDER BY nom ASC
                LIMIT $1 OFFSET $2;
        `;
        const res = await client.query(sql, [limit, offset]);
        return res.rows;
    } catch (err) {
        console.error("Erreur getAllEtudiants:", err);
        return [];
    } finally {
        client.release();
    }
}

export async function getEtudiantsCount() {
    const client = await pool.connect();
    try {
        const sql = `SELECT COUNT(*) AS total FROM s4205se_${process.env.PGUSER}.etudiants;`;
        const res = await client.query(sql);
        return parseInt(res.rows[0].total);
    } catch (err) {
        console.error("Erreur getEtudiantsCount:", err);
        return 0;
    } finally {
        client.release();
    }
}

export async function getEtudiantById(id) {
    const client = await pool.connect();
    try {
        const sql = `
            SELECT id, nom, prenom, courriel, da
            FROM s4205se_${process.env.PGUSER}.etudiants
            WHERE id = $1
            ORDER BY nom ASC;
        `;
        const res = await client.query(sql, [id]);
        return res.rows[0] || null;
    } catch (err) {
        console.error("Erreur getEtudiantById:", err);
        return null;
    } finally {
        client.release();
    }
}

export async function addEtudiant(etudiant) {
    const client = await pool.connect();
    try {
        const sql = `
            INSERT INTO s4205se_${process.env.PGUSER}.etudiants (nom, prenom, courriel, da)
            VALUES ($1, $2, $3, $4)
                RETURNING *;
        `;
        const res = await client.query(sql, [
            etudiant.nom,
            etudiant.prenom,
            etudiant.courriel,
            etudiant.da
        ]);
        return res.rows[0];
    } catch (err) {
        console.error("Erreur addEtudiant:", err);
        return null;
    } finally {
        client.release();
    }
}

export async function updateEtudiant(e) {
    const client = await pool.connect();
    try {
        const sql = `
            UPDATE s4205se_${process.env.PGUSER}.etudiants
            SET prenom = $1, nom = $2, courriel = $3
            WHERE id = $4
                RETURNING *;
        `;
        const result = await client.query(sql, [e.prenom, e.nom, e.courriel, e.id]);
        return result.rows[0];
    } catch (err) {
        console.error("Erreur updateEtudiant :", err);
        return null;
    } finally {
        client.release();
    }
}

export async function deleteEtudiant(id) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        await client.query(
            `DELETE FROM s4205se_${process.env.PGUSER}.inscription WHERE etudiant_id = $1`,
            [id]
        );

        const sql = `
            DELETE FROM s4205se_${process.env.PGUSER}.etudiants
            WHERE id = $1
                RETURNING *;
        `;
        const result = await client.query(sql, [id]);

        if (result.rowCount === 0) {
            await client.query("ROLLBACK");
            return false;
        }

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);

        const photoPath = path.join(__dirname, "../frontend-vite/public/photos", `${id}.png`);

        if (fs.existsSync(photoPath)) {
            fs.unlinkSync(photoPath);
            console.log(`Photo supprimée : ${photoPath}`);
        } else {
            console.log(`Aucune photo trouvée pour l'étudiant ${id}`);
        }

        await client.query("COMMIT");
        return true;
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Erreur deleteEtudiant:", err);
        return false;
    } finally {
        client.release();
    }
}

export async function getAllCours(limit, offset = 0) {
    const client = await pool.connect();
    try {
        const sql = `
            SELECT id, code, nom, duree, enseignant
            FROM s4205se_${process.env.PGUSER}.cours
            ORDER BY code ASC
            LIMIT $1 OFFSET $2;
        `;
        const res = await client.query(sql,[limit, offset]);
        return res.rows;
    } catch (err) {
        console.error("Erreur getAllCours:", err);
        return [];
    } finally {
        client.release();
    }
}

export async function getCoursByEtudiant(idEtudiant) {
    const client = await pool.connect();
    try {
        const sql = `
            SELECT i.id AS id_inscription,
                   c.id AS id,
                   c.code,
                   c.nom AS nom_cours,
                   c.duree,
                   c.enseignant,
                   i.date_inscription
            FROM s4205se_${process.env.PGUSER}.inscription i
                     JOIN s4205se_${process.env.PGUSER}.cours c
                          ON c.id = i.cours_id
            WHERE i.etudiant_id = $1
            ORDER BY i.date_inscription DESC;
        `;
        const res = await client.query(sql, [idEtudiant]);
        return res.rows;
    } catch (err) {
        console.error("Erreur getCoursByEtudiant:", err);
        return [];
    } finally {
        client.release();
    }
}

export async function getInscriptionsByEtudiant(idEtudiant) {
    const client = await pool.connect();
    try {
        const sql = `
            SELECT
                i.id AS id_inscription,
                i.date_inscription,
                c.id AS id,
                c.code,
                c.nom AS nom_cours,
                c.duree,
                c.enseignant
            FROM s4205se_${process.env.PGUSER}.inscription i
                     JOIN s4205se_${process.env.PGUSER}.cours c
                          ON c.id = i.cours_id
            WHERE i.etudiant_id = $1
            ORDER BY i.date_inscription DESC;
        `;
        const res = await client.query(sql, [idEtudiant]);
        return res.rows;
    } catch (err) {
        console.error("Erreur getInscriptionsByEtudiant:", err);
        return [];
    } finally {
        client.release();
    }
}

export async function addInscription(idEtudiant, idCours) {
    const client = await pool.connect();
    try {
        const sql = `
            INSERT INTO s4205se_${process.env.PGUSER}.inscription (etudiant_id, cours_id, date_inscription)
            VALUES ($1, $2, NOW())
                RETURNING *;
        `;
        const res = await client.query(sql, [idEtudiant, idCours]);
        return res.rows[0];
    } catch (err) {
        console.error("Erreur addInscription:", err);
        return null;
    } finally {
        client.release();
    }
}

export async function deleteInscription(idEtudiant, idCours) {
    const client = await pool.connect();
    try {

        const sql = `
            DELETE FROM s4205se_${process.env.PGUSER}.inscription
            WHERE etudiant_id = $1 AND cours_id = $2
                RETURNING *;
        `;
        const res = await client.query(sql, [idEtudiant, idCours]);

        console.log("Ligne(s) supprimée(s) →", res.rowCount);

        return res.rowCount > 0;
    } catch (err) {
        console.error(`ERREUR SQL deleteInscription :`, err);
        return false;
    } finally {
        client.release();
    }
}

export async function searchEtudiants(search, limit, offset) {
    const client = await pool.connect();
    try {
        const pattern = `%${search}%`;
        const sql = `
            SELECT id, nom, prenom, courriel, da
            FROM s4205se_${process.env.PGUSER}.etudiants
            WHERE LOWER(nom) LIKE LOWER($1)
               OR LOWER(prenom) LIKE LOWER($1)
               OR CAST(da AS TEXT) LIKE $1
            ORDER BY id ASC
                LIMIT $2 OFFSET $3;
        `;
        const res = await client.query(sql, [pattern, limit, offset]);
        return res.rows;
    } finally {
        client.release();
    }
}

export async function countSearchEtudiants(search) {
    const client = await pool.connect();
    try {
        const pattern = `%${search}%`;
        const sql = `
            SELECT COUNT(*) AS total
            FROM s4205se_${process.env.PGUSER}.etudiants
            WHERE LOWER(nom) LIKE LOWER($1)
               OR LOWER(prenom) LIKE LOWER($1)
               OR CAST(da AS TEXT) LIKE $1;
        `;
        const res = await client.query(sql, [pattern]);
        return parseInt(res.rows[0].total);
    } finally {
        client.release();
    }
}



