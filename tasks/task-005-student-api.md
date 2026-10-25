# Task 005: Student Presentation and REST API

## Goal
Expose student creation and profile updates through REST endpoints while keeping HTTP concerns in the Presentation layer.

## Endpoints
- `POST /students` accepts `id`, `code`, `fullName`, `email`, and an ISO-8601 `dateOfBirth`; returns `201` with the created student.
- `PUT /students/:id` accepts `fullName` and `email`; returns `200` with the updated student.

## Acceptance Criteria
- [ ] Controllers translate HTTP inputs into Application use-case inputs and return JSON responses.
- [ ] Invalid/missing request fields and Domain validation errors return `400` with `{ "error": string }`.
- [ ] Updating an unknown student returns `404` with `{ "error": string }`.
- [ ] Unexpected errors return `500` without exposing implementation details.
- [ ] `createApp()` wires the student routes to an isolated in-memory repository by default and permits repository injection for composition/testing.
- [ ] The existing `GET /health` endpoint remains unchanged.
- [ ] Integration tests cover create/update success, invalid inputs, and not-found behavior.
- [ ] Presentation may depend on Application and Infrastructure, but Domain and Application do not depend on Express.
- [ ] `npx tsc --noEmit` passes and global line coverage remains at least 80%.

## Scope
- `src/presentation/controllers/student.controller.ts`
- `src/presentation/routes/student.route.ts`
- `src/presentation/errors/bad-request.error.ts`
- `src/presentation/middleware/error-handler.ts`
- `src/app.ts`
- `tests/integration/student.api.test.ts`
