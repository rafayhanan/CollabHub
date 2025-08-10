Testing pipeline

1) Install deps
   npm install

2) Configure test database
   Ensure DATABASE_URL points to a test Postgres DB. For CI use environment secrets.

3) Run tests
   npm test

CI
- Add a GitHub Actions workflow with a Postgres service and run npm ci, prisma db push, and npm run test:ci.


