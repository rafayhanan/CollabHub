import { closeDatabase } from './utils';

export default async function globalTeardown() {
    await closeDatabase();
}


