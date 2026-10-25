import { StudentConflictError } from '../../../src/application/errors/student-conflict.error';
import { CreateStudentUseCase } from '../../../src/application/use-cases/create-student.use-case';

describe('CreateStudentUseCase conflict handling', () => {
  it.each([
    ['student ID', 'student-duplicate-id'],
    ['student code', 'STU-2026-0402'],
  ])('propagates a typed conflict for duplicate %s', async () => {
    const conflict = new StudentConflictError();
    const repository = {
      create: jest.fn().mockRejectedValue(conflict),
      save: jest.fn(),
      findById: jest.fn(),
      findMany: jest.fn(),
    };
    const useCase = new CreateStudentUseCase(repository);

    await expect(
      useCase.execute({
        id: 'student-duplicate-id',
        code: 'STU-2026-0402',
        fullName: 'Nguyen Van An',
        email: 'an.duplicate@example.com',
        dateOfBirth: new Date('2012-05-15T00:00:00.000Z'),
      }),
    ).rejects.toBeInstanceOf(StudentConflictError);
    expect(repository.create).toHaveBeenCalledTimes(1);
  });
});
