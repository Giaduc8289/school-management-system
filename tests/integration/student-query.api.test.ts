import { request } from '../helpers/authenticated-request';
import { createApp } from '../../src/app';

describe('Student query API', () => {
  const students = [
    {
      id: 'student-001',
      code: 'STU-2026-0001',
      fullName: 'Nguyen Van An',
      email: 'an.nguyen@example.com',
      dateOfBirth: '2012-05-15T00:00:00.000Z',
      status: 'active',
    },
    {
      id: 'student-002',
      code: 'STU-2026-0002',
      fullName: 'Tran Thi Binh',
      email: 'binh.tran@example.com',
      dateOfBirth: '2010-11-20T00:00:00.000Z',
      status: 'inactive',
    },
    {
      id: 'student-003',
      code: 'STU-2026-0003',
      fullName: 'Le Hoang Cuong',
      email: 'cuong.le@example.com',
      dateOfBirth: '2011-02-14T00:00:00.000Z',
      status: 'active',
    },
  ];

  it('returns a student with HTTP 200 when the id exists', async () => {
    const repository = {
      save: jest.fn(),
      findById: jest.fn().mockResolvedValue(students[0]),
      findMany: jest.fn().mockResolvedValue({
        items: students,
        total: students.length,
      }),
    } as any;

    const response = await request(createApp(repository)).get('/students/student-001');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: 'student-001',
      code: 'STU-2026-0001',
      fullName: 'Nguyen Van An',
      status: 'active',
    });
  });

  it('returns HTTP 404 when the student id is unknown', async () => {
    const repository = {
      save: jest.fn(),
      findById: jest.fn().mockResolvedValue(undefined),
      findMany: jest.fn(),
    } as any;

    const response = await request(createApp(repository)).get('/students/missing');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: expect.any(String) });
  });

  it('returns a paginated list with default pagination values', async () => {
    const repository = {
      save: jest.fn(),
      findById: jest.fn(),
      findMany: jest.fn().mockResolvedValue({
        items: students,
        total: students.length,
      }),
    } as any;

    const response = await request(createApp(repository)).get('/students');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      items: students,
      page: 1,
      pageSize: 20,
      total: 3,
    });
  });

  it('filters results by status and search terms case-insensitively', async () => {
    const repository = {
      save: jest.fn(),
      findById: jest.fn(),
      findMany: jest.fn().mockResolvedValue({
        items: [students[0]],
        total: 1,
      }),
    } as any;

    const response = await request(createApp(repository)).get(
      '/students?status=active&search=NGUYEN&page=1&pageSize=20',
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      items: [students[0]],
      page: 1,
      pageSize: 20,
      total: 1,
    });
    expect(repository.findMany).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      status: 'active',
      search: 'NGUYEN',
    });
  });

  it('rejects invalid query parameters with HTTP 400', async () => {
    const repository = {
      save: jest.fn(),
      findById: jest.fn(),
      findMany: jest.fn(),
    } as any;

    await request(createApp(repository)).get('/students?page=0').expect(400);
    await request(createApp(repository)).get('/students?pageSize=0').expect(400);
    await request(createApp(repository)).get('/students?pageSize=200').expect(400);
    await request(createApp(repository)).get('/students?status=pending').expect(400);
  });

  it('returns HTTP 500 for unexpected repository failures during query', async () => {
    const repository = {
      save: jest.fn(),
      findById: jest.fn(),
      findMany: jest.fn().mockRejectedValue(new Error('private query details')),
    } as any;

    const response = await request(createApp(repository)).get('/students');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Internal server error.' });
    expect(JSON.stringify(response.body)).not.toContain('private query details');
  });
});
