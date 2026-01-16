Testing pipeline

1) Install deps
   npm install

2) Configure test database
   Ensure DATABASE_URL points to a test Postgres DB. For CI use environment secrets.

3) Run tests
   npm test

CI
- Add a GitHub Actions workflow with a Postgres service and run npm ci, prisma db push, and npm run test:ci.

Env (Email + Queue)
- SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM (optional)
- REDIS_URL (Upstash TCP/Redis URL, required for queue)
- FRONTEND_URL (used to generate invitation link)


