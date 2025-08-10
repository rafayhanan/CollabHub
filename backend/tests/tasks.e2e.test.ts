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
    });
});


