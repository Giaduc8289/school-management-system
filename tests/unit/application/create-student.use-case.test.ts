import { Student } from '../../../src/domain/entities/student.entity';
import type { StudentRepository } from '../../../src/application/ports/student-repository.interface';
import {
  CreateStudentUseCase,
  type CreateStudentInput,
} from '../../../src/application/use-cases/create-student.use-case';

describe('CreateStudentUseCase', () => {
  const validInput: CreateStudentInput = {
    id: 'student-create-001',
    code: 'STU-2026-0001',
    fullName: 'Nguyen Van An',
    email: 'an.nguyen@example.com',
    dateOfBirth: new Date('2012-05-15T00:00:00.000Z'),
  };

  let repository: StudentRepository;
  let useCase: CreateStudentUseCase;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-24T12:00:00.000Z'));
    repository = {
      save: jest.fn(async (student: Student) => student),
      findById: jest.fn(async () => undefined),
      findMany: jest.fn(async () => ({ items: [], total: 0 })),
    };
    useCase = new CreateStudentUseCase(repository);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates an active student and persists the constructed entity', async () => {
    const createdStudent = await useCase.execute(validInput);

    expect(createdStudent).toBeInstanceOf(Student);
    expect(createdStudent).toMatchObject({
      ...validInput,
      status: 'active',
    });
    expect(repository.save).toHaveBeenCalledTimes(1);
    expect(repository.save).toHaveBeenCalledWith(createdStudent);
  });

  it.each([
    ['an empty ID', { id: ' ' }],
    ['an invalid student code', { code: 'INVALID-CODE' }],
    ['an empty full name', { fullName: '   ' }],
    ['an invalid email', { email: 'invalid-email' }],
    ['an invalid date of birth', { dateOfBirth: new Date('invalid') }],
    ['a student younger than six', { dateOfBirth: new Date('2021-10-25T00:00:00.000Z') }],
  ] as const)('does not persist input with %s', async (_description, overrides) => {
    await expect(
      useCase.execute({ ...validInput, ...overrides }),
    ).rejects.toThrow();

    expect(repository.save).not.toHaveBeenCalled();
  });

  it('propagates persistence errors', async () => {
    const persistenceError = new Error('Persistence failed');
    repository.save = jest.fn(async () => {
      throw persistenceError;
    });

    await expect(useCase.execute(validInput)).rejects.toBe(persistenceError);
  });
});
