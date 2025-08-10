import request from 'supertest';
import app from '../src/app';
import { resetDatabase } from './utils';

describe('Auth API', () => {
    beforeEach(async () => {
        await resetDatabase();
    });

    it('registers and logs in a user, sets refresh cookie, returns access token', async () => {
        const email = 'test@example.com';
        const password = 'StrongP@ssw0rd!';

        const reg = await request(app)
            .post('/api/auth/register')
            .send({ email, password })
            .expect(201);

        expect(reg.body.accessToken).toBeDefined();
        const cookies = reg.get('Set-Cookie');
        expect(cookies?.some((c) => c.startsWith('refreshToken='))).toBe(true);

        const login = await request(app)
            .post('/api/auth/login')
            .send({ email, password })
            .expect(200);

        expect(login.body.accessToken).toBeDefined();
    });
});


