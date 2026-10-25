# Task 010: Authentication and Authorization

## Goal
Protect student management endpoints with authentication and role-based authorization before exposing the application to users or external networks.

## Dependencies
- TASK-005: Student Presentation and REST API
- TASK-006: Persistent Student Repository
- TASK-007: Student Query API
- TASK-009: Student Data Integrity and Conflict Handling

## Acceptance Criteria
- [ ] Define staff roles and an explicit permission matrix for listing, viewing, creating, and updating students.
- [ ] Provide an authentication flow appropriate for the deployment (for example, staff login with short-lived signed access tokens).
- [ ] Store passwords only as salted, one-way hashes using a maintained password hashing library.
- [ ] Keep signing keys, database credentials, and other secrets in environment or secret-manager configuration; provide an example file with placeholders only.
- [ ] Protect student endpoints with authentication and authorization middleware; keep only explicitly approved health/readiness endpoints public.
- [ ] Return `401` for missing/invalid authentication and `403` for authenticated users lacking permission, using a stable JSON error shape.
- [ ] Do not log passwords, tokens, or sensitive student information.
- [ ] Tests cover successful login, invalid credentials, expired/invalid tokens, role permissions, and unauthenticated access to every protected route.
- [ ] Authentication and authorization concerns stay in Presentation/Application or dedicated outer layers; Domain does not depend on web or token libraries.
- [ ] `npx tsc --noEmit` passes and global line coverage remains at least 80%.

## Scope
- `src/application/`
- `src/infrastructure/`
- `src/presentation/middleware/`
- `src/presentation/routes/`
- `src/app.ts`
- `tests/unit/`
- `tests/integration/`
- `.env.example`
- `README.md`
