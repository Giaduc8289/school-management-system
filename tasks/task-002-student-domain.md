# Task 002: Student Domain Entity & Value Objects

## Goal
Phát triển Domain Entity `Student` cùng các Value Objects/Rules nghiệp vụ liên quan (StudentId, Email, FullName, DateOfBirth) tuân thủ Clean Architecture và Fail-Fast Guard Clauses.

## Acceptance Criteria
- [ ] Khởi tạo `Student` entity thành công với đầy đủ thuộc tính hợp lệ (Id, Code, FullName, Email, DateOfBirth, Status).
- [ ] Áp dụng Guard Clauses kiểm tra ràng buộc nghiệp vụ:
  - Email phải đúng định dạng.
  - Tuổi học sinh phải từ 6 đến 18 tuổi tại thời điểm nhập học.
  - Mã học sinh (Student Code) không được rỗng và đúng định dạng quy định.
- [ ] Thêm các hành động nghiệp vụ trên Entity: `updateProfile()`, `deactivate()`, `activate()`.
- [ ] Unit Test đạt Coverage 100% cho toàn bộ Domain Entity và Errors.
- [ ] TypeScript compiler pass (`npx tsc --noEmit` không lỗi).

## Scope
- `src/domain/entities/student.entity.ts`
- `src/domain/value-objects/student-code.vo.ts`
- `src/domain/errors/domain.error.ts`
- `src/domain/errors/student.error.ts`
- `tests/unit/domain/student.entity.test.ts`