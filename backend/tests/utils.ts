import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export async function resetDatabase() {
    // Truncate tables between tests for isolation
    await prisma.$executeRawUnsafe(`
    DO $$
    DECLARE
      r RECORD;
    BEGIN
      FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' RESTART IDENTITY CASCADE';
      END LOOP;
    END;
    $$;
  `);
}

export async function closeDatabase() {
    await prisma.$disconnect();
}


