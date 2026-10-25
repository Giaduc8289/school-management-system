import type {
  Student,
  StudentStatus,
} from '../../domain/entities/student.entity';
import { InvalidStudentQueryError } from '../errors/invalid-student-query.error';
import type {
  FindStudentsQuery,
  StudentRepository,
} from '../ports/student-repository.interface';

export interface ListStudentsInput {
  page?: number;
  pageSize?: number;
  status?: StudentStatus;
  search?: string;
}

export interface ListStudentsResult {
  items: Student[];
  page: number;
  pageSize: number;
  total: number;
}

const MAX_PAGE_SIZE = 100;

export class ListStudentsUseCase {
  constructor(private readonly studentRepository: StudentRepository) {}

  async execute(input: ListStudentsInput): Promise<ListStudentsResult> {
    if (typeof input !== 'object' || input === null || Array.isArray(input)) {
      throw new InvalidStudentQueryError('Student query must be an object.');
    }

    const page = input.page === undefined ? 1 : input.page;
    const requestedPageSize =
      input.pageSize === undefined ? 20 : input.pageSize;

    if (!Number.isSafeInteger(page) || page <= 0) {
      throw new InvalidStudentQueryError(
        'Query parameter "page" must be greater than 0.',
      );
    }

    if (!Number.isSafeInteger(requestedPageSize) || requestedPageSize <= 0) {
      throw new InvalidStudentQueryError(
        'Query parameter "pageSize" must be greater than 0.',
      );
    }

    if (
      input.status !== undefined &&
      input.status !== 'active' &&
      input.status !== 'inactive'
    ) {
      throw new InvalidStudentQueryError(
        'Query parameter "status" must be one of: active, inactive.',
      );
    }

    if (
      input.search !== undefined &&
      (typeof input.search !== 'string' || !input.search.trim())
    ) {
      throw new InvalidStudentQueryError(
        'Query parameter "search" must be a non-empty string.',
      );
    }

    const query: FindStudentsQuery = {
      page,
      pageSize: Math.min(requestedPageSize, MAX_PAGE_SIZE),
      status: input.status,
      search: input.search,
    };
    if (!Number.isSafeInteger((query.page - 1) * query.pageSize)) {
      throw new InvalidStudentQueryError(
        'Query parameter "page" is out of range.',
      );
    }
    const { items, total } = await this.studentRepository.findMany(query);

    return {
      items,
      page: query.page,
      pageSize: query.pageSize,
      total,
    };
  }
}
