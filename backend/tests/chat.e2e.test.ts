import request from 'supertest';
import app from '../src/app';
import { resetDatabase, prisma } from './utils';

async function registerAndLogin(email: string) {
    const password = 'StrongP@ssw0rd!';
    await request(app).post('/api/auth/register').send({ email, password }).expect(201);
    const login = await request(app).post('/api/auth/login').send({ email, password }).expect(200);
    return { token: login.body.accessToken as string, userId: login.body.user.id as string };
}

async function createProjectWithMembers() {
    try {
        console.log('Creating project with members...');
        const setupStart = Date.now();
        
        // Create owner and project
        const owner = await registerAndLogin('owner@example.com');
        console.log(`Owner created: ${Date.now() - setupStart}ms`);
        
        const project = await request(app)
            .post('/api/projects')
            .set('Authorization', `Bearer ${owner.token}`)
            .send({ name: 'Test Project', description: 'Chat test project' })
            .expect(201);
        console.log(`Project created: ${Date.now() - setupStart}ms`);

        // Create and invite member
        const member = await registerAndLogin('member@example.com');
        console.log(`Member created: ${Date.now() - setupStart}ms`);
        
        await request(app)
            .post(`/api/projects/${project.body.id}/invitations`)
            .set('Authorization', `Bearer ${owner.token}`)
            .send({ email: 'member@example.com' })
            .expect(201);
        console.log(`Invitation sent: ${Date.now() - setupStart}ms`);

        // Find the invitation and accept it
        const invitation = await prisma.invitation.findFirst({
            where: { 
                projectId: project.body.id 
            },
            orderBy: { createdAt: 'desc' }
        });

        if (!invitation) {
            throw new Error('Invitation not found');
        }

        await request(app)
            .post(`/api/invitations/${invitation.id}/accept`)
            .set('Authorization', `Bearer ${member.token}`)
            .expect(200);
        console.log(`Invitation accepted: ${Date.now() - setupStart}ms`);

        // Create a task for task-specific channels
        const task = await request(app)
            .post(`/api/projects/${project.body.id}/tasks`)
            .set('Authorization', `Bearer ${owner.token}`)
            .send({ title: 'Test Task', description: 'For chat testing' })
            .expect(201);
        console.log(`Task created: ${Date.now() - setupStart}ms`);

        // Small delay to ensure all operations are complete
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log(`Setup completed: ${Date.now() - setupStart}ms`);

        return { owner, member, project: project.body, task: task.body };
    } catch (error) {
        console.error('Error in createProjectWithMembers:', error);
        throw error;
    }
}

describe('Chat API', () => {
    beforeEach(async () => {
        await resetDatabase();
        // Extra delay to ensure database is completely clean
        await new Promise(resolve => setTimeout(resolve, 300));
    });

    describe('Channel Management', () => {
        it('should create a project general channel', async () => {
            const { owner, project } = await createProjectWithMembers();

            const channel = await request(app)
                .post('/api/channels')
                .set('Authorization', `Bearer ${owner.token}`)
                .send({
                    name: 'General Discussion',
                    type: 'PROJECT_GENERAL',
                    description: 'Main project channel',
                    projectId: project.id
                })
                .expect(201);

            expect(channel.body).toMatchObject({
                name: 'General Discussion',
                type: 'PROJECT_GENERAL',
                description: 'Main project channel',
                projectId: project.id
            });
            expect(channel.body.members).toHaveLength(1);
            expect(channel.body.members[0].role).toBe('ADMIN');
            expect(channel.body.members[0].userId).toBe(owner.userId);
        });

        it('should create a task-specific channel', async () => {
            const { owner, project, task } = await createProjectWithMembers();

            const channel = await request(app)
                .post('/api/channels')
                .set('Authorization', `Bearer ${owner.token}`)
                .send({
                    name: 'Task Discussion',
                    type: 'TASK_SPECIFIC',
                    projectId: project.id,
                    taskId: task.id
                })
                .expect(201);

            expect(channel.body).toMatchObject({
                name: 'Task Discussion',
                type: 'TASK_SPECIFIC',
                projectId: project.id,
                taskId: task.id
            });
            expect(channel.body.task).toMatchObject({
                id: task.id,
                title: 'Test Task'
            });
        });

        it('should reject channel creation without required fields', async () => {
            const { owner } = await createProjectWithMembers();

            // Missing projectId for project channel
            await request(app)
                .post('/api/channels')
                .set('Authorization', `Bearer ${owner.token}`)
                .send({
                    name: 'Invalid Channel',
                    type: 'PROJECT_GENERAL'
                })
                .expect(400);

            // Missing taskId for task channel
            await request(app)
                .post('/api/channels')
                .set('Authorization', `Bearer ${owner.token}`)
                .send({
                    name: 'Invalid Task Channel',
                    type: 'TASK_SPECIFIC',
                    projectId: 'some-project-id'
                })
                .expect(400);
        });

        it('should reject channel creation for non-project members', async () => {
            const { project } = await createProjectWithMembers();
            const outsider = await registerAndLogin('outsider@example.com');

            await request(app)
                .post('/api/channels')
                .set('Authorization', `Bearer ${outsider.token}`)
                .send({
                    name: 'Unauthorized Channel',
                    type: 'PROJECT_GENERAL',
                    projectId: project.id
                })
                .expect(403);
        });

        it('should get project channels for members only', async () => {
            const { owner, member, project } = await createProjectWithMembers();

            // Create a channel
            const channel = await request(app)
                .post('/api/channels')
                .set('Authorization', `Bearer ${owner.token}`)
                .send({
                    name: 'Team Chat',
                    type: 'PROJECT_GENERAL',
                    projectId: project.id
                })
                .expect(201);

            // Add member to channel
            await request(app)
                .post(`/api/channels/${channel.body.id}/members`)
                .set('Authorization', `Bearer ${owner.token}`)
                .send({ userId: member.userId })
                .expect(201);

            // Member can see channels
            const response = await request(app)
                .get(`/api/channels/project/${project.id}`)
                .set('Authorization', `Bearer ${member.token}`)
                .expect(200);

            expect(response.body).toHaveLength(1);
            expect(response.body[0].name).toBe('Team Chat');

            // Outsider cannot see channels
            const outsider = await registerAndLogin('outsider@example.com');
            await request(app)
                .get(`/api/channels/project/${project.id}`)
                .set('Authorization', `Bearer ${outsider.token}`)
                .expect(403);
        });

        it('should get channel details with member validation', async () => {
            const { owner, member, project } = await createProjectWithMembers();

            const channel = await request(app)
                .post('/api/channels')
                .set('Authorization', `Bearer ${owner.token}`)
                .send({
                    name: 'Private Channel',
                    type: 'PROJECT_GENERAL',
                    projectId: project.id
                })
                .expect(201);

            // Owner can see channel details
            const ownerView = await request(app)
                .get(`/api/channels/${channel.body.id}`)
                .set('Authorization', `Bearer ${owner.token}`)
                .expect(200);

            expect(ownerView.body.name).toBe('Private Channel');

            // Member not in channel cannot see details
            await request(app)
                .get(`/api/channels/${channel.body.id}`)
                .set('Authorization', `Bearer ${member.token}`)
                .expect(404);
        });
    });

    describe('Channel Membership', () => {
        it('should allow channel admin to add members', async () => {
            const { owner, member, project } = await createProjectWithMembers();

            const channel = await request(app)
                .post('/api/channels')
                .set('Authorization', `Bearer ${owner.token}`)
                .send({
                    name: 'Team Channel',
                    type: 'PROJECT_GENERAL',
                    projectId: project.id
                })
                .expect(201);

            // Add member to channel
            const memberAdd = await request(app)
                .post(`/api/channels/${channel.body.id}/members`)
                .set('Authorization', `Bearer ${owner.token}`)
                .send({ userId: member.userId, role: 'MEMBER' })
                .expect(201);

            expect(memberAdd.body).toMatchObject({
                channelId: channel.body.id,
                userId: member.userId,
                role: 'MEMBER'
            });
            expect(memberAdd.body.user.email).toBe('member@example.com');
        });

        it('should reject member addition by non-admins', async () => {
            const { owner, member, project } = await createProjectWithMembers();
            const anotherMember = await registerAndLogin('another@example.com');

            const channel = await request(app)
                .post('/api/channels')
                .set('Authorization', `Bearer ${owner.token}`)
                .send({
                    name: 'Restricted Channel',
                    type: 'PROJECT_GENERAL',
                    projectId: project.id
                })
                .expect(201);

            // Add first member as regular member
            await request(app)
                .post(`/api/channels/${channel.body.id}/members`)
                .set('Authorization', `Bearer ${owner.token}`)
                .send({ userId: member.userId })
                .expect(201);

            // Regular member cannot add others
            await request(app)
                .post(`/api/channels/${channel.body.id}/members`)
                .set('Authorization', `Bearer ${member.token}`)
                .send({ userId: anotherMember.userId })
                .expect(403);
        });

        it('should reject adding non-project members to project channels', async () => {
            const { owner, project } = await createProjectWithMembers();
            const outsider = await registerAndLogin('outsider@example.com');

            const channel = await request(app)
                .post('/api/channels')
                .set('Authorization', `Bearer ${owner.token}`)
                .send({
                    name: 'Project Only',
                    type: 'PROJECT_GENERAL',
                    projectId: project.id
                })
                .expect(201);

            await request(app)
                .post(`/api/channels/${channel.body.id}/members`)
                .set('Authorization', `Bearer ${owner.token}`)
                .send({ userId: outsider.userId })
                .expect(403);
        });
    });

    describe('Messaging', () => {
        it('should allow channel members to send and receive messages', async () => {
            const { owner, member, project } = await createProjectWithMembers();

            // Create channel and add member
            const channel = await request(app)
                .post('/api/channels')
                .set('Authorization', `Bearer ${owner.token}`)
                .send({
                    name: 'Chat Room',
                    type: 'PROJECT_GENERAL',
                    projectId: project.id
                })
                .expect(201);

            await request(app)
                .post(`/api/channels/${channel.body.id}/members`)
                .set('Authorization', `Bearer ${owner.token}`)
                .send({ userId: member.userId })
                .expect(201);

            // Send message as owner
            const message1 = await request(app)
                .post(`/api/channels/${channel.body.id}/messages`)
                .set('Authorization', `Bearer ${owner.token}`)
                .send({ content: 'Hello team!' })
                .expect(201);

            expect(message1.body).toMatchObject({
                content: 'Hello team!',
                channelId: channel.body.id,
                authorId: owner.userId
            });
            expect(message1.body.author.email).toBe('owner@example.com');

            // Send message as member
            await request(app)
                .post(`/api/channels/${channel.body.id}/messages`)
                .set('Authorization', `Bearer ${member.token}`)
                .send({ content: 'Hi everyone!' })
                .expect(201);

            // Get messages
            const messages = await request(app)
                .get(`/api/channels/${channel.body.id}/messages`)
                .set('Authorization', `Bearer ${member.token}`)
                .expect(200);

            expect(messages.body).toHaveLength(2);
            expect(messages.body[0].content).toBe('Hello team!');
            expect(messages.body[1].content).toBe('Hi everyone!');
        });

        it('should reject messages from non-members', async () => {
            const { owner, project } = await createProjectWithMembers();
            const outsider = await registerAndLogin('outsider@example.com');

            const channel = await request(app)
                .post('/api/channels')
                .set('Authorization', `Bearer ${owner.token}`)
                .send({
                    name: 'Private Chat',
                    type: 'PROJECT_GENERAL',
                    projectId: project.id
                })
                .expect(201);

            await request(app)
                .post(`/api/channels/${channel.body.id}/messages`)
                .set('Authorization', `Bearer ${outsider.token}`)
                .send({ content: 'Unauthorized message' })
                .expect(403);
        });

        it('should allow message updates by author only', async () => {
            const { owner, member, project } = await createProjectWithMembers();

            const channel = await request(app)
                .post('/api/channels')
                .set('Authorization', `Bearer ${owner.token}`)
                .send({
                    name: 'Edit Test',
                    type: 'PROJECT_GENERAL',
                    projectId: project.id
                })
                .expect(201);

            await request(app)
                .post(`/api/channels/${channel.body.id}/members`)
                .set('Authorization', `Bearer ${owner.token}`)
                .send({ userId: member.userId })
                .expect(201);

            // Send message
            const message = await request(app)
                .post(`/api/channels/${channel.body.id}/messages`)
                .set('Authorization', `Bearer ${owner.token}`)
                .send({ content: 'Original message' })
                .expect(201);

            // Author can edit
            const updated = await request(app)
                .put(`/api/channels/messages/${message.body.id}`)
                .set('Authorization', `Bearer ${owner.token}`)
                .send({ content: 'Updated message' })
                .expect(200);

            expect(updated.body.content).toBe('Updated message');

            // Non-author cannot edit
            await request(app)
                .put(`/api/channels/messages/${message.body.id}`)
                .set('Authorization', `Bearer ${member.token}`)
                .send({ content: 'Unauthorized edit' })
                .expect(404);
        });

        it('should allow message deletion by author or channel admin', async () => {
            const { owner, member, project } = await createProjectWithMembers();

            const channel = await request(app)
                .post('/api/channels')
                .set('Authorization', `Bearer ${owner.token}`)
                .send({
                    name: 'Delete Test',
                    type: 'PROJECT_GENERAL',
                    projectId: project.id
                })
                .expect(201);

            await request(app)
                .post(`/api/channels/${channel.body.id}/members`)
                .set('Authorization', `Bearer ${owner.token}`)
                .send({ userId: member.userId })
                .expect(201);

            // Member sends message
            const memberMessage = await request(app)
                .post(`/api/channels/${channel.body.id}/messages`)
                .set('Authorization', `Bearer ${member.token}`)
                .send({ content: 'Member message' })
                .expect(201);

            // Owner sends message
            const ownerMessage = await request(app)
                .post(`/api/channels/${channel.body.id}/messages`)
                .set('Authorization', `Bearer ${owner.token}`)
                .send({ content: 'Owner message' })
                .expect(201);

            // Member can delete own message
            await request(app)
                .delete(`/api/channels/messages/${memberMessage.body.id}`)
                .set('Authorization', `Bearer ${member.token}`)
                .expect(204);

            // Channel admin (owner) can delete any message
            await request(app)
                .delete(`/api/channels/messages/${ownerMessage.body.id}`)
                .set('Authorization', `Bearer ${owner.token}`)
                .expect(204);

            // Verify messages are deleted
            const messages = await request(app)
                .get(`/api/channels/${channel.body.id}/messages`)
                .set('Authorization', `Bearer ${owner.token}`)
                .expect(200);

            expect(messages.body).toHaveLength(0);
        });

        it('should handle message pagination correctly', async () => {
            console.log('Starting pagination test...');
            const start = Date.now();
            
            const { owner, project } = await createProjectWithMembers();
            console.log(`Project setup took: ${Date.now() - start}ms`);

            const channelStart = Date.now();
            const channel = await request(app)
                .post('/api/channels')
                .set('Authorization', `Bearer ${owner.token}`)
                .send({
                    name: 'Pagination Test',
                    type: 'PROJECT_GENERAL',
                    projectId: project.id
                })
                .expect(201);
            console.log(`Channel creation took: ${Date.now() - channelStart}ms`);

            // Send multiple messages with timing
            const messageStart = Date.now();
            for (let i = 1; i <= 5; i++) {
                await request(app)
                    .post(`/api/channels/${channel.body.id}/messages`)
                    .set('Authorization', `Bearer ${owner.token}`)
                    .send({ content: `Message ${i}` })
                    .expect(201);
            }
            console.log(`Message creation took: ${Date.now() - messageStart}ms`);

            // Test pagination
            const paginationStart = Date.now();
            const page1 = await request(app)
                .get(`/api/channels/${channel.body.id}/messages?limit=3&offset=0`)
                .set('Authorization', `Bearer ${owner.token}`)
                .expect(200);

            const page2 = await request(app)
                .get(`/api/channels/${channel.body.id}/messages?limit=3&offset=3`)
                .set('Authorization', `Bearer ${owner.token}`)
                .expect(200);
            console.log(`Pagination queries took: ${Date.now() - paginationStart}ms`);

            expect(page1.body).toHaveLength(3);
            expect(page2.body).toHaveLength(2);
            expect(page1.body[0].content).toBe('Message 1');
            expect(page2.body[0].content).toBe('Message 4');
            
            console.log(`Total test time: ${Date.now() - start}ms`);
        });
    });

    describe('Input Validation', () => {
        it('should reject invalid channel data', async () => {
            const { owner } = await createProjectWithMembers();

            // Empty name
            await request(app)
                .post('/api/channels')
                .set('Authorization', `Bearer ${owner.token}`)
                .send({
                    name: '',
                    type: 'PROJECT_GENERAL'
                })
                .expect(400);

            // Invalid type
            await request(app)
                .post('/api/channels')
                .set('Authorization', `Bearer ${owner.token}`)
                .send({
                    name: 'Test',
                    type: 'INVALID_TYPE'
                })
                .expect(400);

            // Invalid UUID
            await request(app)
                .post('/api/channels')
                .set('Authorization', `Bearer ${owner.token}`)
                .send({
                    name: 'Test',
                    type: 'PROJECT_GENERAL',
                    projectId: 'not-a-uuid'
                })
                .expect(400);
        });

        it('should reject invalid message data', async () => {
            const { owner, project } = await createProjectWithMembers();

            const channel = await request(app)
                .post('/api/channels')
                .set('Authorization', `Bearer ${owner.token}`)
                .send({
                    name: 'Validation Test',
                    type: 'PROJECT_GENERAL',
                    projectId: project.id
                })
                .expect(201);

            // Empty content
            await request(app)
                .post(`/api/channels/${channel.body.id}/messages`)
                .set('Authorization', `Bearer ${owner.token}`)
                .send({ content: '' })
                .expect(400);

            // Too long content
            const longContent = 'x'.repeat(2001);
            await request(app)
                .post(`/api/channels/${channel.body.id}/messages`)
                .set('Authorization', `Bearer ${owner.token}`)
                .send({ content: longContent })
                .expect(400);
        });
    });

    describe('Authorization Edge Cases', () => {
        it('should handle unauthenticated requests', async () => {
            await request(app)
                .post('/api/channels')
                .send({ name: 'Test', type: 'PROJECT_GENERAL' })
                .expect(401);

            await request(app)
                .get('/api/channels/project/123')
                .expect(401);
        });

        it('should handle non-existent resources', async () => {
            const { owner } = await createProjectWithMembers();

            // Non-existent project
            await request(app)
                .get('/api/channels/project/550e8400-e29b-41d4-a716-446655440000')
                .set('Authorization', `Bearer ${owner.token}`)
                .expect(403);

            // Non-existent channel
            await request(app)
                .get('/api/channels/550e8400-e29b-41d4-a716-446655440000')
                .set('Authorization', `Bearer ${owner.token}`)
                .expect(404);

            // Non-existent message
            await request(app)
                .put('/api/channels/messages/550e8400-e29b-41d4-a716-446655440000')
                .set('Authorization', `Bearer ${owner.token}`)
                .send({ content: 'Test' })
                .expect(404);
        });
    });
});
