import { z } from 'zod';

export const assignmentItemSchema = z.object({
    userId: z.string().uuid(),
    note: z.string().min(1).optional(),
});

export const createTaskSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
    dueDate: z.string().datetime().optional(),
    // Optional at-creation assignments. Only project owners are allowed to include this.
    assignments: z.array(assignmentItemSchema).optional(),
});

export const updateTaskSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional().nullable(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
    dueDate: z.string().datetime().optional().nullable(),
    assignments: z.array(assignmentItemSchema).optional().nullable(),
});

export const assignTaskSchema = z.object({
    assignments: z.array(assignmentItemSchema).min(1, 'At least one assignment is required'),
});
