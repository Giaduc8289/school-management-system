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

## API documentation and operational endpoints

In non-production environments, the interactive Swagger UI is available at `http://localhost:3000/docs` and the OpenAPI 3.0 JSON specification at `http://localhost:3000/openapi.json`. Set `API_DOCS_ENABLED=false` to disable both endpoints. Documentation endpoints are always disabled when `NODE_ENV=production`, even if the flag is enabled.

`GET /health/live` reports whether the process is running without querying dependencies. `GET /health/ready` checks the configured student repository and returns HTTP 503 with only `{ "status": "unavailable" }` when it cannot be reached; it does not return database details. The legacy `GET /health` endpoint remains available.

Each response includes `X-Request-Id`. A valid caller-supplied ID is propagated; otherwise the API generates one. HTTP request and server-start events are written as JSON with severity levels. Request logs contain method, route template, status, duration, and correlation ID only; request bodies, authorization headers, query strings, and student details are not logged.

`PORT` must be an integer from 1 through 65535. `JWT_SECRET` is required and must be at least 32 characters. Configure at least one staff email and its bcrypt password hash for runtime use. `API_DOCS_ENABLED`, when set, must be `true` or `false`. Invalid configuration prevents startup with a non-secret error. `.env.example` lists the supported environment variables and contains placeholders only.

## Authentication and authorization

Configure a random `JWT_SECRET` of at least 32 characters, staff email addresses, and bcrypt password hashes in the process environment. `.env.example` contains placeholders only; the application does not load it automatically. Never configure or commit plaintext production passwords.

Generate a bcrypt hash for a staff password with:

```powershell
node -e "require('bcryptjs').hash(process.argv[1], 12).then(console.log)" "replace-with-a-strong-password"
```

Set the resulting hash as `AUTH_ADMIN_PASSWORD_HASH` or `AUTH_STAFF_PASSWORD_HASH`, and set the corresponding email variable. The API issues HS256 bearer access tokens that expire after 15 minutes. `POST /auth/login` accepts `{ "email": "...", "password": "..." }`.

| Role | List students | View student | Create student | Update student |
| --- | --- | --- | --- | --- |
| `admin` | Yes | Yes | Yes | Yes |
| `staff` | Yes | Yes | No | No |

All `/students` endpoints require a bearer token. Only the explicitly approved `/health` endpoint and login endpoint are public. Authentication failures return HTTP 401 and insufficient permissions return HTTP 403, both with a JSON `{ "error": "..." }` body. Passwords are verified against salted bcrypt hashes; credentials and tokens are never logged.

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

UI tests run as part of `npm test`. The end-to-end smoke test starts the API and Vite development server automatically. Playwright starts the API in test mode with test-only credentials and a signing key; with `DATABASE_URL` unset it uses the in-memory repository. The test creates synthetic student records only. CI installs Chromium and its system dependencies and runs this browser test against those local services; it does not connect to staging or production. Playwright screenshots, traces, and videos are disabled so diagnostic artifacts cannot capture authentication headers or page data. On a failed CI run, the HTML report is uploaded for seven days.

Install the Playwright Chromium browser once before the first local E2E run:

```powershell
npx playwright install chromium
```

PostgreSQL integration tests use a disposable database configured with `TEST_DATABASE_URL`. The test creates a uniquely named schema and drops it when complete. Never point this setting at a production database.

```powershell
$env:TEST_DATABASE_URL = "postgresql://student_test:your-local-password@localhost:5432/school_management_test"
npx jest tests/integration/postgres-student.repository.test.ts --runInBand
```

When `TEST_DATABASE_URL` is not set, PostgreSQL integration tests are skipped. Other tests use the in-memory repository or an injected repository.

## CI, release, and staging deployment

Work on a feature branch and open a pull request to `main`; do not push unreviewed changes directly to `main`. A pull request and every push to `main` run the GitHub Actions CI workflow. CI installs the committed npm lockfile, type-checks and builds the backend, runs the full Jest suite with the global 80% line-coverage threshold, exercises PostgreSQL integration tests against an isolated PostgreSQL service, and builds/tests the frontend. Merge only after all required checks pass.

Staging deployment is a separate, manual release action. In GitHub Actions, run **Deploy staging** with a branch, tag, or commit that is already an ancestor of `main`. The workflow builds immutable SHA-tagged API, migration, and frontend images, publishes them to GHCR, applies database migrations, updates the Docker Compose services, and verifies `/health/ready` both on the staging host and at the public staging URL. It deploys only to the protected `staging` GitHub Environment; there is no automatic production deployment.

Configure these secrets in the GitHub `staging` Environment:

- `STAGING_SSH_HOST`, `STAGING_SSH_USER`, `STAGING_SSH_PRIVATE_KEY`, and pinned `STAGING_SSH_KNOWN_HOSTS` for the Linux Docker Compose host.
- `STAGING_BASE_URL`, the HTTPS base URL used for the external readiness check.
- `STAGING_SMOKE_EMAIL` and `STAGING_SMOKE_PASSWORD` for a dedicated non-production staff account authorized to list students. The deploy workflow checks readiness and the frontend, logs in with this account, and requests the protected `/students` endpoint. Use a staging-only password and never print the login response or bearer token in workflow logs.

Grant the workflow's `GITHUB_TOKEN` permission to publish packages in GHCR. On the staging host, authenticate Docker to GHCR with a dedicated read-only package token, create `~/school-management-staging/.env` with `DATABASE_URL`, `JWT_SECRET`, and staff email/bcrypt hash values, and retain that file outside the repository with mode `0600`. Install Docker Engine and the Docker Compose plugin. The deploy workflow copies `compose.staging.yml` into that directory; ports `8080` (frontend and API reverse proxy) and outbound HTTPS must be available.

If a new image fails to start or the host readiness check fails, the deployment workflow restores the previously running API and frontend image versions and checks readiness again. It also confirms that the running API and frontend image references match the requested commit revision before running public smoke checks. To roll back manually, select the previous immutable image tags in `compose.staging.yml`'s `API_IMAGE` and `FRONTEND_IMAGE` environment, then run `docker compose -f compose.staging.yml up -d` from the staging directory and verify `https://<staging-host>/health/ready`. Database schema changes must be backward-compatible during a release; take a database backup before migrations, and restore that backup separately if a migration itself must be rolled back. Never put deployment keys, registry tokens, connection strings, or application secrets in source control.

### Staging rollback and database recovery drill

Run this drill only with synthetic records and a staging-equivalent PostgreSQL database. Do not use production data or restore into a production database. A rollback test must use a reviewed candidate revision and a staging environment where a previous healthy API and frontend image are already running:
The failed candidate deployment drill below exercises the deployment workflow's automatic restoration of the previous images and its post-rollback readiness check.

1. Use only the protected `staging` environment with synthetic data. Take a backup using the recovery procedure below, record the current immutable API and frontend image tags, and verify `/health/ready`, staff login, the frontend home page, and an authorized `GET /students`.
2. In GitHub Actions, run **Deploy staging** for a reviewed commit already merged into `main` with `simulate_candidate_failure` enabled. This opt-in drill intentionally stops the candidate API after rollout, so the workflow is expected to fail while performing rollback. Never enable this option for production.
3. Confirm the workflow reports the simulated failure, restores the previous API and frontend images, and verifies readiness after restoration. Confirm the running container image references match the recorded previous tags.
4. Run **Deploy staging** again with `simulate_candidate_failure` disabled and confirm the normal deployment and public smoke checks succeed.

For the database exercise, create a dedicated synthetic source database named with the suffix `_recovery_drill_source` containing a known fixture row with ID `recovery-drill-fixture`, and an empty, disposable target database named with the suffix `_recovery_drill_target`. Both must be staging-equivalent databases containing only synthetic data. Set `DRILL_SOURCE_DATABASE_URL` and `DRILL_TARGET_DATABASE_URL` in the operator's environment using the staging-equivalent database credentials; do not place connection strings in command history, reports, or logs. Run the following from a trusted environment with PostgreSQL client tools installed. The target database is destructive restore scope and must be disposable:

```bash
set -euo pipefail
test -n "${DRILL_SOURCE_DATABASE_URL:-}"
test -n "${DRILL_TARGET_DATABASE_URL:-}"
source_database="$(psql "$DRILL_SOURCE_DATABASE_URL" -Atqc 'SELECT current_database()')"
target_database="$(psql "$DRILL_TARGET_DATABASE_URL" -Atqc 'SELECT current_database()')"
test "$source_database" != "$target_database"
case "$source_database" in *_recovery_drill_source) ;; *) echo "Source must be a dedicated synthetic *_recovery_drill_source database." >&2; exit 1 ;; esac
case "$target_database" in *_recovery_drill_target) ;; *) echo "Target must be a disposable *_recovery_drill_target database." >&2; exit 1 ;; esac
case "${source_database,,}:${target_database,,}" in *prod*) echo "Production databases are forbidden." >&2; exit 1 ;; esac

backup_file="$(mktemp)"
trap 'rm -f "$backup_file"' EXIT
pg_dump --format=custom --no-owner --no-acl --dbname="$DRILL_SOURCE_DATABASE_URL" --file="$backup_file"
pg_restore --clean --if-exists --no-owner --no-acl --dbname="$DRILL_TARGET_DATABASE_URL" "$backup_file"
test "$(psql "$DRILL_TARGET_DATABASE_URL" -Atqc "SELECT count(*) FROM students WHERE id = 'recovery-drill-fixture'")" -eq 1
```

Start the API against the restored target database in an isolated process by setting its `DATABASE_URL` to `DRILL_TARGET_DATABASE_URL`; verify readiness and use the staff smoke account to call `GET /students`. This confirms both the restored fixture and application connectivity without involving production. Delete the disposable target database only after recording the drill result.

### Staging validation record / recovery drill report

Fill in this record after actually running the staging and database drills; a blank template is not evidence that a drill was executed.

- Drill date:
- Deployed revision:
- Previous and candidate API/frontend image tags:
- Verification results (readiness, frontend, staff login, authorized student operation):
- Rollback result and recovery duration:
- Backup/restore result and restored fixture/application verification:
- Follow-up defects or actions (or `None`):

Record results without recording credentials, secrets, tokens, or personal data.

## Next planned tasks

The following tasks extend the completed setup through staging verification, automated browser testing, and additional security checks:

| Priority | Task | Focus |
| --- | --- | --- |
| P0 | [TASK-013: Staging Validation and Recovery Drill](./tasks/task-013-staging-validation-and-recovery.md) | Verify a real staging release, image rollback, and database backup/restore procedure. |
| P1 | [TASK-014: End-to-End Tests in CI](./tasks/task-014-e2e-tests-in-ci.md) | Run the Playwright student-management flow against isolated services in CI. |
| P1 | [TASK-015: API Security Hardening](./tasks/task-015-api-security-hardening.md) | Add secure HTTP defaults, request size limits, and rate limiting with tests. |
| P2 | [TASK-016: Dependency and Image Security Scanning](./tasks/task-016-dependency-and-image-security-scanning.md) | Gate CI and staging releases on dependency and container image scan results. |

TASK-013 should be completed before treating staging as a verified release environment. TASK-014, TASK-015, and TASK-016 can proceed independently once their listed dependencies are satisfied.
