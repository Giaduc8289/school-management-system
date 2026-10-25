import { Student } from '../../src/domain/entities/student.entity';
import { InMemoryStudentRepository } from '../../src/infrastructure/repositories/in-memory-student.repository';

describe('InMemoryStudentRepository', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-24T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function makeStudent(overrides: Partial<{
    id: string;
    code: string;
    fullName: string;
    email: string;
    status: 'active' | 'inactive';
  }> = {}): Student {
    return new Student({
      id: overrides.id ?? 'student-repository-001',
      code: overrides.code ?? 'STU-2026-0010',
      fullName: overrides.fullName ?? 'Nguyen Van An',
      email: overrides.email ?? 'an.nguyen@example.com',
      dateOfBirth: new Date('2012-05-15T00:00:00.000Z'),
      status: overrides.status ?? 'active',
    });
  }

  it('persists a student and returns it when queried by ID', async () => {
    const repository = new InMemoryStudentRepository();
    const student = makeStudent();

    const savedStudent = await repository.save(student);
    const foundStudent = await repository.findById(student.id);

    expect(savedStudent).toBe(student);
    expect(foundStudent).toBe(student);
  });

  it('replaces the stored student when saving another student with the same ID', async () => {
    const repository = new InMemoryStudentRepository();
    const firstStudent = makeStudent();
    const updatedStudent = makeStudent({
      fullName: 'Nguyen Thi Binh',
      email: 'binh.nguyen@example.com',
    });

    await repository.save(firstStudent);
    await repository.save(updatedStudent);

    await expect(repository.findById(firstStudent.id)).resolves.toBe(
      updatedStudent,
    );
  });

  it('returns undefined when the requested ID is not stored', async () => {
    const repository = new InMemoryStudentRepository();

    await expect(repository.findById('missing-student')).resolves.toBeUndefined();
  });

  it('filters by status and case-insensitive search with stable pagination', async () => {
    const repository = new InMemoryStudentRepository();
    const laterStudent = makeStudent({
      id: 'student-repository-003',
      code: 'STU-2026-0012',
      fullName: 'Nguyen Thi Binh',
      email: 'binh.nguyen@example.com',
    });
    const earlierStudent = makeStudent({
      id: 'student-repository-001',
      code: 'STU-2026-0010',
      fullName: 'Nguyen Van An',
      email: 'an.nguyen@example.com',
    });
    const inactiveStudent = makeStudent({
      id: 'student-repository-002',
      code: 'STU-2026-0011',
      fullName: 'Nguyen Van Cuong',
      email: 'cuong.nguyen@example.com',
      status: 'inactive',
    });

    await repository.save(laterStudent);
    await repository.save(inactiveStudent);
    await repository.save(earlierStudent);

    await expect(
      repository.findMany({
        page: 1,
        pageSize: 1,
        status: 'active',
        search: 'NGUYEN',
      }),
    ).resolves.toEqual({
      items: [earlierStudent],
      total: 2,
    });
    await expect(
      repository.findMany({
        page: 2,
        pageSize: 1,
        status: 'active',
        search: 'NGUYEN',
      }),
    ).resolves.toEqual({
      items: [laterStudent],
      total: 2,
    });
  });
});
