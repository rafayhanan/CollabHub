import { Response, NextFunction } from 'express';
import { verifyRefreshToken } from '../utils/jwt';
import { AuthRequest } from '../utils/types';
import prisma from '../config/prisma';

export const authenticateRefreshToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
        return res.status(401).json({ message: 'Unauthorized: Refresh token is required' });
    }

    try {
        const decoded = verifyRefreshToken(refreshToken);
        const userId = (decoded as any).sub;

        const savedToken = await prisma.refreshToken.findUnique({
            where: { token: refreshToken },
        });

        if (!savedToken || savedToken.expiresAt < new Date() || savedToken.userId !== userId) {
            return res.status(403).json({ message: 'Forbidden: Invalid or expired refresh token' });
        }

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Forbidden: Invalid or expired refresh token' });
    }
};
