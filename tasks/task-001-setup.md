<!-- # Task 001: Project Setup

## Goal

Create the initial TypeScript and Express project structure using Clean Architecture.

## Structure

- `src/domain`: core domain model and domain errors
- `src/application`: use cases, DTOs, and interfaces
- `src/infrastructure`: persistence and external-service implementations
- `src/presentation`: controllers, middleware, and routes
- `src/app.ts`: Express application setup
- `tests/unit`: domain and application unit tests
- `tests/integration`: API and infrastructure integration tests

## Acceptance Criteria

- TypeScript build and Jest test commands are configured.
- Architecture guidance is available in `.github/copilot-instructions.md`.
- The project starts from an Express application entry point without adding domain behavior. -->


# Task 001: Project Base Setup & Health Check Endpoint

## Goal
Khởi tạo dự án Node.js/TypeScript với cấu trúc Clean Architecture, cấu hình Jest, và endpoint `/health` kiểm tra trạng thái hệ thống.

## Acceptance Criteria
- [ ] TypeScript compiler pass (`npx tsc --noEmit` không lỗi).
- [ ] Jest + Supertest chạy kiểm tra endpoint `/health`.
- [ ] Coverage test đạt >= 80%.
- [ ] `.gitignore` bỏ qua `node_modules/` và `coverage/`.

## Scope
- `package.json`, `tsconfig.json`, `jest.config.ts`, `.gitignore`
- `src/presentation/controllers/health.controller.ts`
- `src/presentation/routes/health.route.ts`
- `src/app.ts`
- `tests/integration/health.test.ts`