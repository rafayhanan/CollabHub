import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../utils/types';
import logger from '../utils/logger';

export const getInvitations = async (req: AuthRequest, res: Response) => {
    const userId = (req.user as { sub: string }).sub;

    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const invitations = await prisma.invitation.findMany({
            where: {
                invitedUserEmail: user.email,
                status: 'PENDING',
            },
            include: {
                project: {
                    select: {
                        name: true,
                    },
                },
                invitedBy: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        res.json(invitations);
    } catch (error) {
        logger.error('Error fetching invitations:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


export const sendInvitation = async (req: AuthRequest, res: Response) => {
    const { projectId } = req.params;
    const { email: invitedUserEmail } = req.body;
    const invitedById = (req.user as { sub: string }).sub;

    try {
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const invitingUser = await prisma.userProject.findUnique({
            where: {
                userId_projectId: {
                    userId: invitedById,
                    projectId,
                },
                role: 'OWNER',
            },
        });

        if (!invitingUser) {
            return res.status(403).json({ message: 'Forbidden: Only project owners can send invitations' });
        }

        // Check for existing pending invitations
        const existingInvitation = await prisma.invitation.findFirst({
            where: {
                projectId,
                invitedUserEmail,
                status: 'PENDING',
            },
        });

        if (existingInvitation) {
            return res.status(409).json({
                message: 'An invitation for this user to this project already exists'
            });
        }

        const invitedUser = await prisma.user.findUnique({ where: { email: invitedUserEmail } });
        if (invitedUser) {
            const isAlreadyMember = await prisma.userProject.findUnique({
                where: {
                    userId_projectId: {
                        userId: invitedUser.id,
                        projectId,
                    },
                },
            });

            if (isAlreadyMember) {
                return res.status(409).json({ message: 'User is already a member of this project' });
            }
        }

        const invitation = await prisma.invitation.create({
            data: {
                projectId,
                invitedById,
                invitedUserEmail,
            },
        });

        res.status(201).json(invitation);
    } catch (error) {
        logger.error('Error sending invitation:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const acceptInvitation = async (req: AuthRequest, res: Response) => {
    const { invitationId } = req.params;
    const userId = (req.user as { sub: string }).sub;

    try {
        const invitation = await prisma.invitation.findFirst({ where: { id: invitationId, status: 'PENDING' } });

        if (!invitation) {
            return res.status(404).json({ message: 'Invitation not found or not pending' });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.email !== invitation.invitedUserEmail) {
            return res.status(403).json({ message: 'Forbidden: This invitation is not for you' });
        }

        await prisma.$transaction(async (tx) => {
            await tx.invitation.update({
                where: { id: invitationId },
                data: { status: 'ACCEPTED' },
            });

            await tx.userProject.create({
                data: {
                    userId,
                    projectId: invitation.projectId,
                    role: 'MEMBER',
                },
            });
        });

        res.json({ message: 'Invitation accepted successfully' });
    } catch (error) {
        logger.error('Error accepting invitation:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const declineInvitation = async (req: AuthRequest, res: Response) => {
    const { invitationId } = req.params;
    const userId = (req.user as { sub: string }).sub;

    try {
        const invitation = await prisma.invitation.findUnique({ where: { id: invitationId } });

        if (!invitation || invitation.status !== 'PENDING') {
            return res.status(404).json({ message: 'Invitation not found or already handled' });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.email !== invitation.invitedUserEmail) {
            return res.status(403).json({ message: 'Forbidden: This invitation is not for you' });
        }

        await prisma.invitation.update({
            where: { id: invitationId },
            data: { status: 'DECLINED' },
        });

        res.json({ message: 'Invitation declined successfully' });
    } catch (error) {
        logger.error('Error declining invitation:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
