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

The running API reads `DATABASE_URL`; `TEST_DATABASE_URL` is only used by PostgreSQL integration tests and does not configure application storage. Set `DATABASE_URL` in the environment of the terminal that starts `npm start`, run the migrations, and restart the API after changing the variable.

## Run the student management web UI

Install the root workspace dependencies once:

```powershell
npm install
```

Start the API in one terminal:

```powershell
npm start
```

Start the frontend in a second terminal:

```powershell
Copy-Item frontend\.env.example frontend\.env.local
npm --workspace frontend run dev
```

Open `http://localhost:5173`. The frontend reads `VITE_API_BASE_URL` from its environment for an optional API base URL. Leave it empty for local development; Vite proxies `/students` and `/health` to `VITE_API_PROXY_TARGET` (default `http://localhost:3000`). Set these values in `frontend/.env.local` or the deployment environment, not in frontend source files.

Build the frontend for production with:

```powershell
npm run build:frontend
```

## Test and type-check

```powershell
npm run typecheck
npm test -- --runInBand
npm run build:frontend
npm run test:e2e
```

UI tests run as part of `npm test`. The end-to-end smoke test starts the API and Vite development server automatically. Install the Playwright Chromium browser once before the first E2E run:

```powershell
npx playwright install chromium
```

PostgreSQL integration tests use a disposable database configured with `TEST_DATABASE_URL`. The test creates a uniquely named schema and drops it when complete. Never point this setting at a production database.

```powershell
$env:TEST_DATABASE_URL = "postgresql://student_test:your-local-password@localhost:5432/school_management_test"
npx jest tests/integration/postgres-student.repository.test.ts --runInBand
```

When `TEST_DATABASE_URL` is not set, PostgreSQL integration tests are skipped. Other tests use the in-memory repository or an injected repository.
