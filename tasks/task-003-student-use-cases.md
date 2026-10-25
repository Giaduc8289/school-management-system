# Task 003: Student Application Use Cases

## Goal
Implement application use cases for creating and updating students while keeping the Application layer independent of Express and persistence details.

## Acceptance Criteria
- [ ] Define an application-owned `StudentRepository` port with asynchronous `save` and `findById` operations.
- [ ] `CreateStudentUseCase` accepts student identity, code, profile, and date of birth, constructs a valid `Student` with active status, and persists it.
- [ ] `UpdateStudentUseCase` loads an existing student by ID, updates only its full name and email, persists it, and returns the updated student.
- [ ] Invalid domain data fails through domain guard clauses and is never persisted.
- [ ] Updating an unknown student raises a typed application not-found error.
- [ ] Unit tests cover successful operations, domain validation failures, missing students, and persistence interactions.
- [ ] Application and Domain do not depend on external frameworks or infrastructure implementations.
- [ ] `npx tsc --noEmit` passes and global line coverage remains at least 80%.

## Scope
- `src/application/ports/student-repository.interface.ts`
- `src/application/errors/student-not-found.error.ts`
- `src/application/use-cases/create-student.use-case.ts`
- `src/application/use-cases/update-student.use-case.ts`
- `tests/unit/application/create-student.use-case.test.ts`
- `tests/unit/application/update-student.use-case.test.ts`
