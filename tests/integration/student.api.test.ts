import request from 'supertest';
import { createApp } from '../../src/app';
import type { StudentRepository } from '../../src/application/ports/student-repository.interface';
import { Student } from '../../src/domain/entities/student.entity';
import { InMemoryStudentRepository } from '../../src/infrastructure/repositories/in-memory-student.repository';

describe('Student REST API', () => {
  const validStudent = {
    id: 'student-api-001',
    code: 'STU-2026-0020',
    fullName: 'Nguyen Van An',
    email: 'an.nguyen@example.com',
    dateOfBirth: '2012-05-15T00:00:00.000Z',
  };

  function makeApp() {
    return createApp(new InMemoryStudentRepository());
  }

  it('creates and returns a student with HTTP 201', async () => {
    const response = await request(makeApp()).post('/students').send(validStudent);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      ...validStudent,
      dateOfBirth: validStudent.dateOfBirth,
      status: 'active',
    });
  });

  it('returns HTTP 400 when the update JSON body is not an object', async () => {
    const app = makeApp();
    await request(app).post('/students').send(validStudent);

    const response = await request(app)
      .put(`/students/${validStudent.id}`)
      .set('Content-Type', 'application/json')
      .send('[]');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'Request body must be a JSON object.',
    });
  });

  it('returns HTTP 400 for invalid creation data', async () => {
    const response = await request(makeApp())
      .post('/students')
      .send({ ...validStudent, email: 'invalid-email' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: expect.any(String),
    });
  });

  it('updates an existing student and returns HTTP 200', async () => {
    const app = makeApp();
    await request(app).post('/students').send(validStudent);

    const response = await request(app)
      .put(`/students/${validStudent.id}`)
      .send({
        fullName: 'Nguyen Thi Binh',
        email: 'binh.nguyen@example.com',
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: validStudent.id,
      code: validStudent.code,
      fullName: 'Nguyen Thi Binh',
      email: 'binh.nguyen@example.com',
      status: 'active',
    });
  });

  it('returns HTTP 400 when an update profile is invalid', async () => {
    const app = makeApp();
    await request(app).post('/students').send(validStudent);

    const response = await request(app)
      .put(`/students/${validStudent.id}`)
      .send({ fullName: 'Updated Name', email: 'invalid-email' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: expect.any(String),
    });
  });

  it('returns HTTP 404 when updating an unknown student', async () => {
    const response = await request(makeApp())
      .put('/students/missing-student')
      .send({ fullName: 'Updated Name', email: 'updated@example.com' });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: expect.any(String),
    });
  });

  it('returns HTTP 400 when required creation fields are missing', async () => {
    const { email: _email, ...missingEmail } = validStudent;
    const response = await request(makeApp()).post('/students').send(missingEmail);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: expect.any(String),
    });
  });

  it.each(['id', 'code', 'fullName', 'email', 'dateOfBirth'] as const)(
    'returns HTTP 400 when the creation field "%s" is missing',
    async (field) => {
      const incompleteStudent: Partial<typeof validStudent> = {
        ...validStudent,
      };
      delete incompleteStudent[field];

      const response = await request(makeApp())
        .post('/students')
        .send(incompleteStudent);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: expect.any(String) });
    },
  );

  it.each(['fullName', 'email'] as const)(
    'returns HTTP 400 when the update field "%s" is missing',
    async (field) => {
      const app = makeApp();
      await request(app).post('/students').send(validStudent);
      const profile: Partial<{
        fullName: string;
        email: string;
      }> = {
        fullName: 'Updated Name',
        email: 'updated@example.com',
      };
      delete profile[field];

      const response = await request(app)
        .put(`/students/${validStudent.id}`)
        .send(profile);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: expect.any(String) });
    },
  );

  it('returns HTTP 400 when the date of birth cannot be parsed', async () => {
    const response = await request(makeApp())
      .post('/students')
      .send({ ...validStudent, dateOfBirth: 'not-a-date' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'Field "dateOfBirth" must be an ISO-8601 date.',
    });
  });

  it('rejects a parseable date that is not ISO-8601', async () => {
    const response = await request(makeApp())
      .post('/students')
      .send({ ...validStudent, dateOfBirth: '05/15/2012' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'Field "dateOfBirth" must be an ISO-8601 date.',
    });
  });

  it('returns HTTP 400 when the JSON body is not an object', async () => {
    const response = await request(makeApp())
      .post('/students')
      .set('Content-Type', 'application/json')
      .send('[]');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'Request body must be a JSON object.',
    });
  });

  it('returns HTTP 400 when the request body contains malformed JSON', async () => {
    const response = await request(makeApp())
      .post('/students')
      .set('Content-Type', 'application/json')
      .send('{"id":');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: 'Request body contains invalid JSON.',
    });
  });

  it('returns a generic HTTP 500 response for unexpected persistence errors', async () => {
    const repository: StudentRepository = {
      save: async () => {
        throw new Error('private persistence details');
      },
      findById: async () => undefined,
      findMany: async () => ({ items: [], total: 0 }),
    };

    const response = await request(createApp(repository))
      .post('/students')
      .send(validStudent);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Internal server error.' });
    expect(JSON.stringify(response.body)).not.toContain(
      'private persistence details',
    );
  });

  it('keeps the default repository isolated between app instances', async () => {
    const firstApp = createApp();
    const secondApp = createApp();
    await request(firstApp).post('/students').send(validStudent);

    const response = await request(secondApp)
      .put(`/students/${validStudent.id}`)
      .send({ fullName: 'Updated Name', email: 'updated@example.com' });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: expect.any(String) });
  });

  it('returns a generic HTTP 500 response for unexpected update errors', async () => {
    const existingStudent = new Student({
      ...validStudent,
      dateOfBirth: new Date(validStudent.dateOfBirth),
      status: 'active',
    });
    const repository: StudentRepository = {
      save: async () => {
        throw new Error('private update persistence details');
      },
      findById: async () => existingStudent,
      findMany: async () => ({ items: [], total: 0 }),
    };

    const response = await request(createApp(repository))
      .put(`/students/${validStudent.id}`)
      .send({ fullName: 'Updated Name', email: 'updated@example.com' });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Internal server error.' });
    expect(JSON.stringify(response.body)).not.toContain(
      'private update persistence details',
    );
  });
});
