import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../utils/types';
import logger from '../utils/logger';

export const createTask = async (req: AuthRequest, res: Response) => {
    const { projectId } = req.params;
    const { title, description, status, dueDate, assignments } = req.body as {
        title: string;
        description?: string;
        status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
        dueDate?: string;
        assignments?: Array<{ userId: string; note?: string }>;
    };
    const userId = (req.user as { sub: string }).sub;

    try {
        const task = await prisma.$transaction(async (tx) => {
            // 1. Authorize: Check if the user is a member of the project
            const member = await tx.userProject.findUnique({
                where: {
                    userId_projectId: { userId, projectId },
                },
            });

            if (!member) {
                // This will cause the transaction to roll back
                throw new Error('Forbidden: You are not a member of this project.');
            }

            // 2. Create the core task
            const newTask = await tx.task.create({
                data: {
                    title,
                    description,
                    status,
                    dueDate: dueDate ? new Date(dueDate) : null,
                    projectId,
                },
            });

            // 3. Handle optional at-creation assignments
            if (assignments && assignments.length > 0) {
                // Only OWNER can assign at creation
                const ownerRecord = await tx.userProject.findFirst({
                    where: { userId, projectId, role: 'OWNER' },
                });
                if (!ownerRecord) {
                    throw new Error('Forbidden: Only the project owner can assign users at creation.');
                }

                const assigneeIds = assignments.map((a) => a.userId);

                // Verify all assignees are members of the project
                const assigneeMembers = await tx.userProject.findMany({
                    where: { projectId, userId: { in: assigneeIds } },
                });
                if (assigneeMembers.length !== assigneeIds.length) {
                    throw new Error('Bad Request: One or more assigned users are not members of this project.');
                }

                await Promise.all(
                    assignments.map((a) =>
                        tx.taskAssignment.create({
                            data: ({
                                taskId: newTask.id,
                                userId: a.userId,
                                note: a.note,
                            } as any),
                        })
                    )
                );
            }

            return newTask;
        });

        // Refetch the task with its assignments to return the full object
        const result = await prisma.task.findUnique({
            where: { id: task.id },
            include: {
                assignments: {
                    select: ({
                        user: {
                            select: { id: true, name: true, email: true }
                        },
                        note: true,
                    } as any)
                }
            }
        });

        res.status(201).json(result);
    } catch (error: any) {
        logger.error('Error creating task:', error);
        if (error.message.includes('Forbidden')) {
            return res.status(403).json({ message: error.message });
        }
        if (error.message.includes('Bad Request')) {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ error: 'Internal server error while creating the task.' });
    }
};

export const assignTask = async (req: AuthRequest, res: Response) => {
    const { taskId } = req.params as { taskId: string };
    const { assignments } = req.body as { assignments: Array<{ userId: string; note?: string }> };
    const userId = (req.user as { sub: string }).sub;

    try {
        // Load task and project
        const task = await prisma.task.findUnique({ where: { id: taskId } });
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const projectId = task.projectId;

        // Only OWNER can assign
        const ownerRecord = await prisma.userProject.findFirst({ where: { userId, projectId, role: 'OWNER' } });
        if (!ownerRecord) {
            return res.status(403).json({ message: 'Forbidden: Only the project owner can assign users to tasks.' });
        }

        const assigneeIds = assignments.map((a) => a.userId);
        const assigneeMembers = await prisma.userProject.findMany({ where: { projectId, userId: { in: assigneeIds } } });
        if (assigneeMembers.length !== assigneeIds.length) {
            return res.status(400).json({ message: 'Bad Request: One or more assigned users are not members of this project.' });
        }

        await prisma.$transaction(async (tx) => {
            for (const a of assignments) {
                await tx.taskAssignment.upsert({
                    where: { taskId_userId: { taskId, userId: a.userId } },
                    create: ({ taskId, userId: a.userId, note: a.note } as any),
                    update: ({ note: a.note } as any),
                });
            }
        });

        const updated = await prisma.task.findUnique({
            where: { id: taskId },
            include: {
                assignments: {
                    select: ({
                        user: { select: { id: true, name: true, email: true } },
                        note: true,
                    } as any),
                },
            },
        });

        res.status(200).json(updated);
    } catch (error) {
        logger.error('Error assigning task:', error);
        res.status(500).json({ error: 'Internal server error while assigning the task.' });
    }
};
