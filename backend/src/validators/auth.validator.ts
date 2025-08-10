import { z } from 'zod';

export const AuthSchema = z.object({
  email: z.email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password must be no more than 128 characters')
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' })
    .regex(/[^a-zA-Z0-9]/, { message: 'Password must contain at least one special character' }),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().nonempty('Refresh token is required'),
});

export const UserIdSchema = z.object({
  userId: z.uuid('Invalid user ID format'),
});