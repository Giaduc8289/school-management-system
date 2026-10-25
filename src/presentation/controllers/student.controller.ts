import type { Request, RequestHandler } from 'express';
import type { CreateStudentInput } from '../../application/use-cases/create-student.use-case';
import type { CreateStudentUseCase } from '../../application/use-cases/create-student.use-case';
import type { UpdateStudentUseCase } from '../../application/use-cases/update-student.use-case';
import type { Student, StudentProfile } from '../../domain/entities/student.entity';
import { BadRequestError } from '../errors/bad-request.error';

interface StudentIdParams {
  id: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requiredString(body: Record<string, unknown>, field: string): string {
  const value = body[field];
  if (typeof value !== 'string') {
    throw new BadRequestError(`Field "${field}" must be a string.`);
  }
  return value;
}

function isIsoDate(value: string): boolean {
  if (
    !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))?$/.test(
      value,
    )
  ) {
    return false;
  }

  const datePart = value.slice(0, 10);
  const calendarDate = new Date(`${datePart}T00:00:00.000Z`);
  return (
    !Number.isNaN(calendarDate.getTime()) &&
    calendarDate.toISOString().slice(0, 10) === datePart &&
    !Number.isNaN(new Date(value).getTime())
  );
}

function parseCreateStudentInput(body: unknown): CreateStudentInput {
  if (!isRecord(body)) {
    throw new BadRequestError('Request body must be a JSON object.');
  }

  const dateOfBirthValue = requiredString(body, 'dateOfBirth');
  if (!isIsoDate(dateOfBirthValue)) {
    throw new BadRequestError('Field "dateOfBirth" must be an ISO-8601 date.');
  }

  const dateOfBirth = new Date(dateOfBirthValue);

  return {
    id: requiredString(body, 'id'),
    code: requiredString(body, 'code'),
    fullName: requiredString(body, 'fullName'),
    email: requiredString(body, 'email'),
    dateOfBirth,
  };
}

function parseStudentProfile(body: unknown): StudentProfile {
  if (!isRecord(body)) {
    throw new BadRequestError('Request body must be a JSON object.');
  }

  return {
    fullName: requiredString(body, 'fullName'),
    email: requiredString(body, 'email'),
  };
}

function toStudentResponse(student: Student) {
  return {
    id: student.id,
    code: student.code,
    fullName: student.fullName,
    email: student.email,
    dateOfBirth: student.dateOfBirth,
    status: student.status,
  };
}

export function createStudentController(
  createStudent: CreateStudentUseCase,
  updateStudent: UpdateStudentUseCase,
): { create: RequestHandler; update: RequestHandler<StudentIdParams> } {
  return {
    create: async (request, response) => {
      const student = await createStudent.execute(
        parseCreateStudentInput(request.body),
      );
      response.status(201).json(toStudentResponse(student));
    },
    update: async (
      request: Request<StudentIdParams>,
      response,
    ) => {
      const student = await updateStudent.execute(
        request.params.id,
        parseStudentProfile(request.body),
      );
      response.status(200).json(toStudentResponse(student));
    },
  };
}
