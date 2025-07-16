import jwt from "jsonwebtoken";

const getAccessTokenSecret = (): string => {
    const secret = process.env.ACCESS_TOKEN_SECRET;
    if (!secret) {
        throw new Error('ACCESS_TOKEN_SECRET environment variable is not set.');
    }
    return secret;
}

const getRefreshTokenSecret = (): string => {
    const secret = process.env.REFRESH_TOKEN_SECRET;
    if (!secret) {
        throw new Error('REFRESH_TOKEN_SECRET environment variable is not set.');
    }
    return secret;
}

export const generateAccessToken = (userId: string) => {
    return jwt.sign({ userId }, getAccessTokenSecret(), { expiresIn: "15m" });
};

export const generateRefreshToken = (userId: string) => {
    return jwt.sign({ userId }, getRefreshTokenSecret(), { expiresIn: "7d" });
};

export const verifyAccessToken = (token: string) => {
    return jwt.verify(token, getAccessTokenSecret());
};

export const verifyRefreshToken = (token: string) => {
    return jwt.verify(token, getRefreshTokenSecret());
};