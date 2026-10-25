import { ListStudentsUseCase } from '../../../src/application/use-cases/list-students.use-case';

describe('ListStudentsUseCase', () => {
  const students = [
    {
      id: 'student-001',
      code: 'STU-2026-0001',
      fullName: 'Nguyen Van An',
      email: 'an.nguyen@example.com',
      dateOfBirth: new Date('2012-05-15T00:00:00.000Z'),
      status: 'active',
    },
    {
      id: 'student-002',
      code: 'STU-2026-0002',
      fullName: 'Tran Thi Binh',
      email: 'binh.tran@example.com',
      dateOfBirth: new Date('2010-11-20T00:00:00.000Z'),
      status: 'inactive',
    },
    {
      id: 'student-003',
      code: 'STU-2026-0003',
      fullName: 'Le Hoang Cuong',
      email: 'cuong.le@example.com',
      dateOfBirth: new Date('2011-02-14T00:00:00.000Z'),
      status: 'active',
    },
  ];

  it('returns a paginated list using the default page and pageSize', async () => {
    const repository = {
      findMany: jest.fn().mockResolvedValue({
        items: students,
        total: students.length,
      }),
    } as any;

    const useCase = new ListStudentsUseCase(repository);

    await expect(useCase.execute({})).resolves.toEqual({
      items: students,
      page: 1,
      pageSize: 20,
      total: students.length,
    });
    expect(repository.findMany).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      status: undefined,
      search: undefined,
    });
  });

  it('applies filters and caps the page size at 100', async () => {
    const repository = {
      findMany: jest.fn().mockResolvedValue({
        items: [students[0]],
        total: 1,
      }),
    } as any;

    const useCase = new ListStudentsUseCase(repository);

    await expect(
      useCase.execute({
        page: 2,
        pageSize: 250,
        status: 'active',
        search: 'nguyen',
      }),
    ).resolves.toEqual({
      items: [students[0]],
      page: 2,
      pageSize: 100,
      total: 1,
    });

    expect(repository.findMany).toHaveBeenCalledWith({
      page: 2,
      pageSize: 100,
      status: 'active',
      search: 'nguyen',
    });
  });

  it('rejects invalid pagination values', async () => {
    const repository = { findMany: jest.fn() } as any;
    const useCase = new ListStudentsUseCase(repository);

    await expect(useCase.execute({ page: 0 })).rejects.toThrow(
      'Query parameter "page" must be greater than 0.',
    );
    await expect(useCase.execute({ pageSize: 0 })).rejects.toThrow(
      'Query parameter "pageSize" must be greater than 0.',
    );
    await expect(useCase.execute({ pageSize: -1 })).rejects.toThrow(
      'Query parameter "pageSize" must be greater than 0.',
    );
  });

  it('rejects unsupported status values and empty search terms', async () => {
    const repository = { findMany: jest.fn() } as any;
    const useCase = new ListStudentsUseCase(repository);

    await expect(useCase.execute({ status: 'pending' as any })).rejects.toThrow(
      'Query parameter "status" must be one of: active, inactive.',
    );
    await expect(useCase.execute({ search: '' })).rejects.toThrow(
      'Query parameter "search" must be a non-empty string.',
    );
  });

  it('propagates repository query failures', async () => {
    const repository = {
      findMany: jest.fn().mockRejectedValue(new Error('listing failed')),
    } as any;

    const useCase = new ListStudentsUseCase(repository);

    await expect(useCase.execute({})).rejects.toThrow('listing failed');
  });
});
