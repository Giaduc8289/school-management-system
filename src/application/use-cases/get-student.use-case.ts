import type { StudentRepository } from '../ports/student-repository.interface';
import { StudentNotFoundError } from '../errors/student-not-found.error';

export class GetStudentByIdUseCase {
  constructor(private readonly studentRepository: StudentRepository) {}

  async execute(id: string) {
    if (typeof id !== 'string' || !id.trim()) {
      throw new TypeError('Student ID must not be empty.');
    }

    const student = await this.studentRepository.findById(id);
    if (!student) {
      throw new StudentNotFoundError(id);
    }

    return student;
  }
}
