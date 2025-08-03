import { z } from 'zod';

export const sendInvitationSchema = z.object({
    email: z.string().email({ message: 'Invalid email format' }),
});
