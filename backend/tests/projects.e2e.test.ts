import request from 'supertest';
import app from '../src/app';
import { resetDatabase } from './utils';

async function registerAndLogin() {
    const email = 'owner@example.com';
    const password = 'StrongP@ssw0rd!';
    await request(app).post('/api/auth/register').send({ email, password }).expect(201);
    const login = await request(app).post('/api/auth/login').send({ email, password }).expect(200);
    return login.body.accessToken as string;
}

describe('Projects API', () => {
    beforeEach(async () => {
        await resetDatabase();
    });

    it('creates a project and lists it for the owner', async () => {
        const token = await registerAndLogin();
        const created = await request(app)
            .post('/api/projects')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Test Project' })
            .expect(201);

        const got = await request(app)
            .get(`/api/projects/${created.body.id}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(got.body.id).toBe(created.body.id);

        const list = await request(app)
            .get('/api/projects')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);
        expect(Array.isArray(list.body)).toBe(true);
        expect(list.body.length).toBe(1);
    });
});


