import { z } from 'zod';

export const createProjectSchema = z.object({
    name: z.string().min(1, { message: 'Project name is required' }),
    description: z.string().optional(),
});

export const updateProjectSchema = z.object({
    name: z.string().min(1, { message: 'Project name is required' }).optional(),
    description: z.string().optional(),
});
