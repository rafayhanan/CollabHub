import { Request, Response } from "express";
import { hashPassword, verifyPassword } from "../utils/hash";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";
import prisma from "../config/prisma";
import logger from "../utils/logger";

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const hashedPassword = await hashPassword(password);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
            },
        });

        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken(user.id);

        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            },
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return res.status(201).json({
            message: 'User registered successfully',
            accessToken,
            user: {
                id: user.id,
                email: user.email,
            },
        });

    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: "Email already in use" });
        }
        logger.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const isValid = await verifyPassword(user.password, password);
        if (!isValid) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken(user.id);

        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            },
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return res.status(200).json({
            message: 'Login successful',
            accessToken,
            user: {
                id: user.id,
                email: user.email,
            },
        });
    } catch (err) {
        logger.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export const logout = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.cookies;

        if (!refreshToken) {
            return res.status(400).json({ message: 'Refresh token not found' });
        }

        await prisma.refreshToken.deleteMany({
            where: { token: refreshToken },
        });

        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        });

        return res.status(200).json({ message: 'Logged out successfully' });
    } catch (err) {
        logger.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

export const refreshToken = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.cookies;

        if (!refreshToken) {
            return res.status(401).json({ message: 'Refresh token not found' });
        }

        const refreshTokenDoc = await prisma.refreshToken.findUnique({
            where: { token: refreshToken },
            include: { user: true },
        });

        if (!refreshTokenDoc || refreshTokenDoc.expiresAt < new Date()) {
            return res.status(403).json({ message: 'Invalid or expired refresh token' });
        }

        const accessToken = generateAccessToken(refreshTokenDoc.userId);

        return res.status(200).json({
            message: 'Access token refreshed successfully',
            accessToken,
        });

    } catch (err) {
        logger.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};