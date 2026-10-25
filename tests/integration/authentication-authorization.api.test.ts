import { createHmac } from 'node:crypto';
import request from 'supertest';

const testSigningKey = 'test-only-auth-signing-key-for-integration-tests';
const adminCredentials = {
  email: 'admin@example.test',
  password: 'Admin-password-2026!',
};
const staffCredentials = {
  email: 'staff@example.test',
  password: 'Staff-password-2026!',
};

function makeApp() {
  process.env.JWT_SECRET = testSigningKey;
  process.env.AUTH_ADMIN_EMAIL = adminCredentials.email;
  process.env.AUTH_ADMIN_PASSWORD = adminCredentials.password;
  process.env.AUTH_STAFF_EMAIL = staffCredentials.email;
  process.env.AUTH_STAFF_PASSWORD = staffCredentials.password;

  const { createApp } = require('../../src/app') as typeof import('../../src/app');
  return createApp();
}

function createExpiredAdminToken(): string {
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString('base64url');
  const unsignedToken = [
    encode({ alg: 'HS256', typ: 'JWT' }),
    encode({
      sub: adminCredentials.email,
      role: 'admin',
      exp: Math.floor(Date.now() / 1000) - 60,
    }),
  ].join('.');
  const signature = createHmac('sha256', testSigningKey)
    .update(unsignedToken)
    .digest('base64url');

  return `${unsignedToken}.${signature}`;
}

async function login(
  app: ReturnType<typeof makeApp>,
  credentials: { email: string; password: string },
): Promise<string> {
  const response = await request(app).post('/auth/login').send(credentials);

  expect(response.status).toBe(200);
  expect(response.body).toEqual(
    expect.objectContaining({
      accessToken: expect.any(String),
      tokenType: 'Bearer',
      expiresIn: expect.any(Number),
    }),
  );

  return response.body.accessToken as string;
}

function expectAuthenticationError(
  response: { status: number; body: unknown },
  status: 401 | 403,
): void {
  expect(response.status).toBe(status);
  expect(response.body).toEqual({ error: expect.any(String) });
}

describe('Authentication and authorization API', () => {
  const student = {
    id: 'student-auth-001',
    code: 'STU-2026-0901',
    fullName: 'Nguyen Van An',
    email: 'an.auth@example.com',
    dateOfBirth: '2012-05-15T00:00:00.000Z',
  };

  it('allows the health endpoint without authentication', async () => {
    const response = await request(makeApp()).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it.each([
    ['list students', 'get', '/students'],
    ['view a student', 'get', '/students/student-auth-001'],
    ['create a student', 'post', '/students'],
    ['update a student', 'put', '/students/student-auth-001'],
  ] as const)(
    'returns a stable 401 response for unauthenticated requests to %s',
    async (_operation, method, path) => {
      const app = makeApp();
      const route = request(app)[method](path);
      const response =
        method === 'post' || method === 'put'
          ? await route.send(student)
          : await route;

      expectAuthenticationError(response, 401);
    },
  );

  it('authenticates staff with valid credentials and returns a short-lived bearer token', async () => {
    const app = makeApp();
    const response = await request(app)
      .post('/auth/login')
      .send(adminCredentials);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        accessToken: expect.any(String),
        tokenType: 'Bearer',
        expiresIn: expect.any(Number),
        role: 'admin',
      }),
    );
    expect(response.body.expiresIn).toBeGreaterThan(0);
    expect(response.body.expiresIn).toBeLessThanOrEqual(3600);
  });

  it.each([
    ['unknown account', { email: 'unknown@example.test', password: 'Not-the-password!' }],
    ['incorrect password', { ...adminCredentials, password: 'Wrong-password!' }],
    ['empty password', { email: adminCredentials.email, password: '' }],
  ])('rejects login with %s using a stable 401 response', async (_scenario, credentials) => {
    const response = await request(makeApp())
      .post('/auth/login')
      .send(credentials);

    expectAuthenticationError(response, 401);
  });

  it.each([
    ['missing email', { password: adminCredentials.password }],
    ['missing password', { email: adminCredentials.email }],
    ['malformed email', { email: 'not-an-email', password: adminCredentials.password }],
  ])('rejects invalid login input (%s) with HTTP 400', async (_scenario, credentials) => {
    const response = await request(makeApp())
      .post('/auth/login')
      .send(credentials);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: expect.any(String) });
  });

  it.each([
    ['malformed bearer token', 'Bearer not-a-signed-token'],
    ['expired signed token', `Bearer ${createExpiredAdminToken()}`],
  ])('returns a stable 401 response for an %s', async (_scenario, authorization) => {
    const response = await request(makeApp())
      .get('/students')
      .set('Authorization', authorization);

    expectAuthenticationError(response, 401);
  });

  it('allows an administrator to list, view, create, and update students', async () => {
    const app = makeApp();
    const token = await login(app, adminCredentials);

    const created = await request(app)
      .post('/students')
      .set('Authorization', `Bearer ${token}`)
      .send(student);
    expect(created.status).toBe(201);

    const listed = await request(app)
      .get('/students')
      .set('Authorization', `Bearer ${token}`);
    expect(listed.status).toBe(200);
    expect(listed.body.items).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: student.id })]),
    );

    const viewed = await request(app)
      .get(`/students/${student.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(viewed.status).toBe(200);
    expect(viewed.body).toMatchObject({ id: student.id });

    const updated = await request(app)
      .put(`/students/${student.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ fullName: 'Nguyen Thi Binh', email: 'binh.auth@example.com' });
    expect(updated.status).toBe(200);
    expect(updated.body).toMatchObject({
      id: student.id,
      fullName: 'Nguyen Thi Binh',
      email: 'binh.auth@example.com',
    });
  });

  it('allows staff to list and view students', async () => {
    const app = makeApp();
    const token = await login(app, staffCredentials);
    const created = await request(app)
      .post('/students')
      .set('Authorization', `Bearer ${await login(app, adminCredentials)}`)
      .send(student);
    expect(created.status).toBe(201);

    const listed = await request(app)
      .get('/students')
      .set('Authorization', `Bearer ${token}`);
    expect(listed.status).toBe(200);

    const viewed = await request(app)
      .get(`/students/${student.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(viewed.status).toBe(200);
  });

  it.each([
    ['create', 'post', '/students'],
    ['update', 'put', '/students/student-auth-001'],
  ] as const)(
    'returns a stable 403 response when read-only staff attempt to %s a student',
    async (_operation, method, path) => {
      const app = makeApp();
      const token = await login(app, staffCredentials);
      const route = request(app)[method](path).set(
        'Authorization',
        `Bearer ${token}`,
      );
      const response =
        method === 'post' || method === 'put'
          ? await route.send(student)
          : await route;

      expectAuthenticationError(response, 403);
    },
  );
});
