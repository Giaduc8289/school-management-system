<!-- # Project Instructions

## Architecture

- Keep domain entities, value objects, and domain errors in `src/domain`.
- Put use cases, DTOs, and application-owned interfaces in `src/application`.
- Put database and external-service implementations in `src/infrastructure`.
- Put controllers, middleware, and routes in `src/presentation`.
- Keep dependencies pointing inward: domain must not depend on application, infrastructure, or presentation.
- Application may depend on domain abstractions, while infrastructure and presentation implement or invoke application abstractions.
- Add unit tests under `tests/unit` and API or infrastructure tests under `tests/integration`. -->

# AI Rules for School Management System

- Architecture: Clean Architecture. Depend ONLY inward. Domain core has ZERO external dependencies.
- Workflow: Strict TDD (Red-Green-Refactor). Write tests first, ensure RED, write code to pass (GREEN), refactor.
- Coverage Requirement: Line coverage >= 80% globally and on core business logic.
- Code Standards:
  - Fail-fast with Guard Clauses.
  - Zero TODOs, stubs, or incomplete placeholder comments.
  - Centralized domain exception handling via Custom Errors and Express Middleware.