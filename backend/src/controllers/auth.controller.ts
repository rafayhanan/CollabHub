import { Request, Response } from "express";
import { hashPassword, verifyPassword } from "../utils/hash";
import { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken } from "../utils/jwt";
import prisma from "../config/prisma";
import { AuthSchema } from "../utils/auth.validator";

export const register = async (req: Request, res: Response) => {
    try {
      const parsed = AuthSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid input', details: parsed.error.message });
      }
  
      const { email, password } = parsed.data;
      const normalizedEmail = email.toLowerCase().trim();
  
      // Use transaction to prevent race conditions
      const result = await prisma.$transaction(async (tx) => {
        const hashedPassword = await hashPassword(password);
        
        try {
          const user = await tx.user.create({
            data: {
              email: normalizedEmail,
              password: hashedPassword,
            },
          });
  
          const accessToken = generateAccessToken(user.id);
          const refreshToken = generateRefreshToken(user.id);
  
          await tx.refreshToken.create({
            data: {
              token: refreshToken,
              userId: user.id,
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 
            },
          });
  
          return { user, accessToken, refreshToken };
        } catch (error: any) {
          // Handle unique constraint violation (email already exists)
          if (error.code === 'P2002') {
            throw new Error('EMAIL_EXISTS');
          }
          throw error;
        }
      });
  
      return res.status(201).json({
        message: 'User registered successfully',
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: {
          id: result.user.id,
          email: result.user.email,
        },
      });
    } catch (err: any) {
      if (err.message === 'EMAIL_EXISTS') {
        return res.status(409).json({ error: 'Email already in use' });
      }
      console.error('Register Error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
  
  export const login = async (req: Request, res: Response) => {
    try {
      const parsed = AuthSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid input', details: parsed.error.message });
      }
  
      const { email, password } = parsed.data;
      const normalizedEmail = email.toLowerCase().trim();
  
      const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
  
      const isValid = await verifyPassword(user.password, password);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
  
      const accessToken = generateAccessToken(user.id);
      const refreshToken = generateRefreshToken(user.id);
  
      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        },
      });
  
      return res.status(200).json({
        message: 'Login successful',
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
        },
      });
    } catch (err) {
      console.error('Login Error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };

export const logout = async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token required' });
      }

      // Remove the refresh token from database
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken }
      });

      return res.status(200).json({ message: 'Logged out successfully' });
    } catch (err) {
      console.error('Logout Error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };