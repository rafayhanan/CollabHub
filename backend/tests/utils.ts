import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export async function resetDatabase() {
    // Use raw SQL for more reliable cleanup - avoids foreign key issues
    try {
        await prisma.$executeRaw`TRUNCATE TABLE "Message", "ChannelMember", "Channel", "TaskAssignment", "Task", "Invitation", "UserProject", "Project", "RefreshToken", "User" RESTART IDENTITY CASCADE`;
        
        // Small delay to ensure cleanup is complete
        await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
        console.error('TRUNCATE failed, falling back to DELETE:', error);
        // Fallback to individual deletes with proper order
        try {
            await prisma.$transaction(async (tx) => {
                // Delete in dependency order
                await tx.message.deleteMany({});
                await tx.channelMember.deleteMany({});
                await tx.channel.deleteMany({});
                await tx.taskAssignment.deleteMany({});
                await tx.task.deleteMany({});
                await tx.invitation.deleteMany({});
                await tx.userProject.deleteMany({});
                await tx.project.deleteMany({});
                await tx.refreshToken.deleteMany({});
                await tx.user.deleteMany({});
            }, {
                maxWait: 30000,
                timeout: 45000,
            });
            
            await new Promise(resolve => setTimeout(resolve, 300));
        } catch (fallbackError) {
            console.error('Fallback database reset also failed:', fallbackError);
            throw fallbackError;
        }
    }
}

export async function closeDatabase() {
    await prisma.$disconnect();
}


