import type { Student } from '../../domain/entities/student.entity';
import type {
  FindStudentsQuery,
  FindStudentsResult,
  StudentRepository,
} from '../../application/ports/student-repository.interface';

export class InMemoryStudentRepository implements StudentRepository {
  private readonly students = new Map<string, Student>();

  async save(student: Student): Promise<Student> {
    this.students.set(student.id, student);
    return student;
  }

  async findById(id: string): Promise<Student | undefined> {
    return this.students.get(id);
  }

  async findMany(query: FindStudentsQuery): Promise<FindStudentsResult> {
    const search = query.search?.toLowerCase();
    const matches = [...this.students.values()]
      .filter(
        (student) =>
          query.status === undefined || student.status === query.status,
      )
      .filter(
        (student) =>
          search === undefined ||
          student.code.toLowerCase().includes(search) ||
          student.fullName.toLowerCase().includes(search) ||
          student.email.toLowerCase().includes(search),
      )
      .sort((left, right) => left.id.localeCompare(right.id));
    const offset = (query.page - 1) * query.pageSize;

    return {
      items: matches.slice(offset, offset + query.pageSize),
      total: matches.length,
    };
  }
}
