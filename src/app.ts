import express from 'express';
import helmet from 'helmet';
import { CreateStudentUseCase } from './application/use-cases/create-student.use-case';
import { GetStudentByIdUseCase } from './application/use-cases/get-student.use-case';
import { ListStudentsUseCase } from './application/use-cases/list-students.use-case';
import { UpdateStudentUseCase } from './application/use-cases/update-student.use-case';
import type { StudentRepository } from './application/ports/student-repository.interface';
import { InMemoryStudentRepository } from './infrastructure/repositories/in-memory-student.repository';
import { LoginStaffUseCase } from './application/use-cases/login-staff.use-case';
import { EnvironmentStaffCredentialRepository } from './infrastructure/security/environment-staff-credential.repository';
import { BcryptPasswordVerifier } from './infrastructure/security/bcrypt-password-verifier';
import { HmacAccessTokenService } from './infrastructure/security/hmac-access-token.service';
import { errorHandler } from './presentation/middleware/error-handler';
import { authentication } from './presentation/middleware/authentication';
import { createHealthRouter } from './presentation/routes/health.route';
import { createAuthenticationRouter } from './presentation/routes/authentication.route';
import { createStudentRouter } from './presentation/routes/student.route';
import { requestLogger } from './presentation/middleware/request-logger';
import { createApiDocumentationRouter } from './presentation/middleware/api-documentation';
import { createApiRateLimits } from './presentation/middleware/api-rate-limits';

export function createApp(
  studentRepository: StudentRepository = new InMemoryStudentRepository(),
) {
  const app = express();
  app.disable('x-powered-by');
  const signingKey = process.env.JWT_SECRET;
  if (!signingKey) {
    throw new Error('JWT_SECRET must be configured.');
  }

  const accessTokens = new HmacAccessTokenService(signingKey);
  const staffCredentials = new EnvironmentStaffCredentialRepository();
  const loginStaff = new LoginStaffUseCase(
    staffCredentials,
    new BcryptPasswordVerifier(),
    accessTokens,
  );

  const apiDocumentationRouter = createApiDocumentationRouter();
  const rateLimits = createApiRateLimits();

  app.use(helmet());
  app.use(requestLogger);
  app.use('/auth/login', rateLimits.login);
  app.use('/students', rateLimits.api);
  app.use('/openapi.json', rateLimits.api);
  app.use('/docs', rateLimits.api);
  app.use(express.json({ limit: 1024 * 1024 }));
  app.use(createHealthRouter(studentRepository));
  if (apiDocumentationRouter) {
    app.use(apiDocumentationRouter);
  }
  app.use(createAuthenticationRouter(loginStaff));
  app.use(
    createStudentRouter(
      new CreateStudentUseCase(studentRepository),
      new UpdateStudentUseCase(studentRepository),
      new GetStudentByIdUseCase(studentRepository),
      new ListStudentsUseCase(studentRepository),
      authentication(accessTokens),
    ),
  );
  app.use(errorHandler);

  return app;
}

const app = createApp();
export default app;
