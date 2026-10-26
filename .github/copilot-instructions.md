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

## CRITICAL EXECUTION RULES (STRICT)
- **Khi ở Pha Red (Red Phase):** Chỉ viết mã kiểm thử (Test files). Tuyệt đối KHÔNG viết mã nguồn thực tế hay chỉnh sửa tầng nghiệp vụ/hạ tầng. Đảm bảo các bài test phải ở trạng thái FAIL (RED) khi chạy kiểm thử.
- **Khi ở Pha Green (Green Phase):** Triển khai tối thiểu mã nguồn nghiệp vụ hoặc hạ tầng để toàn bộ bài test chuyển từ trạng thái FAIL sang PASS thành công.
- **Tính độc lập & Chất lượng:** 
  - Tầng Domain và Application độc lập tuyệt đối với framework/thư viện bên ngoài.
  - 100% KHÔNG dùng placeholder, không để comment `// TODO: implement later` hay mã nguồn giả lập chưa hoàn thiện.