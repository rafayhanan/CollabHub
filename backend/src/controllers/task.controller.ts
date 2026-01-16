import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../utils/types';
import logger from '../utils/logger';
import { createNotification } from '../utils/notifications';

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

        if (assignments && assignments.length > 0) {
            const project = await prisma.project.findUnique({
                where: { id: projectId },
                select: { name: true },
            });
            const assigneeUsers = await prisma.user.findMany({
                where: { id: { in: assignments.map((a) => a.userId) } },
                select: { id: true, name: true, email: true },
            });

            await Promise.all(
                assigneeUsers.map((assignee) =>
                    createNotification({
                        userId: assignee.id,
                        userEmail: assignee.email,
                        type: 'TASK_ASSIGNED',
                        title: `Task assigned: ${task.title}`,
                        body: `You were assigned to a task in ${project?.name || 'a project'}.`,
                        link: '/dashboard/tasks',
                        sendEmail: true,
                    }).catch((notificationError) => {
                        logger.error('Failed to create task assignment notification:', notificationError);
                    }),
                ),
            );
        }

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

        const project = await prisma.project.findUnique({
            where: { id: task.projectId },
            select: { name: true },
        });

        const assigneeUsers = await prisma.user.findMany({
            where: { id: { in: assignments.map((a) => a.userId) } },
            select: { id: true, name: true, email: true },
        });

        await Promise.all(
            assigneeUsers.map((assignee) =>
                createNotification({
                    userId: assignee.id,
                    userEmail: assignee.email,
                    type: 'TASK_ASSIGNED',
                    title: `Task assigned: ${task.title}`,
                    body: `You were assigned to a task in ${project?.name || 'a project'}.`,
                    link: '/dashboard/tasks',
                    sendEmail: true,
                }).catch((notificationError) => {
                    logger.error('Failed to create task assignment notification:', notificationError);
                }),
            ),
        );

        res.status(200).json(updated);
    } catch (error) {
        logger.error('Error assigning task:', error);
        res.status(500).json({ error: 'Internal server error while assigning the task.' });
    }
};

export const getTasks = async (req: AuthRequest, res: Response) => {
    const { projectId } = req.params;
    const userId = (req.user as { sub: string }).sub;

    try {
        // Check if user is a member of the project
        const member = await prisma.userProject.findUnique({
            where: {
                userId_projectId: { userId, projectId },
            },
        });

        if (!member) {
            return res.status(403).json({ message: 'Forbidden: You are not a member of this project.' });
        }

        const tasks = await prisma.task.findMany({
            where: { projectId },
            include: {
                assignments: {
                    select: {
                        user: {
                            select: { id: true, name: true, email: true }
                        },
                        note: true,
                    }
                }
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        res.json(tasks);
    } catch (error) {
        logger.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Internal server error while fetching tasks.' });
    }
};

export const getTaskById = async (req: AuthRequest, res: Response) => {
    const { taskId } = req.params;
    const userId = (req.user as { sub: string }).sub;

    try {
        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: {
                assignments: {
                    select: {
                        user: {
                            select: { id: true, name: true, email: true }
                        },
                        note: true,
                    }
                },
                project: {
                    select: { id: true, name: true }
                }
            },
        });

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Check if user is a member of the project
        const member = await prisma.userProject.findUnique({
            where: {
                userId_projectId: { userId, projectId: task.projectId },
            },
        });

        if (!member) {
            return res.status(403).json({ message: 'Forbidden: You are not a member of this project.' });
        }

        res.json(task);
    } catch (error) {
        logger.error('Error fetching task by ID:', error);
        res.status(500).json({ error: 'Internal server error while fetching task.' });
    }
};

export const updateTask = async (req: AuthRequest, res: Response) => {
    const { taskId } = req.params;
    const { title, description, status, dueDate } = req.body;
    const userId = (req.user as { sub: string }).sub;

    try {
        const task = await prisma.task.findUnique({ where: { id: taskId } });

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Check if user is a member of the project
        const member = await prisma.userProject.findUnique({
            where: {
                userId_projectId: { userId, projectId: task.projectId },
            },
        });

        if (!member) {
            return res.status(403).json({ message: 'Forbidden: You are not a member of this project.' });
        }

        const updateData: any = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (status !== undefined) updateData.status = status;
        if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;

        const updatedTask = await prisma.task.update({
            where: { id: taskId },
            data: updateData,
            include: {
                assignments: {
                    select: {
                        user: {
                            select: { id: true, name: true, email: true }
                        },
                        note: true,
                    }
                }
            },
        });

        res.json(updatedTask);
    } catch (error) {
        logger.error('Error updating task:', error);
        res.status(500).json({ error: 'Internal server error while updating task.' });
    }
};

export const deleteTask = async (req: AuthRequest, res: Response) => {
    const { taskId } = req.params;
    const userId = (req.user as { sub: string }).sub;

    try {
        const task = await prisma.task.findUnique({ where: { id: taskId } });

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Only project owner can delete tasks
        const ownerRecord = await prisma.userProject.findFirst({
            where: {
                userId,
                projectId: task.projectId,
                role: 'OWNER',
            },
        });

        if (!ownerRecord) {
            return res.status(403).json({ message: 'Forbidden: Only the project owner can delete tasks.' });
        }

        // Check if task still exists before deletion (in case of concurrent operations)
        const taskExists = await prisma.task.findUnique({ where: { id: taskId } });
        if (!taskExists) {
            return res.status(404).json({ message: 'Task not found' });
        }

        await prisma.task.delete({
            where: { id: taskId },
        });

        res.status(204).send();
    } catch (error) {
        logger.error('Error deleting task:', error);
        res.status(500).json({ error: 'Internal server error while deleting task.' });
    }
};

export const getUserTasks = async (req: AuthRequest, res: Response) => {
    const userId = (req.user as { sub: string }).sub;

    try {
        const tasks = await prisma.task.findMany({
            where: {
                assignments: {
                    some: {
                        userId,
                    },
                },
            },
            include: {
                project: {
                    select: { id: true, name: true }
                },
                assignments: {
                    where: { userId },
                    select: {
                        note: true,
                        assignedAt: true,
                    }
                }
            },
            orderBy: {
                dueDate: 'asc',
            },
        });

        res.json(tasks);
    } catch (error) {
        logger.error('Error fetching user tasks:', error);
        res.status(500).json({ error: 'Internal server error while fetching user tasks.' });
    }
};

export const unassignTask = async (req: AuthRequest, res: Response) => {
    const { taskId, userId: targetUserId } = req.params;
    const userId = (req.user as { sub: string }).sub;

    try {
        const task = await prisma.task.findUnique({ where: { id: taskId } });

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Only project owner can unassign users
        const ownerRecord = await prisma.userProject.findFirst({
            where: {
                userId,
                projectId: task.projectId,
                role: 'OWNER',
            },
        });

        if (!ownerRecord) {
            return res.status(403).json({ message: 'Forbidden: Only the project owner can unassign users from tasks.' });
        }

        // Check if the assignment exists
        const assignment = await prisma.taskAssignment.findUnique({
            where: {
                taskId_userId: { taskId, userId: targetUserId },
            },
        });

        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        await prisma.taskAssignment.delete({
            where: {
                taskId_userId: { taskId, userId: targetUserId },
            },
        });

        res.json({ message: 'User unassigned from task successfully' });
    } catch (error) {
        logger.error('Error unassigning task:', error);
        res.status(500).json({ error: 'Internal server error while unassigning task.' });
    }
};
