export class InvalidStudentQueryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidStudentQueryError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
