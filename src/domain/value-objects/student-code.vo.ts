import { StudentError } from '../errors/student.error';

export class StudentCode {
  private constructor(public readonly value: string) {}

  static create(value: string): StudentCode {
    if (!value.trim()) {
      throw new StudentError('Student code must not be empty.');
    }

    if (!/^STU-\d{4}-\d{4}$/.test(value)) {
      throw new StudentError('Student code must match STU-YYYY-NNNN.');
    }

    return new StudentCode(value);
  }
}
