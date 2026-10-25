export class StudentConflictError extends Error {
  constructor() {
    super('A student with this ID or code already exists.');
    this.name = 'StudentConflictError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
