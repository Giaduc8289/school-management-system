/** @jest-environment jsdom */
import { createElement } from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import App from '../../frontend/src/App';

const students = [
  {
    id: 'student-ui-001',
    code: 'STU-2026-0001',
    fullName: 'Nguyen Van An',
    email: 'an.nguyen@example.com',
    dateOfBirth: '2012-05-15T00:00:00.000Z',
    status: 'active',
  },
];

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function studentsResponse(items = students) {
  return {
    items,
    page: 1,
    pageSize: 20,
    total: items.length,
  };
}

function renderApp() {
  return render(createElement(App));
}

describe('Student management UI', () => {
  let fetchMock: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    fetchMock = jest.fn().mockResolvedValue(jsonResponse(studentsResponse()));
    global.fetch = fetchMock;
  });

  it('renders students, exposes search, and requests the next page', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(studentsResponse()))
      .mockResolvedValueOnce(
        jsonResponse({
          items: students,
          page: 1,
          pageSize: 20,
          total: 21,
        }),
      );

    renderApp();

    expect(await screen.findByText('Nguyen Van An')).toBeTruthy();
    expect(screen.getByText('an.nguyen@example.com')).toBeTruthy();

    fireEvent.change(screen.getByRole('searchbox', { name: /search students/i }), {
      target: { value: 'Nguyen' },
    });
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringMatching(/\/students\?.*search=Nguyen/),
        expect.anything(),
      );
    });
    expect(await screen.findByText(/page 1 · 21 total/i)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /next page/i }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringMatching(/\/students\?.*page=2/),
        expect.anything(),
      );
    });
  });

  it('shows an empty state when there are no students', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(studentsResponse([])));

    renderApp();

    expect(await screen.findByText(/no students found/i)).toBeTruthy();
  });

  it('creates a student and shows success feedback', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(studentsResponse([])))
      .mockResolvedValueOnce(
        jsonResponse({
          ...students[0],
          id: 'student-ui-002',
          fullName: 'Tran Thi Binh',
        }, 201),
      )
      .mockResolvedValueOnce(jsonResponse(studentsResponse()));

    renderApp();

    fireEvent.change(screen.getByLabelText(/^id$/i), {
      target: { value: 'student-ui-002' },
    });
    fireEvent.change(screen.getByLabelText(/^code$/i), {
      target: { value: 'STU-2026-0002' },
    });
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Tran Thi Binh' },
    });
    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: 'binh.tran@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/date of birth/i), {
      target: { value: '2012-06-20' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create student/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringMatching(/\/students$/),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: expect.stringContaining('"id":"student-ui-002"'),
        }),
      );
    });
    expect(await screen.findByText(/student created successfully/i)).toBeTruthy();
  });

  it('shows API validation errors without clearing the entered values', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(studentsResponse([])))
      .mockResolvedValueOnce(
        jsonResponse({ error: 'Field "email" must be a valid address.' }, 400),
      );

    renderApp();

    fireEvent.change(screen.getByLabelText(/^id$/i), {
      target: { value: 'student-ui-003' },
    });
    fireEvent.change(screen.getByLabelText(/^code$/i), {
      target: { value: 'STU-2026-0003' },
    });
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Le Hoang Cuong' },
    });
    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: 'cuong@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/date of birth/i), {
      target: { value: '2012-06-20' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create student/i }));

    expect(
      await screen.findByText('Field "email" must be a valid address.'),
    ).toBeTruthy();
    expect(screen.getByLabelText(/^email$/i)).toHaveProperty(
      'value',
      'cuong@example.com',
    );
  });

  it('shows loading feedback and prevents duplicate submissions', async () => {
    let finishCreate: ((response: Response) => void) | undefined;
    fetchMock
      .mockResolvedValueOnce(jsonResponse(studentsResponse([])))
      .mockImplementationOnce(
        () =>
          new Promise<Response>((resolve) => {
            finishCreate = resolve;
          }),
      )
      .mockResolvedValueOnce(jsonResponse(studentsResponse()));

    renderApp();
    await screen.findByRole('button', { name: /create student/i });

    fireEvent.change(screen.getByLabelText(/^id$/i), {
      target: { value: 'student-ui-004' },
    });
    fireEvent.change(screen.getByLabelText(/^code$/i), {
      target: { value: 'STU-2026-0004' },
    });
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Pham Minh Anh' },
    });
    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: 'anh.pham@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/date of birth/i), {
      target: { value: '2012-06-20' },
    });

    const submit = screen.getByRole('button', { name: /create student/i });
    fireEvent.click(submit);

    expect((await screen.findByRole('status')).textContent).toMatch(/saving/i);
    expect((submit as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(submit);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    finishCreate?.(
      jsonResponse(
        {
          id: 'student-ui-004',
          code: 'STU-2026-0004',
          fullName: 'Pham Minh Anh',
          email: 'anh.pham@example.com',
          dateOfBirth: '2012-06-20T00:00:00.000Z',
          status: 'active',
        },
        201,
      ),
    );
    await screen.findByText(/student created successfully/i);
  });

  it('updates a student profile and reports a sanitized network failure', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(studentsResponse()))
      .mockResolvedValueOnce(
        jsonResponse({
          ...students[0],
          fullName: 'Nguyen Thi Binh',
          email: 'binh.nguyen@example.com',
        }),
      )
      .mockRejectedValueOnce(new Error('private database connection details'));

    renderApp();
    const studentRow = (await screen.findByText('Nguyen Van An')).closest('tr');
    expect(studentRow).not.toBeNull();
    fireEvent.click(
      within(studentRow as HTMLElement).getByRole('button', { name: /edit/i }),
    );

    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Nguyen Thi Binh' },
    });
    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: 'binh.nguyen@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringMatching(/\/students\/student-ui-001$/),
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('"fullName":"Nguyen Thi Binh"'),
        }),
      );
    });
    expect(
      await screen.findByText(/student updated successfully/i),
    ).toBeTruthy();

    fireEvent.change(screen.getByRole('searchbox', { name: /search students/i }), {
      target: { value: 'network-error-trigger' },
    });
    expect((await screen.findByRole('alert')).textContent).toMatch(
      /unable to load students|something went wrong/i,
    );
    expect(screen.getByRole('alert').textContent).not.toContain(
      'private database connection details',
    );
  });
});
