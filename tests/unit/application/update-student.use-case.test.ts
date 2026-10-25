import type { StudentRepository } from '../../../src/application/ports/student-repository.interface';
import { StudentNotFoundError } from '../../../src/application/errors/student-not-found.error';
import { Student } from '../../../src/domain/entities/student.entity';
import { UpdateStudentUseCase } from '../../../src/application/use-cases/update-student.use-case';

describe('UpdateStudentUseCase', () => {
  const studentId = 'student-update-001';

  let student: Student;
  let repository: StudentRepository;
  let useCase: UpdateStudentUseCase;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-24T12:00:00.000Z'));
    student = new Student({
      id: studentId,
      code: 'STU-2026-0001',
      fullName: 'Nguyen Van An',
      email: 'an.nguyen@example.com',
      dateOfBirth: new Date('2012-05-15T00:00:00.000Z'),
      status: 'inactive',
    });
    repository = {
      save: jest.fn(async (savedStudent: Student) => savedStudent),
      findById: jest.fn(async (id: string) =>
        id === studentId ? student : undefined,
      ),
    };
    useCase = new UpdateStudentUseCase(repository);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('loads by ID, updates only the profile, and persists the student', async () => {
    const updatedStudent = await useCase.execute(studentId, {
      fullName: 'Nguyen Thi Binh',
      email: 'binh.nguyen@example.com',
    });

    expect(repository.findById).toHaveBeenCalledTimes(1);
    expect(repository.findById).toHaveBeenCalledWith(studentId);
    expect(updatedStudent).toBe(student);
    expect(updatedStudent).toMatchObject({
      id: studentId,
      code: 'STU-2026-0001',
      fullName: 'Nguyen Thi Binh',
      email: 'binh.nguyen@example.com',
      dateOfBirth: new Date('2012-05-15T00:00:00.000Z'),
      status: 'inactive',
    });
    expect(repository.save).toHaveBeenCalledTimes(1);
    expect(repository.save).toHaveBeenCalledWith(student);
  });

  it('throws a typed not-found error and does not persist an unknown student', async () => {
    const missingId = 'student-missing';

    await expect(
      useCase.execute(missingId, {
        fullName: 'Updated Name',
        email: 'updated@example.com',
      }),
    ).rejects.toBeInstanceOf(StudentNotFoundError);

    expect(repository.findById).toHaveBeenCalledWith(missingId);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it.each([
    ['an empty full name', { fullName: '   ', email: 'updated@example.com' }],
    ['an invalid email', { fullName: 'Updated Name', email: 'invalid-email' }],
  ])('does not persist a profile with %s', async (_description, profile) => {
    await expect(useCase.execute(studentId, profile)).rejects.toThrow();

    expect(repository.save).not.toHaveBeenCalled();
    expect(student.fullName).toBe('Nguyen Van An');
    expect(student.email).toBe('an.nguyen@example.com');
  });

  it('propagates persistence errors', async () => {
    const persistenceError = new Error('Persistence failed');
    repository.save = jest.fn(async () => {
      throw persistenceError;
    });

    await expect(
      useCase.execute(studentId, {
        fullName: 'Updated Name',
        email: 'updated@example.com',
      }),
    ).rejects.toBe(persistenceError);
  });
});
