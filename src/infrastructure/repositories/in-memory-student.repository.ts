import type { Student } from '../../domain/entities/student.entity';
import type { StudentRepository } from '../../application/ports/student-repository.interface';

export class InMemoryStudentRepository implements StudentRepository {
  private readonly students = new Map<string, Student>();

  async save(student: Student): Promise<Student> {
    this.students.set(student.id, student);
    return student;
  }

  async findById(id: string): Promise<Student | undefined> {
    return this.students.get(id);
  }
}
