import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export async function resetDatabase() {
    // More selective cleanup to avoid deadlocks
    try {
        await prisma.$transaction(async (tx) => {
            // Delete in correct order to respect foreign key constraints
            await tx.taskAssignment.deleteMany({});
            await tx.task.deleteMany({});
            await tx.invitation.deleteMany({});
            await tx.userProject.deleteMany({});
            await tx.project.deleteMany({});
            await tx.refreshToken.deleteMany({});
            await tx.user.deleteMany({});
        }, {
            maxWait: 10000, // 10 seconds
            timeout: 15000, // 15 seconds
        });
    } catch (error) {
        console.error('Database reset failed:', error);
        // Fallback: try individual deletions
        try {
            await prisma.taskAssignment.deleteMany({});
            await prisma.task.deleteMany({});
            await prisma.invitation.deleteMany({});
            await prisma.userProject.deleteMany({});
            await prisma.project.deleteMany({});
            await prisma.refreshToken.deleteMany({});
            await prisma.user.deleteMany({});
        } catch (fallbackError) {
            console.error('Fallback database reset also failed:', fallbackError);
        }
    }
}

export async function closeDatabase() {
    await prisma.$disconnect();
}


