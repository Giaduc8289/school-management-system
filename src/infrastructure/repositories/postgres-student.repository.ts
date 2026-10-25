import { Student } from '../../domain/entities/student.entity';
import { StudentConflictError } from '../../application/errors/student-conflict.error';
import type {
  FindStudentsQuery,
  FindStudentsResult,
  StudentRepository,
} from '../../application/ports/student-repository.interface';

interface StudentRecord {
  id: string;
  code: string;
  full_name: string;
  email: string;
  date_of_birth: Date | string;
  status: 'active' | 'inactive';
}

export interface StudentQueryClient {
  query<Row = StudentRecord>(
    statement: string,
    values?: unknown[],
  ): Promise<{ rows: Row[] }>;
}

interface StudentCountRecord {
  total: string | number;
}

export class PostgresStudentRepository implements StudentRepository {
  constructor(private readonly client: StudentQueryClient) {}

  async create(student: Student): Promise<Student> {
    try {
      const result = await this.client.query(
        `INSERT INTO students (
           id, code, full_name, email, date_of_birth, status
         )
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, code, full_name, email, date_of_birth, status`,
        this.toValues(student),
      );

      const record = result.rows[0];
      if (!record) {
        throw new Error('The database did not return the created student.');
      }
      return this.toStudent(record);
    } catch (error) {
      if (this.isStudentUniqueViolation(error)) {
        throw new StudentConflictError();
      }
      throw error;
    }
  }

  async save(student: Student): Promise<Student> {
    let result;
    try {
      result = await this.client.query(
        `INSERT INTO students (
           id, code, full_name, email, date_of_birth, status
         )
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET
           code = EXCLUDED.code,
           full_name = EXCLUDED.full_name,
           email = EXCLUDED.email,
           date_of_birth = EXCLUDED.date_of_birth,
           status = EXCLUDED.status
         RETURNING id, code, full_name, email, date_of_birth, status`,
        this.toValues(student),
      );
    } catch (error) {
      if (this.isStudentUniqueViolation(error)) {
        throw new StudentConflictError();
      }
      throw error;
    }

    const record = result.rows[0];
    if (!record) {
      throw new Error('The database did not return the saved student.');
    }
    return this.toStudent(record);
  }

  private toValues(student: Student): unknown[] {
    return [
      student.id,
      student.code,
      student.fullName,
      student.email,
      student.dateOfBirth,
      student.status,
    ];
  }

  private isStudentUniqueViolation(error: unknown): boolean {
    if (typeof error !== 'object' || error === null) {
      return false;
    }

    const databaseError = error as {
      code?: unknown;
      constraint?: unknown;
    };
    return (
      databaseError.code === '23505' &&
      (databaseError.constraint === 'students_pkey' ||
        databaseError.constraint === 'students_code_key')
    );
  }

  async findById(id: string): Promise<Student | undefined> {
    const result = await this.client.query(
      `SELECT id, code, full_name, email, date_of_birth, status
       FROM students
       WHERE id = $1`,
      [id],
    );

    const record = result.rows[0];
    return record ? this.toStudent(record) : undefined;
  }

  async findMany(query: FindStudentsQuery): Promise<FindStudentsResult> {
    const conditions: string[] = [];
    const filterValues: unknown[] = [];

    if (query.status !== undefined) {
      filterValues.push(query.status);
      conditions.push(`status = $${filterValues.length}`);
    }

    if (query.search !== undefined) {
      filterValues.push(query.search);
      const parameter = `$${filterValues.length}`;
      conditions.push(
        `(POSITION(LOWER(${parameter}) IN LOWER(code)) > 0
          OR POSITION(LOWER(${parameter}) IN LOWER(full_name)) > 0
          OR POSITION(LOWER(${parameter}) IN LOWER(email)) > 0)`,
      );
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(' AND ')}`
      : '';
    const countResult = await this.client.query<StudentCountRecord>(
      `SELECT COUNT(*) AS total FROM students ${whereClause}`,
      filterValues,
    );
    const total = Number(countResult.rows[0]?.total ?? 0);

    const offset = (query.page - 1) * query.pageSize;
    const result = await this.client.query<StudentRecord>(
      `SELECT id, code, full_name, email, date_of_birth, status
       FROM students
       ${whereClause}
       ORDER BY id ASC
       LIMIT $${filterValues.length + 1}
       OFFSET $${filterValues.length + 2}`,
      [...filterValues, query.pageSize, offset],
    );

    return {
      items: result.rows.map((record) => this.toStudent(record)),
      total,
    };
  }

  private toStudent(record: StudentRecord): Student {
    return new Student({
      id: record.id,
      code: record.code,
      fullName: record.full_name,
      email: record.email,
      dateOfBirth: new Date(record.date_of_birth),
      status: record.status,
    });
  }
}
