import { Student } from '../../domain/entities/student.entity';
import type { StudentRepository } from '../../application/ports/student-repository.interface';

interface StudentRecord {
  id: string;
  code: string;
  full_name: string;
  email: string;
  date_of_birth: Date | string;
  status: 'active' | 'inactive';
}

export interface StudentQueryClient {
  query(
    statement: string,
    values?: unknown[],
  ): Promise<{ rows: StudentRecord[] }>;
}

export class PostgresStudentRepository implements StudentRepository {
  constructor(private readonly client: StudentQueryClient) {}

  async save(student: Student): Promise<Student> {
    const result = await this.client.query(
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
      [
        student.id,
        student.code,
        student.fullName,
        student.email,
        student.dateOfBirth,
        student.status,
      ],
    );

    const record = result.rows[0];
    if (!record) {
      throw new Error('The database did not return the saved student.');
    }
    return this.toStudent(record);
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
