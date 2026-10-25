import { Router } from 'express';
import type { CreateStudentUseCase } from '../../application/use-cases/create-student.use-case';
import type { GetStudentByIdUseCase } from '../../application/use-cases/get-student.use-case';
import type { ListStudentsUseCase } from '../../application/use-cases/list-students.use-case';
import type { UpdateStudentUseCase } from '../../application/use-cases/update-student.use-case';
import { createStudentController } from '../controllers/student.controller';

export function createStudentRouter(
  createStudent: CreateStudentUseCase,
  updateStudent: UpdateStudentUseCase,
  getStudent: GetStudentByIdUseCase,
  listStudents: ListStudentsUseCase,
): Router {
  const router = Router();
  const controller = createStudentController(
    createStudent,
    updateStudent,
    getStudent,
    listStudents,
  );

  router.get('/students', controller.list);
  router.get('/students/:id', controller.get);
  router.post('/students', controller.create);
  router.put('/students/:id', controller.update);

  return router;
}
