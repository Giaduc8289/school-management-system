import { GetStudentByIdUseCase } from '../../../src/application/use-cases/get-student.use-case';
import { StudentNotFoundError } from '../../../src/application/errors/student-not-found.error';

describe('GetStudentByIdUseCase', () => {
  const student = {
    id: 'student-001',
    code: 'STU-2026-0001',
    fullName: 'Nguyen Van An',
    email: 'an.nguyen@example.com',
    dateOfBirth: new Date('2012-05-15T00:00:00.000Z'),
    status: 'active',
  };

  it('returns the student when the student exists', async () => {
    const repository = {
      findById: jest.fn().mockResolvedValue(student),
    } as any;

    const useCase = new GetStudentByIdUseCase(repository);

    await expect(useCase.execute('student-001')).resolves.toMatchObject({
      id: 'student-001',
      code: 'STU-2026-0001',
      status: 'active',
    });
    expect(repository.findById).toHaveBeenCalledWith('student-001');
  });

  it('throws StudentNotFoundError when the student does not exist', async () => {
    const repository = {
      findById: jest.fn().mockResolvedValue(undefined),
    } as any;

    const useCase = new GetStudentByIdUseCase(repository);

    await expect(useCase.execute('missing-student')).rejects.toThrow(
      StudentNotFoundError,
    );
    await expect(useCase.execute('missing-student')).rejects.toThrow(
      'Student with ID "missing-student" was not found.',
    );
  });

  it('propagates repository failures', async () => {
    const repository = {
      findById: jest.fn().mockRejectedValue(new Error('database read failed')),
    } as any;

    const useCase = new GetStudentByIdUseCase(repository);

    await expect(useCase.execute('student-001')).rejects.toThrow(
      'database read failed',
    );
  });
});
