import { Student } from '../../domain/entities/student.entity';
import type { StudentRepository } from '../ports/student-repository.interface';

export interface CreateStudentInput {
  id: string;
  code: string;
  fullName: string;
  email: string;
  dateOfBirth: Date;
}

export class CreateStudentUseCase {
  constructor(private readonly studentRepository: StudentRepository) {}

  async execute(input: CreateStudentInput): Promise<Student> {
    const student = new Student({
      ...input,
      status: 'active',
    });

    return this.studentRepository.save(student);
  }
}
