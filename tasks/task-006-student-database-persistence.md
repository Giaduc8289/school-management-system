# Task 006: Persistent Student Repository

## Goal
Replace process-local student storage with a database-backed adapter so student records survive application restarts, while preserving the Application-owned repository port and Clean Architecture boundaries.

## Dependencies
- TASK-003: Student Application Use Cases
- TASK-004: Student In-Memory Repository
- TASK-005: Student REST API

## Technology
Use PostgreSQL for persistent storage. Keep database access and SQL details inside Infrastructure. Do not expose database client types to Domain, Application, or Presentation.

## Acceptance Criteria
- [ ] Implement a PostgreSQL-backed adapter for the existing `StudentRepository` port.
- [ ] Persist and retrieve student ID, code, full name, email, date of birth, and status without losing values.
- [ ] Saving a student with an existing ID updates that record and returns the persisted student.
- [ ] Database connection settings are read from environment variables; credentials are not committed.
- [ ] Add a repeatable schema migration or equivalent versioned schema setup.
- [ ] Application composition can use the persistent adapter, while tests can continue injecting the in-memory adapter.
- [ ] Database errors are surfaced as errors; they are not converted into successful fallback results.
- [ ] Integration tests cover create/read, update, missing records, and persistence across repository instances.
- [ ] Tests use an isolated test database or disposable schema and do not depend on developer production data.
- [ ] Infrastructure depends inward on Application ports and Domain entities; Domain and Application do not import database libraries.
- [ ] `npx tsc --noEmit` passes and global line coverage remains at least 80%.

## Scope
- `src/infrastructure/database/`
- `src/infrastructure/repositories/`
- `src/app.ts`
- `tests/integration/`
- `package.json`
- `.env.example`
- `README.md`
