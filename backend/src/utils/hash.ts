import argon2 from "argon2";

export const hashPassword = async (password: string) => {
    return await argon2.hash(password);
};

export const verifyPassword = async (hash: string, password: string) => {
    return await argon2.verify(hash, password);
};