# Task 007: Student Query API

## Goal
Expose student retrieval endpoints so clients can view a single student or browse a paginated, filterable student list.

## Dependencies
- TASK-003: Student Application Use Cases
- TASK-004: Student In-Memory Repository
- TASK-005: Student Presentation and REST API
- TASK-006: Persistent Student Repository

## Endpoints
- `GET /students/:id` returns `200` with a student, or `404` with `{ "error": string }`.
- `GET /students` returns `200` with a paginated result containing `items`, `page`, `pageSize`, and `total`.
- `GET /students` accepts optional `page`, `pageSize`, `status`, and `search` query parameters. `search` matches student code, full name, or email.

## Acceptance Criteria
- [ ] Add query operations to the Application-owned repository port and implement them in every repository adapter.
- [ ] Add Application query use cases; Presentation controllers do not call repositories directly.
- [ ] Default pagination is page 1 with a page size of 20; page size is capped at 100.
- [ ] Reject malformed, out-of-range, or unsupported query parameters with `400` and `{ "error": string }`.
- [ ] Filter by valid student status and search case-insensitively without changing stored values.
- [ ] Return stable ordering for paginated results.
- [ ] Unknown IDs return `404`; unexpected failures use the existing generic `500` response.
- [ ] Unit and integration tests cover success, empty results, pagination boundaries, filters, invalid query values, not-found, and repository failures.
- [ ] `GET /health`, `POST /students`, and `PUT /students/:id` retain their existing behavior.
- [ ] Domain and Application remain independent of Express and Infrastructure implementations.
- [ ] `npx tsc --noEmit` passes and global line coverage remains at least 80%.

## Scope
- `src/application/ports/student-repository.interface.ts`
- `src/application/use-cases/`
- `src/infrastructure/repositories/`
- `src/presentation/controllers/`
- `src/presentation/routes/student.route.ts`
- `tests/unit/application/`
- `tests/integration/`
