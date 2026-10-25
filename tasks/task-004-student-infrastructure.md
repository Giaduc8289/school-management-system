# Task 004: Student In-Memory Repository

## Goal
Provide an infrastructure adapter that implements the Application-owned student repository port without adding a database or framework dependency.

## Acceptance Criteria
- [ ] Implement `InMemoryStudentRepository` in `src/infrastructure/repositories/`.
- [ ] The adapter implements `StudentRepository` and stores students by their immutable ID.
- [ ] Saving a student makes it retrievable by ID and returns the saved student.
- [ ] Saving another student with the same ID replaces the existing stored value.
- [ ] Looking up an unknown ID returns `undefined`.
- [ ] Integration tests cover persistence, replacement, and missing records.
- [ ] Infrastructure depends inward on the Application port and Domain entity only.
- [ ] `npx tsc --noEmit` passes and global line coverage remains at least 80%.

## Scope
- `src/infrastructure/repositories/in-memory-student.repository.ts`
- `tests/integration/student.repository.test.ts`
