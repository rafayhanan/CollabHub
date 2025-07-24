import jwt, { JwtPayload } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

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

export const generateAccessToken = (userId: string): string => {
  const payload = {
    sub: userId,
  };
  return jwt.sign(payload, getAccessTokenSecret(), {
    expiresIn: '15m',
    jwtid: uuidv4(),
  });
};

export const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ sub: userId }, getRefreshTokenSecret(), {
    expiresIn: '7d',
    jwtid: uuidv4(),
  });
};

export const verifyAccessToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, getAccessTokenSecret()) as JwtPayload;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, getRefreshTokenSecret()) as JwtPayload;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};