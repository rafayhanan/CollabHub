import jwt from "jsonwebtoken";

const accessTokenSecret: string = process.env.ACCESS_TOKEN_SECRET as string;
const refreshTokenSecret: string = process.env.REFRESH_TOKEN_SECRET as string;

export const generateAccessToken = (userId: string) => {
    return jwt.sign({ userId }, accessTokenSecret, { expiresIn: "15m" });
};

export const generateRefreshToken = (userId: string) => {
    return jwt.sign({ userId }, refreshTokenSecret, { expiresIn: "7d" });
};

export const verifyAccessToken = (token: string) => {
    return jwt.verify(token, accessTokenSecret);
};

export const verifyRefreshToken = (token: string) => {
    return jwt.verify(token, refreshTokenSecret);
};