import { execSync } from 'node:child_process';

export default async function globalSetup() {
    // Pre-generate Prisma client once to avoid concurrent generate in tests
    execSync('npx prisma generate', { stdio: 'inherit' });
}


