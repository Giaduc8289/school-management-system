import { Router } from 'express';
import type { StudentRepository } from '../../application/ports/student-repository.interface';
import { getHealth } from '../controllers/health.controller';

export function createHealthRouter(
  studentRepository: StudentRepository,
): Router {
  const healthRouter = Router();

  healthRouter.get('/health', getHealth);
  healthRouter.get('/health/live', getHealth);
  healthRouter.get('/health/ready', async (_request, response) => {
    try {
      if (studentRepository.checkHealth) {
        await studentRepository.checkHealth();
      } else {
        await studentRepository.findMany({
          page: 1,
          pageSize: 1,
          status: undefined,
          search: undefined,
        });
      }
      response.status(200).json({ status: 'ok' });
    } catch {
      response.status(503).json({ status: 'unavailable' });
    }
  });

  return healthRouter;
}
