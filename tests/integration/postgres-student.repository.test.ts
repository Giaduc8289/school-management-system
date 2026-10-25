import { randomUUID } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import request from 'supertest';
import { createApp } from '../../src/app';
import type { StudentRepository } from '../../src/application/ports/student-repository.interface';
import { Student } from '../../src/domain/entities/student.entity';

interface QueryClient {
  query(
    statement: string,
    values?: unknown[],
  ): Promise<{ rows: Record<string, unknown>[] }>;
  end(): Promise<void>;
}

interface PostgresPoolConstructor {
  new (options: {
    connectionString: string;
    options?: string;
  }): QueryClient;
}

interface PostgresRepositoryConstructor {
  new (client: QueryClient): StudentRepository;
}

const describeWithPostgres = process.env.TEST_DATABASE_URL ? describe : describe.skip;

describeWithPostgres('PostgresStudentRepository integration', () => {
  let adminPool: QueryClient | undefined;
  let testPool: QueryClient | undefined;
  let schemaName: string | undefined;
  let repository: StudentRepository;

  beforeAll(async () => {
    const connectionString = process.env.TEST_DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        'TEST_DATABASE_URL must point to a disposable PostgreSQL test database.',
      );
    }

    const { Pool } = require('pg') as { Pool: PostgresPoolConstructor };
    adminPool = new Pool({ connectionString });
    schemaName = `student_test_${randomUUID().replace(/-/g, '')}`;
    await adminPool.query(`CREATE SCHEMA "${schemaName}"`);

    testPool = new Pool({
      connectionString,
      options: `-c search_path=${schemaName}`,
    });

    const migrationsDirectory = path.resolve(
      __dirname,
      '../../src/infrastructure/database/migrations',
    );
    const migrationFiles = readdirSync(migrationsDirectory)
      .filter((fileName) => fileName.endsWith('.sql'))
      .sort();
    expect(migrationFiles.length).toBeGreaterThan(0);

    for (const fileName of migrationFiles) {
      const migration = readFileSync(
        path.join(migrationsDirectory, fileName),
        'utf8',
      );
      await testPool.query(migration);
    }

    const { PostgresStudentRepository } = require(
      '../../src/infrastructure/repositories/postgres-student.repository',
    ) as { PostgresStudentRepository: PostgresRepositoryConstructor };
    repository = new PostgresStudentRepository(testPool);
  });

  afterAll(async () => {
    await testPool?.end();
    if (adminPool && schemaName) {
      await adminPool.query(`DROP SCHEMA "${schemaName}" CASCADE`);
    }
    await adminPool?.end();
  });

  function makeStudent(overrides: {
    id?: string;
    code?: string;
    fullName?: string;
    email?: string;
    status?: 'active' | 'inactive';
  } = {}): Student {
    return new Student({
      id: overrides.id ?? `student-${randomUUID()}`,
      code: overrides.code ?? 'STU-2026-0099',
      fullName: overrides.fullName ?? 'Nguyen Van An',
      email: overrides.email ?? 'an.nguyen@example.com',
      dateOfBirth: new Date('2012-05-15T00:00:00.000Z'),
      status: overrides.status ?? 'active',
    });
  }

  it('persists and retrieves every student field', async () => {
    const student = makeStudent();

    const savedStudent = await repository.save(student);
    const foundStudent = await repository.findById(student.id);

    expect(savedStudent).toMatchObject({
      id: student.id,
      code: student.code,
      fullName: student.fullName,
      email: student.email,
      dateOfBirth: student.dateOfBirth,
      status: student.status,
    });
    expect(foundStudent).toMatchObject({
      id: student.id,
      code: student.code,
      fullName: student.fullName,
      email: student.email,
      dateOfBirth: student.dateOfBirth,
      status: student.status,
    });
  });

  it('updates and returns the persisted student when saving the same ID', async () => {
    const id = `student-update-${randomUUID()}`;
    const original = makeStudent({ id });
    const updated = makeStudent({
      id,
      fullName: 'Nguyen Thi Binh',
      email: 'binh.nguyen@example.com',
      status: 'inactive',
    });

    await repository.save(original);
    const savedUpdate = await repository.save(updated);

    expect(savedUpdate).toMatchObject({
      id,
      fullName: 'Nguyen Thi Binh',
      email: 'binh.nguyen@example.com',
      status: 'inactive',
    });
    await expect(repository.findById(id)).resolves.toMatchObject({
      fullName: 'Nguyen Thi Binh',
      email: 'binh.nguyen@example.com',
      status: 'inactive',
    });
  });

  it('returns undefined for a student ID that does not exist', async () => {
    await expect(
      repository.findById(`missing-${randomUUID()}`),
    ).resolves.toBeUndefined();
  });

  it('makes saved records visible to a newly created repository instance', async () => {
    const student = makeStudent();
    await repository.save(student);

    const { PostgresStudentRepository } = require(
      '../../src/infrastructure/repositories/postgres-student.repository',
    ) as { PostgresStudentRepository: PostgresRepositoryConstructor };
    const secondRepository = new PostgresStudentRepository(testPool!);

    await expect(secondRepository.findById(student.id)).resolves.toMatchObject({
      id: student.id,
      email: student.email,
    });
  });

  it('surfaces database failures instead of returning a successful result', async () => {
    const databaseError = new Error('database unavailable');
    const failingClient: QueryClient = {
      query: async () => {
        throw databaseError;
      },
      end: async () => undefined,
    };
    const { PostgresStudentRepository } = require(
      '../../src/infrastructure/repositories/postgres-student.repository',
    ) as { PostgresStudentRepository: PostgresRepositoryConstructor };
    const failingRepository = new PostgresStudentRepository(failingClient);

    await expect(failingRepository.save(makeStudent())).rejects.toBe(
      databaseError,
    );
  });

  it('allows application composition to inject the PostgreSQL repository', async () => {
    const student = makeStudent();
    const response = await request(createApp(repository))
      .post('/students')
      .send({
        id: student.id,
        code: student.code,
        fullName: student.fullName,
        email: student.email,
        dateOfBirth: student.dateOfBirth.toISOString(),
      });

    expect(response.status).toBe(201);
    await expect(repository.findById(student.id)).resolves.toMatchObject({
      id: student.id,
      code: student.code,
      fullName: student.fullName,
      email: student.email,
    });
  });
});
