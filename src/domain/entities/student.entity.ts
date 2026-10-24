import { StudentError } from '../errors/student.error';
import { StudentCode } from '../value-objects/student-code.vo';

export type StudentStatus = 'active' | 'inactive';

export interface StudentData {
  id: string;
  code: string;
  fullName: string;
  email: string;
  dateOfBirth: Date;
  status: StudentStatus;
}

export interface StudentProfile {
  fullName: string;
  email: string;
}

export class Student {
  readonly id: string;
  readonly code: string;
  readonly dateOfBirth: Date;
  private _fullName: string;
  private _email: string;
  private _status: StudentStatus;

  constructor(data: StudentData) {
    if (!data.id.trim()) {
      throw new StudentError('Student ID must not be empty.');
    }

    this.id = data.id;
    this.code = StudentCode.create(data.code).value;
    this._fullName = Student.validateFullName(data.fullName);
    this._email = Student.validateEmail(data.email);
    this.dateOfBirth = Student.validateDateOfBirth(data.dateOfBirth);

    if (data.status !== 'active' && data.status !== 'inactive') {
      throw new StudentError('Student status must be active or inactive.');
    }

    this._status = data.status;
  }

  get fullName(): string {
    return this._fullName;
  }

  get email(): string {
    return this._email;
  }

  get status(): StudentStatus {
    return this._status;
  }

  updateProfile(profile: StudentProfile): void {
    const fullName = Student.validateFullName(profile.fullName);
    const email = Student.validateEmail(profile.email);
    this._fullName = fullName;
    this._email = email;
  }

  deactivate(): void {
    this._status = 'inactive';
  }

  activate(): void {
    this._status = 'active';
  }

  private static validateFullName(value: string): string {
    if (!value.trim()) {
      throw new StudentError('Student full name must not be empty.');
    }
    return value;
  }

  private static validateEmail(value: string): string {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      throw new StudentError('Student email address is invalid.');
    }
    return value;
  }

  private static validateDateOfBirth(value: Date): Date {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
      throw new StudentError('Student date of birth must be a valid date.');
    }

    const today = new Date();
    const age =
      today.getUTCFullYear() -
      value.getUTCFullYear() -
      (today.getUTCMonth() < value.getUTCMonth() ||
      (today.getUTCMonth() === value.getUTCMonth() &&
        today.getUTCDate() < value.getUTCDate())
        ? 1
        : 0);

    if (age < 6 || age > 18) {
      throw new StudentError('Student must be between 6 and 18 years old.');
    }

    return value;
  }
}
