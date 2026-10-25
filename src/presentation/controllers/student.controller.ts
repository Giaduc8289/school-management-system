import type { Request, RequestHandler } from 'express';
import type { CreateStudentInput } from '../../application/use-cases/create-student.use-case';
import type { CreateStudentUseCase } from '../../application/use-cases/create-student.use-case';
import type { GetStudentByIdUseCase } from '../../application/use-cases/get-student.use-case';
import type {
  ListStudentsInput,
  ListStudentsUseCase,
} from '../../application/use-cases/list-students.use-case';
import type { UpdateStudentUseCase } from '../../application/use-cases/update-student.use-case';
import type {
  Student,
  StudentProfile,
} from '../../domain/entities/student.entity';
import { BadRequestError } from '../errors/bad-request.error';

interface StudentIdParams {
  id: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseListStudentsInput(query: unknown): ListStudentsInput {
  if (!isRecord(query)) {
    throw new BadRequestError('Query parameters must be an object.');
  }

  const allowedParameters = new Set(['page', 'pageSize', 'status', 'search']);
  for (const parameter of Object.keys(query)) {
    if (!allowedParameters.has(parameter)) {
      throw new BadRequestError(
        `Query parameter "${parameter}" is not supported.`,
      );
    }
  }

  const input: ListStudentsInput = {};
  for (const parameter of ['page', 'pageSize'] as const) {
    const value = query[parameter];
    if (value === undefined) {
      continue;
    }
    if (typeof value !== 'string' || !/^\d+$/.test(value)) {
      throw new BadRequestError(
        `Query parameter "${parameter}" must be a positive integer.`,
      );
    }
    const parsedValue = Number(value);
    if (!Number.isSafeInteger(parsedValue) || parsedValue <= 0) {
      throw new BadRequestError(
        `Query parameter "${parameter}" must be greater than 0.`,
      );
    }
    if (parameter === 'page') {
      input.page = parsedValue;
    } else {
      if (parsedValue > 100) {
        throw new BadRequestError(
          'Query parameter "pageSize" must not exceed 100.',
        );
      }
      input.pageSize = parsedValue;
    }
  }

  if (query.status !== undefined) {
    if (query.status !== 'active' && query.status !== 'inactive') {
      throw new BadRequestError(
        'Query parameter "status" must be one of: active, inactive.',
      );
    }
    input.status = query.status;
  }

  if (query.search !== undefined) {
    if (typeof query.search !== 'string' || !query.search.trim()) {
      throw new BadRequestError(
        'Query parameter "search" must be a non-empty string.',
      );
    }
    input.search = query.search;
  }

  return input;
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
  getStudent: GetStudentByIdUseCase,
  listStudents: ListStudentsUseCase,
): {
  create: RequestHandler;
  update: RequestHandler<StudentIdParams>;
  get: RequestHandler<StudentIdParams>;
  list: RequestHandler;
} {
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
    get: async (request: Request<StudentIdParams>, response) => {
      const student = await getStudent.execute(request.params.id);
      response.status(200).json(toStudentResponse(student));
    },
    list: async (request, response) => {
      const result = await listStudents.execute(
        parseListStudentsInput(request.query),
      );
      response.status(200).json({
        ...result,
        items: result.items.map(toStudentResponse),
      });
    },
  };
}
