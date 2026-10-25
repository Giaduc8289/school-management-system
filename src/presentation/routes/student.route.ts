import { Router, type RequestHandler } from 'express';
import type { CreateStudentUseCase } from '../../application/use-cases/create-student.use-case';
import type { GetStudentByIdUseCase } from '../../application/use-cases/get-student.use-case';
import type { ListStudentsUseCase } from '../../application/use-cases/list-students.use-case';
import type { UpdateStudentUseCase } from '../../application/use-cases/update-student.use-case';
import { createStudentController } from '../controllers/student.controller';
import { authorizeStudentPermission } from '../middleware/authorization';

export function createStudentRouter(
  createStudent: CreateStudentUseCase,
  updateStudent: UpdateStudentUseCase,
  getStudent: GetStudentByIdUseCase,
  listStudents: ListStudentsUseCase,
  authenticate: RequestHandler,
): Router {
  const router = Router();
  const controller = createStudentController(
    createStudent,
    updateStudent,
    getStudent,
    listStudents,
  );

  router.use('/students', authenticate);
  router.get(
    '/students',
    authorizeStudentPermission('list'),
    controller.list,
  );
  router.get(
    '/students/:id',
    authorizeStudentPermission('view'),
    controller.get,
  );
  router.post(
    '/students',
    authorizeStudentPermission('create'),
    controller.create,
  );
  router.put(
    '/students/:id',
    authorizeStudentPermission('update'),
    controller.update,
  );

  return router;
}
