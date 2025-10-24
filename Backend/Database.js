import pg from "pg";

let options = {
    ssl: { rejectUnauthorized: false }
};

const { Pool } = pg;
const pool = new Pool(options);



//Obtenir tous les étudiants (limité à 50)
export async function getAllEtudiants() {
    const client = await pool.connect();
    try {
        const sql = `
            SELECT id, nom, prenom, courriel, da
            FROM s4205se_${process.env.PGUSER}.etudiants
            ORDER BY id ASC
                LIMIT 50;
        `;
        const res = await client.query(sql);
        return res.rows;
    } catch (err) {
        console.error("Erreur getAllEtudiants:", err);
        return [];
    } finally {
        client.release();
    }
}

// Obtenir le nombre total d'étudiants
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

// Obtenir un étudiant par ID
export async function getEtudiantById(id) {
    const client = await pool.connect();
    try {
        const sql = `
            SELECT id, nom, prenom, courriel, da
            FROM s4205se_${process.env.PGUSER}.etudiants
            WHERE id = $1;
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

// Ajouter un étudiant
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

// Modifier un étudiant
export async function updateEtudiant(etudiant) {
    const client = await pool.connect();
    try {
        const sql = `
            UPDATE s4205se_${process.env.PGUSER}.etudiants
            SET nom = $1,
                prenom = $2,
                courriel = $3,
                da = $4
            WHERE id = $5
            RETURNING *;
        `;
        const res = await client.query(sql, [
            etudiant.nom,
            etudiant.prenom,
            etudiant.courriel,
            etudiant.da,
            etudiant.id
        ]);
        return res.rows[0];
    } catch (err) {
        console.error("Erreur updateEtudiant:", err);
        return null;
    } finally {
        client.release();
    }
}

// Supprimer un étudiant
export async function deleteEtudiant(id) {
    const client = await pool.connect();
    try {
        const sql = `DELETE FROM s4205se_${process.env.PGUSER}.etudiants WHERE id = $1;`;
        await client.query(sql, [id]);
        return true;
    } catch (err) {
        console.error("Erreur deleteEtudiant:", err);
        return false;
    } finally {
        client.release();
    }
}


// Tous les cours
export async function getAllCours() {
    const client = await pool.connect();
    try {
        const sql = `
            SELECT id, code, nom, duree, enseignant
            FROM s4205se_${process.env.PGUSER}.cours
            ORDER BY code ASC;
        `;
        const res = await client.query(sql);
        return res.rows;
    } catch (err) {
        console.error("Erreur getAllCours:", err);
        return [];
    } finally {
        client.release();
    }
}

// Ajouter un cours
export async function addCours(cours) {
    const client = await pool.connect();
    try {
        const sql = `
            INSERT INTO s4205se_${process.env.PGUSER}.cours (code, nom, duree, enseignant)
            VALUES ($1, $2, $3, $4)
                RETURNING *;
        `;
        const res = await client.query(sql, [
            cours.code,
            cours.nom,
            cours.duree,
            cours.enseignant
        ]);
        return res.rows[0];
    } catch (err) {
        console.error("Erreur addCours:", err);
        return null;
    } finally {
        client.release();
    }
}

/* ======================
   🧾 TABLE INSCRIPTION
   ====================== */

// Récupérer les cours d’un étudiant
export async function getCoursByEtudiant(idEtudiant) {
    const client = await pool.connect();
    try {
        const sql = `
            SELECT i.id AS id_inscription,
                   c.id AS id_cours,
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

// Inscrire un étudiant à un cours
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

// Supprimer une inscription
export async function deleteInscription(idInscription) {
    const client = await pool.connect();
    try {
        const sql = `DELETE FROM s4205se_${process.env.PGUSER}.inscription WHERE id = $1;`;
        await client.query(sql, [idInscription]);
        return true;
    } catch (err) {
        console.error("Erreur deleteInscription:", err);
        return false;
    } finally {
        client.release();
    }
}
