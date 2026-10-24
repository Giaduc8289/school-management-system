import { Student } from '../../../src/domain/entities/student.entity';

type StudentData = {
  id: string;
  code: string;
  fullName: string;
  email: string;
  dateOfBirth: Date;
  status: 'active' | 'inactive';
};

const validStudentData: StudentData = {
  id: 'student-001',
  code: 'STU-2026-0001',
  fullName: 'Nguyen Van An',
  email: 'an.nguyen@example.com',
  dateOfBirth: new Date('2012-05-15T00:00:00.000Z'),
  status: 'active',
};

describe('Student entity', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-24T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('construction', () => {
    it('creates a student with all valid attributes', () => {
      const student = new Student({ ...validStudentData });

      expect(student.id).toBe(validStudentData.id);
      expect(student.code).toBe(validStudentData.code);
      expect(student.fullName).toBe(validStudentData.fullName);
      expect(student.email).toBe(validStudentData.email);
      expect(student.dateOfBirth).toEqual(validStudentData.dateOfBirth);
      expect(student.status).toBe('active');
    });

    it.each(['', '   '])('rejects an empty student ID: "%s"', (id) => {
      expect(() => new Student({ ...validStudentData, id })).toThrow(Error);
    });

    it('rejects an invalid status', () => {
      expect(
        () =>
          new Student({
            ...validStudentData,
            status: 'pending' as StudentData['status'],
          }),
      ).toThrow(Error);
    });

    it.each([
      ['at the minimum age', new Date('2020-10-24T00:00:00.000Z')],
      ['at the maximum age', new Date('2008-10-24T00:00:00.000Z')],
    ])('accepts a student who is eligible %s', (_description, dateOfBirth) => {
      expect(
        () => new Student({ ...validStudentData, dateOfBirth }),
      ).not.toThrow();
    });

    it.each([
      ['younger than 6', new Date('2020-10-25T00:00:00.000Z')],
      ['older than 18', new Date('2007-10-23T00:00:00.000Z')],
      ['born in the future', new Date('2026-10-25T00:00:00.000Z')],
    ])('rejects a student who is %s', (_description, dateOfBirth) => {
      expect(
        () => new Student({ ...validStudentData, dateOfBirth }),
      ).toThrow(Error);
    });

    it('rejects an invalid date of birth', () => {
      expect(
        () =>
          new Student({
            ...validStudentData,
            dateOfBirth: new Date('invalid'),
          }),
      ).toThrow(Error);
    });

    it.each(['', 'not-an-email', 'student@', '@example.com', 'name @example.com'])(
      'rejects an invalid email address: "%s"',
      (email) => {
        expect(() => new Student({ ...validStudentData, email })).toThrow(Error);
      },
    );

    it.each(['', '   '])('rejects an empty student code: "%s"', (code) => {
      expect(() => new Student({ ...validStudentData, code })).toThrow(Error);
    });

    it.each(['STU-2026-001', 'STU-26-0001', 'STU-2026-00A1', 'stu-2026-0001'])(
      'rejects a student code outside STU-YYYY-NNNN: "%s"',
      (code) => {
        expect(() => new Student({ ...validStudentData, code })).toThrow(Error);
      },
    );

    it.each(['', '   '])('rejects an empty full name: "%s"', (fullName) => {
      expect(() => new Student({ ...validStudentData, fullName })).toThrow(Error);
    });
  });

  describe('updateProfile()', () => {
    it('updates the full name and email while preserving other attributes', () => {
      const student = new Student({ ...validStudentData });
      const updatedDateOfBirth = student.dateOfBirth;

      student.updateProfile({
        fullName: 'Nguyen Thi Binh',
        email: 'binh.nguyen@example.com',
      });

      expect(student.fullName).toBe('Nguyen Thi Binh');
      expect(student.email).toBe('binh.nguyen@example.com');
      expect(student.id).toBe(validStudentData.id);
      expect(student.code).toBe(validStudentData.code);
      expect(student.dateOfBirth).toBe(updatedDateOfBirth);
      expect(student.status).toBe('active');
    });

    it.each(['invalid', '', 'name@'])(
      'rejects an invalid email without changing the profile: "%s"',
      (email) => {
        const student = new Student({ ...validStudentData });

        expect(() =>
          student.updateProfile({ fullName: 'Updated Name', email }),
        ).toThrow(Error);
        expect(student.fullName).toBe(validStudentData.fullName);
        expect(student.email).toBe(validStudentData.email);
      },
    );

    it.each(['', '   '])(
      'rejects an empty full name without changing the profile: "%s"',
      (fullName) => {
        const student = new Student({ ...validStudentData });

        expect(() =>
          student.updateProfile({ fullName, email: 'updated@example.com' }),
        ).toThrow(Error);
        expect(student.fullName).toBe(validStudentData.fullName);
        expect(student.email).toBe(validStudentData.email);
      },
    );
  });

  describe('deactivate() and activate()', () => {
    it('deactivates an active student', () => {
      const student = new Student({ ...validStudentData });

      student.deactivate();

      expect(student.status).toBe('inactive');
    });

    it('activates an inactive student', () => {
      const student = new Student({
        ...validStudentData,
        status: 'inactive',
      });

      student.activate();

      expect(student.status).toBe('active');
    });

    it('can be deactivated and activated again', () => {
      const student = new Student({ ...validStudentData });

      student.deactivate();
      student.activate();

      expect(student.status).toBe('active');
    });
  });
});
