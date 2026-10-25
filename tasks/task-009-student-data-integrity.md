# Task 009: Student Data Integrity and Conflict Handling

## Goal
Define and enforce uniqueness and consistency rules for student records, including concurrent writes and clear conflict responses.

## Dependencies
- TASK-002: Student Domain Entity and Value Objects
- TASK-003: Student Application Use Cases
- TASK-006: Persistent Student Repository
- TASK-007: Student Query API

## Acceptance Criteria
- [ ] Define whether student ID and student code are unique; enforce both rules consistently in the persistent schema and repository.
- [ ] Creating a record that conflicts with an existing ID or code returns a typed Application conflict error.
- [ ] Updating a profile cannot change identity fields or bypass uniqueness constraints.
- [ ] Map known persistence constraint violations to a stable `409` response with `{ "error": string }`; do not expose SQL, schema, or driver details.
- [ ] Do not translate unrelated persistence failures into conflict responses.
- [ ] Handle simultaneous requests that attempt the same unique value without storing duplicates.
- [ ] Unit tests cover error mapping and application behavior; integration tests cover duplicate ID/code and concurrent conflict behavior.
- [ ] Existing create, update, query, not-found, and health endpoint behavior remains unchanged when no conflict occurs.
- [ ] `npx tsc --noEmit` passes and global line coverage remains at least 80%.

## Scope
- `src/domain/`
- `src/application/errors/`
- `src/application/use-cases/`
- `src/infrastructure/repositories/`
- Database migrations/schema
- `src/presentation/middleware/error-handler.ts`
- `tests/unit/`
- `tests/integration/`
