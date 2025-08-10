import { execSync } from 'node:child_process';
import dotenv from 'dotenv';
dotenv.config();

// Ensure test DB is migrated before tests run (client generated in global setup)
beforeAll(() => {
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL not set');
    }
    execSync('npx prisma db push', { stdio: 'inherit' });
});

afterAll(async () => {
    // Optionally, you could drop the DB or truncate tables here
});


