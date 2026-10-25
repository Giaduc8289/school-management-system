# Task 008: Student Management Web UI

## Goal
Provide a browser-based interface for school staff to view, create, and update student profiles using the REST API, without requiring DevTools Console.

## Dependencies
- TASK-005: Student Presentation and REST API
- TASK-007: Student Query API

## Technology
Build the frontend as a TypeScript React application using Vite. Keep frontend code separate from the backend Clean Architecture layers.

## Acceptance Criteria
- [ ] Provide a student list screen with pagination and search.
- [ ] Provide a create-student form for ID, code, full name, email, and date of birth.
- [ ] Provide an edit form for full name and email.
- [ ] Display field validation messages returned by the API and clear success/error feedback.
- [ ] Show loading and empty states; prevent duplicate submissions while a request is pending.
- [ ] Handle API/network errors without exposing internal server details to the user.
- [ ] Configure the API base URL outside source code and document local frontend/backend startup steps.
- [ ] Configure development proxy or backend CORS so the browser can call the API safely.
- [ ] Add UI tests for list rendering, create/update flows, validation errors, loading, and API failure.
- [ ] Add an end-to-end smoke test for the principal create and update flow.
- [ ] `npm run build`, frontend tests, backend tests, and `npx tsc --noEmit` pass.

## Scope
- `frontend/`
- `src/app.ts` or Presentation configuration only if required for browser API access
- `tests/`
- `README.md`
- Frontend package manifest and build/test configuration
