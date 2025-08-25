import request from 'supertest';
import app from '../src/app';
import { resetDatabase, prisma } from './utils';

async function registerAndLogin(email: string) {
    const password = 'StrongP@ssw0rd!';
    await request(app).post('/api/auth/register').send({ email, password }).expect(201);
    const login = await request(app).post('/api/auth/login').send({ email, password }).expect(200);
    return { token: login.body.accessToken as string };
}

describe('Tasks API', () => {
    beforeEach(async () => {
        await resetDatabase();
    });

    it('allows member to create task without assignments; owner can assign later', async () => {
        // Owner setup
        const owner = await registerAndLogin('owner@example.com');
        const project = await request(app)
            .post('/api/projects')
            .set('Authorization', `Bearer ${owner.token}`)
            .send({ name: 'P1' })
            .expect(201);

        // Invite member
        const memberUser = await registerAndLogin('member@example.com');
        await request(app)
            .post(`/api/projects/${project.body.id}/invitations`)
            .set('Authorization', `Bearer ${owner.token}`)
            .send({ email: 'member@example.com' })
            .expect(201);

        const invitation = await prisma.invitation.findFirstOrThrow();
        await request(app)
            .post(`/api/invitations/${invitation.id}/accept`)
            .set('Authorization', `Bearer ${memberUser.token}`)
            .expect(200);

        // Member creates task
        const task = await request(app)
            .post(`/api/projects/${project.body.id}/tasks`)
            .set('Authorization', `Bearer ${memberUser.token}`)
            .send({ title: 'T1' })
            .expect(201);

        // Owner assigns later
        const assignment = await request(app)
            .post(`/api/tasks/${task.body.id}/assign`)
            .set('Authorization', `Bearer ${owner.token}`)
            .send({ assignments: [{ userId: (await prisma.user.findFirstOrThrow({ where: { email: 'member@example.com' } })).id, note: 'Do it' }] })
            .expect(200);

        expect(assignment.body.assignments.length).toBe(1);
        expect(assignment.body.assignments[0].note).toBe('Do it');
    }, 30000);

    it('should get all tasks for a project', async () => {
        // Setup owner and project
        const owner = await registerAndLogin('owner@example.com');
        const project = await request(app)
            .post('/api/projects')
            .set('Authorization', `Bearer ${owner.token}`)
            .send({ name: 'Test Project' })
            .expect(201);

        // Create multiple tasks
        await request(app)
            .post(`/api/projects/${project.body.id}/tasks`)
            .set('Authorization', `Bearer ${owner.token}`)
            .send({ title: 'Task 1', description: 'First task' })
            .expect(201);

        await request(app)
            .post(`/api/projects/${project.body.id}/tasks`)
            .set('Authorization', `Bearer ${owner.token}`)
            .send({ title: 'Task 2', status: 'IN_PROGRESS' })
            .expect(201);

        // Get all tasks
        const response = await request(app)
            .get(`/api/projects/${project.body.id}/tasks`)
            .set('Authorization', `Bearer ${owner.token}`)
            .expect(200);

        expect(response.body).toHaveLength(2);
        expect(response.body[0].title).toBe('Task 2'); // Most recent first
        expect(response.body[1].title).toBe('Task 1');
    });

    it('should get a specific task by ID', async () => {
        // Setup
        const owner = await registerAndLogin('owner@example.com');
        const project = await request(app)
            .post('/api/projects')
            .set('Authorization', `Bearer ${owner.token}`)
            .send({ name: 'Test Project' })
            .expect(201);

        const task = await request(app)
            .post(`/api/projects/${project.body.id}/tasks`)
            .set('Authorization', `Bearer ${owner.token}`)
            .send({ 
                title: 'Specific Task', 
                description: 'Task description',
                status: 'IN_PROGRESS',
                dueDate: '2024-12-31T23:59:59.000Z'
            })
            .expect(201);

        // Get task by ID
        const response = await request(app)
            .get(`/api/tasks/${task.body.id}`)
            .set('Authorization', `Bearer ${owner.token}`)
            .expect(200);

        expect(response.body.id).toBe(task.body.id);
        expect(response.body.title).toBe('Specific Task');
        expect(response.body.description).toBe('Task description');
        expect(response.body.status).toBe('IN_PROGRESS');
        expect(response.body.project.name).toBe('Test Project');
    });

    it('should update a task', async () => {
        // Setup
        const owner = await registerAndLogin('owner@example.com');
        const project = await request(app)
            .post('/api/projects')
            .set('Authorization', `Bearer ${owner.token}`)
            .send({ name: 'Test Project' })
            .expect(201);

        const task = await request(app)
            .post(`/api/projects/${project.body.id}/tasks`)
            .set('Authorization', `Bearer ${owner.token}`)
            .send({ title: 'Original Title', status: 'TODO' })
            .expect(201);

        // Update task
        const response = await request(app)
            .put(`/api/tasks/${task.body.id}`)
            .set('Authorization', `Bearer ${owner.token}`)
            .send({ 
                title: 'Updated Title',
                description: 'Updated description',
                status: 'DONE',
                dueDate: '2024-12-31T23:59:59.000Z'
            })
            .expect(200);

        expect(response.body.title).toBe('Updated Title');
        expect(response.body.description).toBe('Updated description');
        expect(response.body.status).toBe('DONE');
        expect(response.body.dueDate).toBe('2024-12-31T23:59:59.000Z');
    });

    it('should delete a task (owner only)', async () => {
        // Setup owner and member
        const owner = await registerAndLogin('owner@example.com');
        const member = await registerAndLogin('member@example.com');
        
        const project = await request(app)
            .post('/api/projects')
            .set('Authorization', `Bearer ${owner.token}`)
            .send({ name: 'Test Project' })
            .expect(201);

        // Invite and accept member
        await request(app)
            .post(`/api/projects/${project.body.id}/invitations`)
            .set('Authorization', `Bearer ${owner.token}`)
            .send({ email: 'member@example.com' })
            .expect(201);

        const invitation = await prisma.invitation.findFirstOrThrow();
        await request(app)
            .post(`/api/invitations/${invitation.id}/accept`)
            .set('Authorization', `Bearer ${member.token}`)
            .expect(200);

        const task = await request(app)
            .post(`/api/projects/${project.body.id}/tasks`)
            .set('Authorization', `Bearer ${owner.token}`)
            .send({ title: 'Task to Delete' })
            .expect(201);

        // Member should not be able to delete
        await request(app)
            .delete(`/api/tasks/${task.body.id}`)
            .set('Authorization', `Bearer ${member.token}`)
            .expect(403);

        // Owner should be able to delete
        await request(app)
            .delete(`/api/tasks/${task.body.id}`)
            .set('Authorization', `Bearer ${owner.token}`)
            .expect(204);

        // Verify task is deleted
        await request(app)
            .get(`/api/tasks/${task.body.id}`)
            .set('Authorization', `Bearer ${owner.token}`)
            .expect(404);
    }, 30000); // Increased timeout

    it('should get user assigned tasks', async () => {
        // Simplified setup with just one project
        const owner = await registerAndLogin('owner@example.com');
        const member = await registerAndLogin('member@example.com');
        
        const project = await request(app)
            .post('/api/projects')
            .set('Authorization', `Bearer ${owner.token}`)
            .send({ name: 'Test Project' })
            .expect(201);

        // Invite member to project
        await request(app)
            .post(`/api/projects/${project.body.id}/invitations`)
            .set('Authorization', `Bearer ${owner.token}`)
            .send({ email: 'member@example.com' })
            .expect(201);

        const invitation = await prisma.invitation.findFirstOrThrow();
        await request(app)
            .post(`/api/invitations/${invitation.id}/accept`)
            .set('Authorization', `Bearer ${member.token}`)
            .expect(200);

        const memberUser = await prisma.user.findFirstOrThrow({ where: { email: 'member@example.com' } });

        // Create one assigned task and one unassigned task
        await request(app)
            .post(`/api/projects/${project.body.id}/tasks`)
            .set('Authorization', `Bearer ${owner.token}`)
            .send({ 
                title: 'Assigned Task',
                dueDate: '2024-12-31T23:59:59.000Z',
                assignments: [{ userId: memberUser.id, note: 'High priority' }]
            })
            .expect(201);

        await request(app)
            .post(`/api/projects/${project.body.id}/tasks`)
            .set('Authorization', `Bearer ${owner.token}`)
            .send({ title: 'Unassigned Task' })
            .expect(201);

        // Get member's assigned tasks
        const response = await request(app)
            .get('/api/users/me/tasks')
            .set('Authorization', `Bearer ${member.token}`)
            .expect(200);

        expect(response.body).toHaveLength(1);
        expect(response.body[0].title).toBe('Assigned Task');
        expect(response.body[0].project.name).toBe('Test Project');
        expect(response.body[0].assignments[0].note).toBe('High priority');
    }, 45000); // Increased timeout to 45s

    it('should unassign user from task (owner only)', async () => {
        // Setup
        const owner = await registerAndLogin('owner@example.com');
        const member = await registerAndLogin('member@example.com');
        
        const project = await request(app)
            .post('/api/projects')
            .set('Authorization', `Bearer ${owner.token}`)
            .send({ name: 'Test Project' })
            .expect(201);

        // Invite and accept member
        await request(app)
            .post(`/api/projects/${project.body.id}/invitations`)
            .set('Authorization', `Bearer ${owner.token}`)
            .send({ email: 'member@example.com' })
            .expect(201);

        const invitation = await prisma.invitation.findFirstOrThrow();
        await request(app)
            .post(`/api/invitations/${invitation.id}/accept`)
            .set('Authorization', `Bearer ${member.token}`)
            .expect(200);

        const memberUser = await prisma.user.findFirstOrThrow({ where: { email: 'member@example.com' } });

        // Create task with assignment
        const task = await request(app)
            .post(`/api/projects/${project.body.id}/tasks`)
            .set('Authorization', `Bearer ${owner.token}`)
            .send({ 
                title: 'Assigned Task',
                assignments: [{ userId: memberUser.id, note: 'Important task' }]
            })
            .expect(201);

        // Verify assignment exists
        expect(task.body.assignments).toHaveLength(1);

        // Member should not be able to unassign
        await request(app)
            .delete(`/api/tasks/${task.body.id}/assignments/${memberUser.id}`)
            .set('Authorization', `Bearer ${member.token}`)
            .expect(403);

        // Owner should be able to unassign
        const response = await request(app)
            .delete(`/api/tasks/${task.body.id}/assignments/${memberUser.id}`)
            .set('Authorization', `Bearer ${owner.token}`)
            .expect(200);

        expect(response.body.message).toBe('User unassigned from task successfully');

        // Verify assignment is removed
        const updatedTask = await request(app)
            .get(`/api/tasks/${task.body.id}`)
            .set('Authorization', `Bearer ${owner.token}`)
            .expect(200);

        expect(updatedTask.body.assignments).toHaveLength(0);
    }, 30000); // Increased timeout

    it('should prevent non-members from accessing tasks', async () => {
        // Setup
        const owner = await registerAndLogin('owner@example.com');
        const nonMember = await registerAndLogin('nonmember@example.com');
        
        const project = await request(app)
            .post('/api/projects')
            .set('Authorization', `Bearer ${owner.token}`)
            .send({ name: 'Private Project' })
            .expect(201);

        const task = await request(app)
            .post(`/api/projects/${project.body.id}/tasks`)
            .set('Authorization', `Bearer ${owner.token}`)
            .send({ title: 'Private Task' })
            .expect(201);

        // Non-member should not be able to access project tasks
        await request(app)
            .get(`/api/projects/${project.body.id}/tasks`)
            .set('Authorization', `Bearer ${nonMember.token}`)
            .expect(403);

        // Non-member should not be able to access specific task
        await request(app)
            .get(`/api/tasks/${task.body.id}`)
            .set('Authorization', `Bearer ${nonMember.token}`)
            .expect(403);

        // Non-member should not be able to update task
        await request(app)
            .put(`/api/tasks/${task.body.id}`)
            .set('Authorization', `Bearer ${nonMember.token}`)
            .send({ title: 'Hacked Title' })
            .expect(403);
    }, 30000); // Increased timeout
});


