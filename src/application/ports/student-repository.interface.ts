import type { Student } from '../../domain/entities/student.entity';
import type { StudentStatus } from '../../domain/entities/student.entity';

export interface FindStudentsQuery {
  page: number;
  pageSize: number;
  status: StudentStatus | undefined;
  search: string | undefined;
}

export interface FindStudentsResult {
  items: Student[];
  total: number;
}

export interface StudentRepository {
  create(student: Student): Promise<Student>;
  save(student: Student): Promise<Student>;
  findById(id: string): Promise<Student | undefined>;
  findMany(query: FindStudentsQuery): Promise<FindStudentsResult>;
  checkHealth?(): Promise<void>;
}
