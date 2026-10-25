import type { Student } from '../../domain/entities/student.entity';

export interface StudentRepository {
  save(student: Student): Promise<Student>;
  findById(id: string): Promise<Student | undefined>;
}
