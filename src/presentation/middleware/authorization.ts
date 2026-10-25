import type { RequestHandler } from 'express';
import type { StaffRole } from '../../application/ports/staff-credential.repository.interface';

export type StudentPermission = 'list' | 'view' | 'create' | 'update';

const rolePermissions: Readonly<Record<StaffRole, readonly StudentPermission[]>> = {
  admin: ['list', 'view', 'create', 'update'],
  staff: ['list', 'view'],
};

export const authorizeStudentPermission = (
  permission: StudentPermission,
): RequestHandler => (_request, response, next) => {
  const identity = response.locals.authenticatedUser as
    | { role: StaffRole }
    | undefined;

  if (!identity || !rolePermissions[identity.role]?.includes(permission)) {
    response.status(403).json({ error: 'You do not have permission to perform this action.' });
    return;
  }

  next();
};
