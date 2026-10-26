# Task 014: End-to-End Tests in CI

## Goal
Run the existing browser-based student management smoke test automatically in CI so the principal UI-to-API flow is checked before changes are merged.

## Dependencies
- TASK-008: Student Management Web UI
- TASK-012: CI and Staging Deployment

## Acceptance Criteria
- [ ] Run the Playwright end-to-end test in CI for pull requests and pushes to `main`.
- [ ] Start the API and frontend using isolated CI configuration; do not connect the test to staging or production.
- [ ] Configure test-only staff credentials and signing keys through non-production CI environment values.
- [ ] Ensure the API uses an isolated disposable or in-memory data store so test records cannot affect shared environments.
- [ ] Fail CI when the browser test fails, either service does not become ready, or required browser dependencies are unavailable.
- [ ] Upload Playwright reports, traces, or screenshots only on failure and ensure they contain no credentials, signing keys, or sensitive student information.
- [ ] Document the local end-to-end test command and any required one-time Playwright browser setup in `README.md`.
- [ ] Existing backend tests, frontend tests, builds, and type-checks continue to pass.

## Scope
- `.github/workflows/ci.yml`
- `playwright.config.ts`
- `tests/e2e/`
- CI test environment configuration
- `README.md`
