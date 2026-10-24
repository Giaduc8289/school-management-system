import { DomainError } from './domain.error';

export class StudentError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}
