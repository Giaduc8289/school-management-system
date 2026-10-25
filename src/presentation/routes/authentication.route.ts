import { Router } from 'express';
import { InvalidCredentialsError } from '../../application/errors/invalid-credentials.error';
import type { LoginStaffUseCase } from '../../application/use-cases/login-staff.use-case';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function createAuthenticationRouter(loginStaff: LoginStaffUseCase): Router {
  const router = Router();

  router.post('/auth/login', async (request, response, next) => {
    const body: unknown = request.body;
    if (
      !isRecord(body) ||
      typeof body.email !== 'string' ||
      typeof body.password !== 'string' ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())
    ) {
      response.status(400).json({ error: 'A valid email and password are required.' });
      return;
    }

    try {
      const result = await loginStaff.execute({
        email: body.email.trim().toLowerCase(),
        password: body.password,
      });
      response.status(200).json(result);
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        response.status(401).json({ error: error.message });
        return;
      }
      next(error);
    }
  });

  return router;
}
