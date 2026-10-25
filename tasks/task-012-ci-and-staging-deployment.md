# Task 012: CI and Staging Deployment

## Goal
Automate quality checks and establish a repeatable staging deployment without committing secrets or depending on developer-specific machine state.

## Dependencies
- TASK-006: Persistent Student Repository
- TASK-008: Student Management Web UI
- TASK-009: Student Data Integrity and Conflict Handling
- TASK-010: Authentication and Authorization
- TASK-011: API Documentation and Operational Readiness

## Acceptance Criteria
- [ ] Add a CI workflow that installs locked dependencies and runs backend type-check, backend tests, and coverage threshold checks.
- [ ] Run frontend build and tests when frontend files change.
- [ ] Run database-backed integration tests against an isolated CI database service.
- [ ] CI fails on build, type-check, test, or configured coverage failures.
- [ ] Provide a repeatable staging deployment workflow with environment-specific configuration and database migration handling.
- [ ] Store deployment credentials and application secrets only in the CI/platform secret store.
- [ ] Add a documented rollback procedure and verify deployment health/readiness before marking a deployment successful.
- [ ] Do not automatically deploy unreviewed changes to production.
- [ ] Document branch/PR expectations and release/deployment steps in `README.md`.

## Scope
- `.github/workflows/`
- `package.json` and lockfiles
- `frontend/` build configuration
- Database migration/deployment scripts
- `README.md`
