import type { StudentRepository } from '../../application/ports/student-repository.interface';
import { createPostgresPool } from '../database/postgres-pool';
import { InMemoryStudentRepository } from './in-memory-student.repository';
import { PostgresStudentRepository } from './postgres-student.repository';

export function createConfiguredStudentRepository(): StudentRepository {
  if (!process.env.DATABASE_URL?.trim()) {
    return new InMemoryStudentRepository();
  }

  return new PostgresStudentRepository(createPostgresPool());
}
