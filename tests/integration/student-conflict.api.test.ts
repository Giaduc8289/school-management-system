import request from 'supertest';
import { StudentConflictError } from '../../src/application/errors/student-conflict.error';
import type { StudentRepository } from '../../src/application/ports/student-repository.interface';
import { createApp } from '../../src/app';
import { InMemoryStudentRepository } from '../../src/infrastructure/repositories/in-memory-student.repository';

const validStudent = {
  id: 'student-conflict-api-001',
  code: 'STU-2026-0401',
  fullName: 'Nguyen Van An',
  email: 'an.conflict@example.com',
  dateOfBirth: '2012-05-15T00:00:00.000Z',
};

function repositoryWithSave(
  save: StudentRepository['save'],
  findById: StudentRepository['findById'] = async () => undefined,
): StudentRepository {
  return {
    create: save,
    save,
    findById,
    findMany: async () => ({ items: [], total: 0 }),
  };
}

describe('Student conflict API behavior', () => {
  it.each([
    ['ID', { id: validStudent.id, code: 'STU-2026-0402' }],
    ['code', { id: 'student-conflict-api-002', code: validStudent.code }],
  ])('returns HTTP 409 when creating a duplicate student %s', async (_field, identity) => {
    const app = createApp(new InMemoryStudentRepository());
    const firstResponse = await request(app).post('/students').send(validStudent);
    expect(firstResponse.status).toBe(201);

    const response = await request(app)
      .post('/students')
      .send({ ...validStudent, ...identity });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      error: 'A student with this ID or code already exists.',
    });
    const listing = await request(app).get('/students');
    expect(listing.body.total).toBe(1);
  });

  it('returns HTTP 409 with a stable error for an ID or code conflict', async () => {
    const repository = repositoryWithSave(async () => {
      throw new StudentConflictError();
    });

    const response = await request(createApp(repository))
      .post('/students')
      .send(validStudent);

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      error: 'A student with this ID or code already exists.',
    });
    expect(JSON.stringify(response.body)).not.toMatch(
      /sql|schema|postgres|constraint/i,
    );
  });

  it('keeps unrelated persistence errors as generic HTTP 500 responses', async () => {
    const repository = repositoryWithSave(async () => {
      throw new Error('private database connection and SQL details');
    });

    const response = await request(createApp(repository))
      .post('/students')
      .send(validStudent);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Internal server error.' });
    expect(JSON.stringify(response.body)).not.toContain(
      'private database connection and SQL details',
    );
  });

  it('does not change student ID or code when updating profile data', async () => {
    const app = createApp(new InMemoryStudentRepository());

    const created = await request(app).post('/students').send(validStudent);
    expect(created.status).toBe(201);

    const response = await request(app)
      .put(`/students/${validStudent.id}`)
      .send({
        id: 'different-id',
        code: 'STU-2026-9999',
        fullName: 'Nguyen Thi Binh',
        email: 'binh.conflict@example.com',
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: validStudent.id,
      code: validStudent.code,
      fullName: 'Nguyen Thi Binh',
      email: 'binh.conflict@example.com',
    });
  });
});
