import express from 'express';
import { CreateStudentUseCase } from './application/use-cases/create-student.use-case';
import { GetStudentByIdUseCase } from './application/use-cases/get-student.use-case';
import { ListStudentsUseCase } from './application/use-cases/list-students.use-case';
import { UpdateStudentUseCase } from './application/use-cases/update-student.use-case';
import type { StudentRepository } from './application/ports/student-repository.interface';
import { InMemoryStudentRepository } from './infrastructure/repositories/in-memory-student.repository';
import { errorHandler } from './presentation/middleware/error-handler';
import healthRouter from './presentation/routes/health.route';
import { createStudentRouter } from './presentation/routes/student.route';

export function createApp(
  studentRepository: StudentRepository = new InMemoryStudentRepository(),
) {
  const app = express();

  app.use(express.json());
  app.use(healthRouter);
  app.use(
    createStudentRouter(
      new CreateStudentUseCase(studentRepository),
      new UpdateStudentUseCase(studentRepository),
      new GetStudentByIdUseCase(studentRepository),
      new ListStudentsUseCase(studentRepository),
    ),
  );
  app.use(errorHandler);

  return app;
}

const app = createApp();
export default app;
