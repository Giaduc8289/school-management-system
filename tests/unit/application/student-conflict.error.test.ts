import { StudentConflictError } from '../../../src/application/errors/student-conflict.error';

describe('StudentConflictError', () => {
  it('is a typed application error with a stable, non-sensitive message', () => {
    const error = new StudentConflictError();

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('StudentConflictError');
    expect(error.message).toBe(
      'A student with this ID or code already exists.',
    );
    expect(error.message).not.toMatch(/sql|schema|postgres|constraint/i);
  });
});
