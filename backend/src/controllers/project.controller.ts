import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../utils/types';
import logger from '../utils/logger';

export const createProject = async (req: AuthRequest, res: Response) => {
    const { name, description } = req.body;
    const userId = (req.user as { sub: string }).sub;

    if (!userId) {
        return res.status(403).json({ message: 'Forbidden: User ID not found in token' });
    }

    try {
        const newProject = await prisma.$transaction(async (tx) => {
            const project = await tx.project.create({
                data: {
                    name,
                    description,
                },
            });

            await tx.userProject.create({
                data: {
                    userId,
                    projectId: project.id,
                    role: 'OWNER',
                },
            });

            return project;
        });

        res.status(201).json(newProject);
    } catch (error) {
        logger.error('Error creating project:', error);
        res.status(500).json({ error: 'Internal server error while creating project.' });
    }
};

export const getProjectById = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = (req.user as { sub: string }).sub;

    try {
        const project = await prisma.project.findFirst({
            where: {
                id,
                members: {
                    some: {
                        userId,
                    },
                },
            },
        });

        if (!project) {
            return res.status(404).json({ message: 'Project not found or you do not have access' });
        }

        res.json(project);
    } catch (error) {
        logger.error('Error fetching project by ID:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getProjects = async (req: AuthRequest, res: Response) => {
    const userId = (req.user as { sub: string }).sub;

    try {
        const projects = await prisma.project.findMany({
            where: {
                members: {
                    some: {
                        userId,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        res.json(projects);
    } catch (error) {
        logger.error('Error fetching projects:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateProject = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { name, description } = req.body;
    const userId = (req.user as { sub: string }).sub;

    try {
        const project = await prisma.project.findUnique({ where: { id } });

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const userProject = await prisma.userProject.findFirst({
            where: {
                userId,
                projectId: id,
                role: 'OWNER',
            },
        });

        if (!userProject) {
            return res.status(403).json({ message: 'Forbidden: You are not the owner of this project' });
        }

        const updatedProject = await prisma.project.update({
            where: { id },
            data: { name, description },
        });

        res.json(updatedProject);
    } catch (error) {
        logger.error('Error updating project:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteProject = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = (req.user as { sub: string }).sub;

    try {
        const project = await prisma.project.findUnique({ where: { id } });

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const userProject = await prisma.userProject.findFirst({
            where: {
                projectId: id,
                userId,
                role: 'OWNER',
            },
        });

        if (!userProject) {
            return res.status(403).json({ message: 'Forbidden: You are not the owner of this project' });
        }

        await prisma.$transaction(async (tx) => {
            await tx.userProject.deleteMany({
                where: { projectId: id },
            });
            await tx.project.delete({
                where: { id },
            });
        });

        res.status(204).send();
    } catch (error) {
        logger.error('Error deleting project:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
