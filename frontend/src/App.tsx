import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';

declare const __API_BASE_URL__: string;

interface Student {
  id: string;
  code: string;
  fullName: string;
  email: string;
  dateOfBirth: string;
  status: 'active' | 'inactive';
}

interface StudentList {
  items: Student[];
  page: number;
  pageSize: number;
  total: number;
}

interface StudentForm {
  id: string;
  code: string;
  fullName: string;
  email: string;
  dateOfBirth: string;
}

interface ProfileForm {
  fullName: string;
  email: string;
}

interface ApiErrorBody {
  error?: unknown;
}

type Feedback = { kind: 'success' | 'error'; message: string };
type FormMode = { kind: 'create' } | { kind: 'edit'; student: Student };

const PAGE_SIZE = 20;

class UserFacingError extends Error {}

function apiUrl(path: string): string {
  const baseUrl =
    typeof __API_BASE_URL__ === 'string' ? __API_BASE_URL__.replace(/\/$/, '') : '';
  return `${baseUrl}${path}`;
}

async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(apiUrl(path), init);
  let body: unknown;

  try {
    body = await response.json();
  } catch {
    body = undefined;
  }

  if (!response.ok) {
    const apiError =
      typeof body === 'object' && body !== null
        ? (body as ApiErrorBody).error
        : undefined;
    if (
      response.status >= 400 &&
      response.status < 500 &&
      typeof apiError === 'string' &&
      apiError.trim()
    ) {
      throw new UserFacingError(apiError);
    }
    throw new UserFacingError(
      'The request could not be completed. Please try again.',
    );
  }

  if (body === undefined) {
    throw new Error('The server returned an invalid response.');
  }

  return body as T;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof UserFacingError) {
    return error.message;
  }
  return fallback;
}

function StudentFormFields({
  values,
  onChange,
  editing,
}: {
  values: StudentForm | ProfileForm;
  onChange: (field: keyof StudentForm, value: string) => void;
  editing: boolean;
}) {
  return (
    <>
      {!editing && (
        <>
          <label>
            ID
            <input
              autoComplete="off"
              name="id"
              onChange={(event) => onChange('id', event.target.value)}
              required
              value={'id' in values ? values.id : ''}
            />
          </label>
          <label>
            Code
            <input
              autoComplete="off"
              name="code"
              onChange={(event) => onChange('code', event.target.value)}
              required
              value={'code' in values ? values.code : ''}
            />
          </label>
        </>
      )}
      <label>
        Full name
        <input
          autoComplete="name"
          name="fullName"
          onChange={(event) => onChange('fullName', event.target.value)}
          required
          value={values.fullName}
        />
      </label>
      <label>
        Email
        <input
          autoComplete="email"
          name="email"
          onChange={(event) => onChange('email', event.target.value)}
          required
          type="email"
          value={values.email}
        />
      </label>
      {!editing && (
        <label>
          Date of birth
          <input
            name="dateOfBirth"
            onChange={(event) => onChange('dateOfBirth', event.target.value)}
            required
            type="date"
            value={'dateOfBirth' in values ? values.dateOfBirth : ''}
          />
        </label>
      )}
    </>
  );
}

export default function App() {
  const [studentList, setStudentList] = useState<StudentList>({
    items: [],
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
  });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>({ kind: 'create' });
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [createValues, setCreateValues] = useState<StudentForm>({
    id: '',
    code: '',
    fullName: '',
    email: '',
    dateOfBirth: '',
  });
  const [editValues, setEditValues] = useState<ProfileForm>({
    fullName: '',
    email: '',
  });

  const loadStudents = useCallback(async (currentPage: number, term: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        pageSize: String(PAGE_SIZE),
      });
      if (term.trim()) {
        params.set('search', term.trim());
      }
      const result = await requestJson<StudentList>(
        `/students?${params.toString()}`,
        { method: 'GET' },
      );
      setStudentList(result);
    } catch (error) {
      setFeedback({
        kind: 'error',
        message: getErrorMessage(error, 'Unable to load students. Please try again.'),
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStudents(page, search);
  }, [loadStudents, page, search]);

  function changeCreateValue(field: keyof StudentForm, value: string) {
    setCreateValues((current) => ({ ...current, [field]: value }));
  }

  function changeEditValue(field: keyof StudentForm, value: string) {
    if (field === 'fullName' || field === 'email') {
      setEditValues((current) => ({ ...current, [field]: value }));
    }
  }

  function beginEdit(student: Student) {
    setEditValues({ fullName: student.fullName, email: student.email });
    setFormMode({ kind: 'edit', student });
    setFeedback(null);
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    try {
      if (formMode.kind === 'create') {
        const createdStudent = await requestJson<Student>('/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...createValues,
            dateOfBirth: new Date(
              `${createValues.dateOfBirth}T00:00:00.000Z`,
            ).toISOString(),
          }),
        });
        setFeedback({ kind: 'success', message: 'Student created successfully.' });
        const searchTerm = search.trim().toLowerCase();
        const matchesSearch =
          !searchTerm ||
          [
            createdStudent.code,
            createdStudent.fullName,
            createdStudent.email,
          ].some((value) => value.toLowerCase().includes(searchTerm));
        setStudentList((current) => ({
          ...current,
          items:
            page === 1 && matchesSearch
              ? [createdStudent, ...current.items].slice(0, current.pageSize)
              : current.items,
          total: current.total + (matchesSearch ? 1 : 0),
        }));
        setCreateValues({
          id: '',
          code: '',
          fullName: '',
          email: '',
          dateOfBirth: '',
        });
      } else {
        const updatedStudent = await requestJson<Student>(
          `/students/${encodeURIComponent(formMode.student.id)}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editValues),
          },
        );
        setFeedback({ kind: 'success', message: 'Student updated successfully.' });
        setStudentList((current) => ({
          ...current,
          items: current.items.map((student) =>
            student.id === updatedStudent.id ? updatedStudent : student,
          ),
        }));
        setFormMode({ kind: 'create' });
      }
    } catch (error) {
      setFeedback({
        kind: 'error',
        message: getErrorMessage(
          error,
          'Something went wrong. Please try again.',
        ),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function cancelEdit() {
    setFormMode({ kind: 'create' });
    setFeedback(null);
  }

  return (
    <main className="app-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">SCHOOL ADMINISTRATION</p>
          <h1>Student management</h1>
          <p className="subtitle">
            Browse student records and keep profiles up to date.
          </p>
        </div>
        <span className="header-badge">Student services</span>
      </header>

      {feedback && (
        <div
          className={`feedback feedback-${feedback.kind}`}
          role={feedback.kind === 'error' ? 'alert' : 'status'}
        >
          {feedback.message}
          <button
            aria-label="Dismiss message"
            className="dismiss-button"
            onClick={() => setFeedback(null)}
            type="button"
          >
            ×
          </button>
        </div>
      )}

      <div className="content-grid">
        <section aria-labelledby="students-heading" className="panel list-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">DIRECTORY</p>
              <h2 id="students-heading">Students</h2>
            </div>
            <span className="result-count">{studentList.total} records</span>
          </div>

          <label className="search-field">
            <span className="sr-only">Search students</span>
            <span aria-hidden="true" className="search-icon">
              ⌕
            </span>
            <input
              aria-label="Search students"
              onChange={(event) => {
                setPage(1);
                setSearch(event.target.value);
              }}
              placeholder="Search by name, code, or email"
              type="search"
              value={search}
            />
          </label>

          {isLoading ? (
            <div
              aria-live="polite"
              className="loading-state"
              role="progressbar"
            >
              <span className="spinner" />
              Loading students…
            </div>
          ) : studentList.items.length === 0 ? (
            <div className="empty-state">
              <span aria-hidden="true" className="empty-icon">
                ◇
              </span>
              <h3>No students found</h3>
              <p>Try a different search or add a new student.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Student</th>
                    <th scope="col">Code</th>
                    <th scope="col">Status</th>
                    <th scope="col">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {studentList.items.map((student) => (
                    <tr key={student.id}>
                      <td>
                        <strong>{student.fullName}</strong>
                        <span className="secondary-text">{student.email}</span>
                      </td>
                      <td className="code-cell">{student.code}</td>
                      <td>
                        <span className={`status-pill status-${student.status}`}>
                          {student.status}
                        </span>
                      </td>
                      <td>
                        <button
                          aria-label={`Edit ${student.fullName}`}
                          className="text-button"
                          onClick={() => beginEdit(student)}
                          type="button"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <nav aria-label="Student list pagination" className="pagination">
            <span>
              Page {page} · {studentList.total} total
            </span>
            <div className="pagination-actions">
              <button
                disabled={page <= 1 || isLoading}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                type="button"
              >
                Previous
              </button>
              <button
                aria-label="Next page"
                disabled={
                  isLoading ||
                  page >= Math.max(
                    1,
                    Math.ceil(studentList.total / studentList.pageSize),
                  )
                }
                onClick={() => setPage((current) => current + 1)}
                type="button"
              >
                Next
              </button>
            </div>
          </nav>
        </section>

        <section aria-labelledby="form-heading" className="panel form-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">
                {formMode.kind === 'edit' ? 'PROFILE' : 'NEW RECORD'}
              </p>
              <h2 id="form-heading">
                {formMode.kind === 'edit' ? 'Edit student' : 'Add a student'}
              </h2>
            </div>
            <span aria-hidden="true" className="form-icon">
              {formMode.kind === 'edit' ? '✎' : '+'}
            </span>
          </div>

          {formMode.kind === 'edit' && (
            <p className="form-context">
              Updating <strong>{formMode.student.fullName}</strong>
            </p>
          )}

          <form onSubmit={submitForm}>
            <StudentFormFields
              editing={formMode.kind === 'edit'}
              onChange={
                formMode.kind === 'edit'
                  ? changeEditValue
                  : changeCreateValue
              }
              values={formMode.kind === 'edit' ? editValues : createValues}
            />
            <button
              className="primary-button"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting
                ? formMode.kind === 'edit'
                  ? 'Saving…'
                  : 'Saving…'
                : formMode.kind === 'edit'
                  ? 'Save changes'
                  : 'Create student'}
            </button>
            {isSubmitting && (
              <span aria-live="polite" className="sr-only" role="status">
                Saving
              </span>
            )}
            {formMode.kind === 'edit' && (
              <button
                className="secondary-button"
                disabled={isSubmitting}
                onClick={cancelEdit}
                type="button"
              >
                Cancel
              </button>
            )}
          </form>
        </section>
      </div>
    </main>
  );
}
