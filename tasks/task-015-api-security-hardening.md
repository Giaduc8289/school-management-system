# Task 015: API Security Hardening

## Goal
Reduce common API abuse and exposure risks by applying request limits, secure HTTP defaults, and explicit tests for the resulting behavior.

## Dependencies
- TASK-010: Authentication and Authorization
- TASK-011: API Documentation and Operational Readiness

## Acceptance Criteria
- [ ] Apply security-related HTTP response headers using a maintained dependency or an equivalent well-tested implementation.
- [ ] Disable framework-identifying response headers.
- [ ] Set and document a maximum JSON request body size; oversized JSON requests return a stable `413` JSON error without exposing implementation details.
- [ ] Apply rate limits to staff login and API requests with documented defaults and a stable `429` JSON response.
- [ ] Ensure rate-limit identity is derived safely when the application is behind a proxy; do not trust arbitrary forwarded headers by default.
- [ ] Keep rate-limit and error responses free of credentials, tokens, stack traces, and internal exception details.
- [ ] Add tests for required headers, body-size rejection, login and API rate limits, proxy behavior, and unchanged successful request behavior.
- [ ] Document deployment considerations for proxy configuration and rate-limit behavior in `README.md`.
- [ ] `npx tsc --noEmit` passes and global line coverage remains at least 80%.

## Scope
- `src/app.ts`
- `src/presentation/middleware/`
- `src/presentation/routes/`
- `tests/unit/`
- `tests/integration/`
- `package.json` and lockfile if a dependency is required
- `README.md`
