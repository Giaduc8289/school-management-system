import { Router } from 'express';
import type { CreateStudentUseCase } from '../../application/use-cases/create-student.use-case';
import type { UpdateStudentUseCase } from '../../application/use-cases/update-student.use-case';
import { createStudentController } from '../controllers/student.controller';

export function createStudentRouter(
  createStudent: CreateStudentUseCase,
  updateStudent: UpdateStudentUseCase,
): Router {
  const router = Router();
  const controller = createStudentController(createStudent, updateStudent);

  router.post('/students', controller.create);
  router.put('/students/:id', controller.update);

  return router;
}
