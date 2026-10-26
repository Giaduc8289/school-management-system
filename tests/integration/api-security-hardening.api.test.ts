import request from 'supertest';
import { createApp } from '../../src/app';
import { InMemoryStudentRepository } from '../../src/infrastructure/repositories/in-memory-student.repository';

const signingKey = 'test-only-api-security-signing-key';
const staffCredentials = {
  email: 'security-admin@example.test',
  password: 'test-only-password',
};

const validStudent = {
  id: 'student-security-001',
  code: 'STU-2026-9001',
  fullName: 'Synthetic Security Test Student',
  email: 'security.student@example.test',
  dateOfBirth: '2012-05-15T00:00:00.000Z',
};

const environmentKeys = [
  'JWT_SECRET',
  'NODE_ENV',
  'AUTH_ADMIN_EMAIL',
  'AUTH_ADMIN_PASSWORD',
  'AUTH_ADMIN_PASSWORD_HASH',
] as const;

const originalEnvironment = Object.fromEntries(
  environmentKeys.map((key) => [key, process.env[key]]),
) as Partial<Record<(typeof environmentKeys)[number], string>>;

function makeApp() {
  process.env.JWT_SECRET = signingKey;
  process.env.NODE_ENV = 'test';
  process.env.AUTH_ADMIN_EMAIL = staffCredentials.email;
  process.env.AUTH_ADMIN_PASSWORD = staffCredentials.password;
  delete process.env.AUTH_ADMIN_PASSWORD_HASH;

  return createApp(new InMemoryStudentRepository());
}

async function login(app: ReturnType<typeof makeApp>): Promise<string> {
  const response = await request(app)
    .post('/auth/login')
    .send(staffCredentials);

  expect(response.status).toBe(200);
  expect(response.body).toEqual(
    expect.objectContaining({
      accessToken: expect.any(String),
      tokenType: 'Bearer',
    }),
  );

  return response.body.accessToken as string;
}

function expectSanitizedRateLimit(response: {
  status: number;
  body: unknown;
}): void {
  expect(response.status).toBe(429);
  expect(response.body).toEqual({ error: expect.any(String) });
  expect(JSON.stringify(response.body)).not.toMatch(
    /password|token|stack|exception|internal/i,
  );
}

describe('API security hardening', () => {
  afterEach(() => {
    for (const key of environmentKeys) {
      const originalValue = originalEnvironment[key];
      if (originalValue === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = originalValue;
      }
    }
  });

  it('sets secure response headers and does not disclose Express', async () => {
    const response = await request(makeApp()).get('/health');

    expect(response.status).toBe(200);
    expect(response.headers['x-powered-by']).toBeUndefined();
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBeDefined();
    expect(response.headers['referrer-policy']).toBeDefined();
    expect(response.headers['content-security-policy']).toBeDefined();
  });

  it('rejects JSON requests larger than 1 MiB with a stable sanitized 413 response', async () => {
    const app = makeApp();
    const oversizedBody = { payload: 'x'.repeat(1024 * 1024 + 1) };

    const firstResponse = await request(app)
      .post('/auth/login')
      .send(oversizedBody);
    const secondResponse = await request(app)
      .post('/auth/login')
      .send(oversizedBody);

    expect(firstResponse.status).toBe(413);
    expect(firstResponse.headers['content-type']).toMatch(/application\/json/);
    expect(firstResponse.body).toEqual({ error: expect.any(String) });
    expect(secondResponse.status).toBe(413);
    expect(secondResponse.body).toEqual(firstResponse.body);
    expect(JSON.stringify(firstResponse.body)).not.toMatch(
      /password|token|stack|exception|internal|bytes|entity/i,
    );
  });

  it('limits staff login attempts and ignores spoofed forwarded IPs by default', async () => {
    const app = makeApp();

    for (let attempt = 1; attempt <= 5; attempt += 1) {
      const response = await request(app)
        .post('/auth/login')
        .set('X-Forwarded-For', `198.51.100.${attempt}`)
        .send({ ...staffCredentials, password: 'incorrect-password' });

      expect(response.status).toBe(401);
    }

    const limitedResponse = await request(app)
      .post('/auth/login')
      .set('X-Forwarded-For', '203.0.113.200')
      .send({ ...staffCredentials, password: 'incorrect-password' });
    const repeatedResponse = await request(app)
      .post('/auth/login')
      .set('X-Forwarded-For', '192.0.2.200')
      .send({ ...staffCredentials, password: 'incorrect-password' });

    expectSanitizedRateLimit(limitedResponse);
    expectSanitizedRateLimit(repeatedResponse);
    expect(repeatedResponse.body).toEqual(limitedResponse.body);
  });

  it('limits general API requests with a sanitized stable 429 response', async () => {
    const app = makeApp();
    const token = await login(app);
    let lastResponse: request.Response | undefined;

    for (let requestNumber = 1; requestNumber <= 101; requestNumber += 1) {
      lastResponse = await request(app)
        .get('/students')
        .set('Authorization', `Bearer ${token}`);
    }

    const repeatedResponse = await request(app)
      .get('/students')
      .set('Authorization', `Bearer ${token}`);

    expect(lastResponse).toBeDefined();
    expectSanitizedRateLimit(lastResponse!);
    expectSanitizedRateLimit(repeatedResponse);
    expect(repeatedResponse.body).toEqual(lastResponse!.body);
  });

  it('preserves successful staff authentication and API requests below the limit', async () => {
    const app = makeApp();
    const token = await login(app);

    const created = await request(app)
      .post('/students')
      .set('Authorization', `Bearer ${token}`)
      .send(validStudent);
    const listed = await request(app)
      .get('/students')
      .set('Authorization', `Bearer ${token}`);

    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ id: validStudent.id });
    expect(listed.status).toBe(200);
    expect(listed.body.items).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: validStudent.id })]),
    );
  });
});
