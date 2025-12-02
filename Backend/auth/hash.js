import argon2 from "argon2";

export async function hashPassword(password) {
    return await argon2.hash(password, {
        type: argon2.argon2id,
        timeCost: 3,
        memoryCost: 2 ** 16,
        parallelism: 1,
        hashLength: 32,
    });
}

export async function verifyPassword(hash, password) {
    return await argon2.verify(hash, password);
}
