import type { StudentRepository } from '../../src/application/ports/student-repository.interface';
import type { Express } from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';

const testSigningKey = 'task-011-test-signing-key-with-more-than-32-characters';
const configuredPasswordHash = `$2b$10$${'a'.repeat(53)}`;
const environmentKeys = [
  'JWT_SECRET',
  'AUTH_ADMIN_EMAIL',
  'AUTH_ADMIN_PASSWORD_HASH',
  'AUTH_STAFF_EMAIL',
  'AUTH_STAFF_PASSWORD_HASH',
  'API_DOCS_ENABLED',
  'NODE_ENV',
  'PORT',
] as const;

type EnvironmentSnapshot = Partial<Record<(typeof environmentKeys)[number], string>>;

function saveEnvironment(): EnvironmentSnapshot {
  return Object.fromEntries(
    environmentKeys.map((key) => [key, process.env[key]]),
  ) as EnvironmentSnapshot;
}

function restoreEnvironment(snapshot: EnvironmentSnapshot): void {
  for (const key of environmentKeys) {
    const value = snapshot[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

function configureEnvironment(overrides: NodeJS.ProcessEnv = {}): void {
  process.env.JWT_SECRET = testSigningKey;
  process.env.AUTH_ADMIN_EMAIL = 'admin@task-011.example.test';
  process.env.AUTH_ADMIN_PASSWORD_HASH = configuredPasswordHash;
  process.env.AUTH_STAFF_EMAIL = 'staff@task-011.example.test';
  process.env.AUTH_STAFF_PASSWORD_HASH = configuredPasswordHash;
  process.env.API_DOCS_ENABLED = 'true';
  process.env.NODE_ENV = 'test';
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

function makeApp(
  repository?: StudentRepository,
  overrides: NodeJS.ProcessEnv = {},
): Express {
  configureEnvironment(overrides);
  let app!: Express;
  jest.isolateModules(() => {
    const { createApp } = require('../../src/app') as typeof import('../../src/app');
    app = createApp(repository);
  });
  return app;
}

function createAdminAuthorization(): string {
  const token = jwt.sign(
    { role: 'admin' },
    testSigningKey,
    {
      algorithm: 'HS256',
      subject: 'admin@task-011.example.test',
      expiresIn: 300,
    },
  );
  return `Bearer ${token}`;
}

describe('API documentation and operational endpoints', () => {
  const initialEnvironment = saveEnvironment();

  afterEach(() => {
    jest.restoreAllMocks();
    restoreEnvironment(initialEnvironment);
  });

  describe('OpenAPI and interactive API documentation', () => {
    it('publishes a valid OpenAPI document for health, authentication, and student routes', async () => {
      const response = await request(makeApp()).get('/openapi.json');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toMatchObject({
        openapi: expect.stringMatching(/^3\./),
        info: {
          title: expect.any(String),
          version: expect.any(String),
        },
        paths: expect.objectContaining({
          '/health/live': expect.any(Object),
          '/health/ready': expect.any(Object),
          '/auth/login': expect.any(Object),
          '/students': expect.any(Object),
          '/students/{id}': expect.any(Object),
        }),
      });
    });

    it('documents request, response, security, and error schemas for API operations', async () => {
      const response = await request(makeApp()).get('/openapi.json');
      expect(response.status).toBe(200);
      const document = response.body;

      expect(document.paths['/auth/login'].post).toMatchObject({
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: expect.objectContaining({
                required: expect.arrayContaining(['email', 'password']),
              }),
            },
          },
        },
        responses: expect.objectContaining({
          '200': expect.any(Object),
          '400': expect.any(Object),
          '401': expect.any(Object),
        }),
      });
      expect(document.paths['/students'].get).toMatchObject({
        security: [{ bearerAuth: [] }],
        responses: expect.objectContaining({
          '200': expect.any(Object),
          '401': expect.any(Object),
          '403': expect.any(Object),
        }),
      });
      expect(document.paths['/students'].post.responses).toEqual(
        expect.objectContaining({
          '201': expect.any(Object),
          '400': expect.any(Object),
          '401': expect.any(Object),
          '403': expect.any(Object),
          '409': expect.any(Object),
        }),
      );
      expect(document.paths['/students/{id}'].get.responses).toEqual(
        expect.objectContaining({
          '200': expect.any(Object),
          '401': expect.any(Object),
          '403': expect.any(Object),
          '404': expect.any(Object),
        }),
      );
      expect(document.paths['/students/{id}'].put.responses).toEqual(
        expect.objectContaining({
          '200': expect.any(Object),
          '400': expect.any(Object),
          '401': expect.any(Object),
          '403': expect.any(Object),
          '404': expect.any(Object),
        }),
      );
      expect(document.components.securitySchemes.bearerAuth).toMatchObject({
        type: 'http',
        scheme: 'bearer',
      });
    });

    it('serves an interactive documentation UI that points to the OpenAPI document', async () => {
      const response = await request(makeApp()).get('/docs');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/text\/html/);
      expect(response.text).toMatch(/swagger|api documentation/i);
      expect(response.text).toContain('/openapi.json');
    });

    it.each([
      ['explicitly disabled', { API_DOCS_ENABLED: 'false' }],
      ['in production', { NODE_ENV: 'production' }],
    ])('does not expose documentation when %s', async (_scenario, overrides) => {
      const app = makeApp(undefined, overrides);

      await request(app).get('/openapi.json').expect(404);
      await request(app).get('/docs').expect(404);
    });
  });

  describe('liveness and readiness', () => {
    it('reports liveness independently of dependency readiness', async () => {
      const unavailableRepository = {
        create: jest.fn(),
        save: jest.fn(),
        findById: jest.fn(),
        findMany: jest.fn().mockRejectedValue(
          new Error('private database host and credentials'),
        ),
      } as unknown as StudentRepository;

      const response = await request(makeApp(unavailableRepository)).get(
        '/health/live',
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'ok' });
      expect(unavailableRepository.findMany).not.toHaveBeenCalled();
    });

    it('returns ready when required dependencies are available', async () => {
      const readyRepository = {
        create: jest.fn(),
        save: jest.fn(),
        findById: jest.fn(),
        findMany: jest.fn().mockResolvedValue({ items: [], total: 0 }),
      } as unknown as StudentRepository;

      const response = await request(makeApp(readyRepository)).get(
        '/health/ready',
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'ok' });
    });

    it('returns 503 without leaking dependency details when readiness checks fail', async () => {
      const unavailableRepository = {
        create: jest.fn(),
        save: jest.fn(),
        findById: jest.fn(),
        findMany: jest.fn().mockRejectedValue(
          new Error('private database host and credentials'),
        ),
      } as unknown as StudentRepository;

      const response = await request(makeApp(unavailableRepository)).get(
        '/health/ready',
      );

      expect(response.status).toBe(503);
      expect(response.body).toEqual({ status: 'unavailable' });
      expect(JSON.stringify(response.body)).not.toMatch(
        /private database host|credentials/i,
      );
    });
  });

  describe('runtime configuration validation', () => {
    it.each([
      ['missing', undefined],
      ['too short', 'short-secret'],
    ])('fails app startup with a clear non-secret message when JWT_SECRET is %s', (
      _scenario,
      signingKey,
    ) => {
      configureEnvironment({
        JWT_SECRET: signingKey,
      });

      expect(() => {
        jest.isolateModules(() => {
          require('../../src/app');
        });
      }).toThrow(/JWT_SECRET/);
    });

    it('rejects an invalid listening port before starting the server', () => {
      configureEnvironment({
        PORT: '70000',
      });

      expect(() => {
        jest.isolateModules(() => {
          require('../../src/server');
        });
      }).toThrow(/PORT must be an integer between 1 and 65535/);
    });
  });

  describe('request correlation and sensitive log redaction', () => {
    it('returns a request correlation identifier for supplied and generated IDs', async () => {
      const app = makeApp();
      const suppliedId = 'task-011-request-0001';
      const suppliedResponse = await request(app)
        .get('/health/live')
        .set('X-Request-Id', suppliedId);
      const generatedResponse = await request(app).get('/health/live');

      expect(suppliedResponse.headers['x-request-id']).toBe(suppliedId);
      expect(generatedResponse.headers['x-request-id']).toEqual(
        expect.any(String),
      );
      expect(generatedResponse.headers['x-request-id']).not.toBe('');
    });

    it('emits structured request logs without credentials, tokens, or student PII', async () => {
      const logEntries: unknown[][] = [];
      const consoleMethods = ['log', 'info', 'warn', 'error'] as const;
      for (const method of consoleMethods) {
        jest.spyOn(console, method).mockImplementation((...args: unknown[]) => {
          logEntries.push(args);
        });
      }

      const password = 'Highly-sensitive-test-password-917!';
      const accessToken = createAdminAuthorization();
      const studentName = 'Confidential Student Name';
      const studentEmail = 'confidential.student@example.test';
      const response = await request(makeApp())
        .post('/students')
        .set('Authorization', accessToken)
        .set('X-Request-Id', 'task-011-redaction-0001')
        .send({
          id: 'student-task-011-001',
          code: 'STU-2026-1101',
          fullName: studentName,
          email: studentEmail,
          dateOfBirth: '2012-05-15T00:00:00.000Z',
          password,
        });

      expect(response.status).toBe(201);
      expect(logEntries.length).toBeGreaterThan(0);

      const entries = logEntries.flat().map((entry) =>
        typeof entry === 'string' ? JSON.parse(entry) : entry,
      );
      const serializedLogs = entries.map((entry) => JSON.stringify(entry));

      expect(entries).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            requestId: 'task-011-redaction-0001',
            level: expect.any(String),
          }),
        ]),
      );
      const combinedLogs = serializedLogs.join('\n');
      expect(combinedLogs).not.toContain(password);
      expect(combinedLogs).not.toContain(accessToken.replace(/^Bearer /, ''));
      expect(combinedLogs).not.toContain('student-task-011-001');
      expect(combinedLogs).not.toContain(studentName);
      expect(combinedLogs).not.toContain(studentEmail);
    });
  });
});
