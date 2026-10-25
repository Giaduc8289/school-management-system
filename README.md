# School Management System

REST API for student management, built with TypeScript, Express, and Clean Architecture.

## Requirements

- Node.js and npm
- PostgreSQL for persistent storage

## Configure PostgreSQL

Create a local database and a database role for the application. Copy `.env.example` values into your shell or deployment environment and set `DATABASE_URL` to the connection string for that database. Do not commit real credentials.

PowerShell example:

```powershell
$env:DATABASE_URL = "postgresql://student_app:your-local-password@localhost:5432/school_management"
```

Apply the versioned SQL migrations:

```powershell
npm run db:migrate
```

The migration command can be rerun safely.

## Run the API

```powershell
npm install
npm run build
npm start
```

The API listens on port `3000` by default. Set `PORT` to use another port. Check the health endpoint at `http://localhost:3000/health`.

When `DATABASE_URL` is configured, application composition uses PostgreSQL. Without it, the application uses an isolated in-memory repository for local development and tests; data in that mode is lost when the process exits. A configured database connection failure is surfaced and does not fall back to in-memory storage.

## Test and type-check

```powershell
npm run typecheck
npm test -- --runInBand
```

PostgreSQL integration tests use a disposable database configured with `TEST_DATABASE_URL`. The test creates a uniquely named schema and drops it when complete. Never point this setting at a production database.

```powershell
$env:TEST_DATABASE_URL = "postgresql://student_test:your-local-password@localhost:5432/school_management_test"
npx jest tests/integration/postgres-student.repository.test.ts --runInBand
```

When `TEST_DATABASE_URL` is not set, PostgreSQL integration tests are skipped. Other tests use the in-memory repository or an injected repository.
