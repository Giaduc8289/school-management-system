import { Student } from '../../../src/domain/entities/student.entity';
import {
  PostgresStudentRepository,
  type StudentQueryClient,
} from '../../../src/infrastructure/repositories/postgres-student.repository';

describe('PostgresStudentRepository', () => {
  const student = new Student({
    id: 'student-postgres-001',
    code: 'STU-2026-0098',
    fullName: 'Nguyen Van An',
    email: 'an.nguyen@example.com',
    dateOfBirth: new Date('2012-05-15T00:00:00.000Z'),
    status: 'active',
  });

  it('writes all domain fields and returns the database row as a Student', async () => {
    const query = jest.fn(async () => ({
      rows: [
        {
          id: student.id,
          code: student.code,
          full_name: student.fullName,
          email: student.email,
          date_of_birth: student.dateOfBirth,
          status: student.status,
        },
      ],
    }));
    const repository = new PostgresStudentRepository({
      query,
    } as StudentQueryClient);

    const savedStudent = await repository.save(student);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('ON CONFLICT (id) DO UPDATE'),
      [
        student.id,
        student.code,
        student.fullName,
        student.email,
        student.dateOfBirth,
        student.status,
      ],
    );
    expect(savedStudent).toBeInstanceOf(Student);
    expect(savedStudent).toMatchObject({
      id: student.id,
      code: student.code,
      fullName: student.fullName,
      email: student.email,
      dateOfBirth: student.dateOfBirth,
      status: student.status,
    });
  });

  it('queries by ID and returns undefined when no row exists', async () => {
    const query = jest.fn(async () => ({ rows: [] }));
    const repository = new PostgresStudentRepository({
      query,
    } as StudentQueryClient);

    await expect(repository.findById('missing-student')).resolves.toBeUndefined();
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE id = $1'),
      ['missing-student'],
    );
  });

  it('filters and paginates results with stable ordering', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce({ rows: [{ total: '2' }] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: student.id,
            code: student.code,
            full_name: student.fullName,
            email: student.email,
            date_of_birth: student.dateOfBirth,
            status: student.status,
          },
        ],
      });
    const repository = new PostgresStudentRepository({
      query,
    } as StudentQueryClient);

    await expect(
      repository.findMany({
        page: 2,
        pageSize: 10,
        status: 'active',
        search: 'NGUYEN',
      }),
    ).resolves.toEqual({
      items: [student],
      total: 2,
    });
    expect(query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('SELECT COUNT(*) AS total FROM students'),
      ['active', 'NGUYEN'],
    );
    expect(query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('ORDER BY id ASC'),
      ['active', 'NGUYEN', 10, 10],
    );
    expect(query.mock.calls[1][0]).toContain('POSITION(LOWER($2) IN LOWER(code))');
    expect(query.mock.calls[1][0]).toContain('LIMIT $3');
    expect(query.mock.calls[1][0]).toContain('OFFSET $4');
  });

  it('propagates database errors', async () => {
    const databaseError = new Error('database unavailable');
    const repository = new PostgresStudentRepository({
      query: async () => {
        throw databaseError;
      },
    } as StudentQueryClient);

    await expect(repository.save(student)).rejects.toBe(databaseError);
  });

  it('fails if the database does not return the saved record', async () => {
    const repository = new PostgresStudentRepository({
      query: async () => ({ rows: [] }),
    } as StudentQueryClient);

    await expect(repository.save(student)).rejects.toThrow(
      'The database did not return the saved student.',
    );
  });
});
