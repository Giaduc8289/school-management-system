import type { StaffRole } from './staff-credential.repository.interface';

export interface AccessTokenPayload {
  subject: string;
  role: StaffRole;
}

export interface AccessTokenService {
  issue(payload: AccessTokenPayload): string;
  verify(token: string): AccessTokenPayload;
  readonly expiresInSeconds: number;
}
