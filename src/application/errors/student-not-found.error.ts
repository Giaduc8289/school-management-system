export class StudentNotFoundError extends Error {
  constructor(id: string) {
    super(`Student with ID "${id}" was not found.`);
    this.name = 'StudentNotFoundError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
