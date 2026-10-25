import type { StudentProfile } from '../../domain/entities/student.entity';
import type { StudentRepository } from '../ports/student-repository.interface';
import { StudentNotFoundError } from '../errors/student-not-found.error';

export class UpdateStudentUseCase {
  constructor(private readonly studentRepository: StudentRepository) {}

  async execute(id: string, profile: StudentProfile) {
    const student = await this.studentRepository.findById(id);
    if (!student) {
      throw new StudentNotFoundError(id);
    }

    student.updateProfile(profile);
    return this.studentRepository.save(student);
  }
}
