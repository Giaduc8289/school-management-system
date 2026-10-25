import type { ErrorRequestHandler } from 'express';
import { InvalidStudentQueryError } from '../../application/errors/invalid-student-query.error';
import { StudentNotFoundError } from '../../application/errors/student-not-found.error';
import { DomainError } from '../../domain/errors/domain.error';
import { BadRequestError } from '../errors/bad-request.error';

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _request,
  response,
  _next,
): void => {
  if (error instanceof StudentNotFoundError) {
    response.status(404).json({ error: error.message });
    return;
  }

  if (
    error instanceof BadRequestError ||
    error instanceof DomainError ||
    error instanceof InvalidStudentQueryError
  ) {
    response.status(400).json({ error: error.message });
    return;
  }

  if (
    error instanceof SyntaxError &&
    'status' in error &&
    error.status === 400
  ) {
    response.status(400).json({ error: 'Request body contains invalid JSON.' });
    return;
  }

  response.status(500).json({ error: 'Internal server error.' });
};
