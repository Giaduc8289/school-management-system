import jwt from 'jsonwebtoken';
import type {
  AccessTokenPayload,
  AccessTokenService,
} from '../../application/ports/access-token.service.interface';
import type { StaffRole } from '../../application/ports/staff-credential.repository.interface';

const accessTokenLifetimeSeconds = 15 * 60;

export class HmacAccessTokenService implements AccessTokenService {
  readonly expiresInSeconds = accessTokenLifetimeSeconds;

  constructor(private readonly signingKey: string) {
    if (signingKey.length < 32) {
      throw new Error('JWT_SECRET must contain at least 32 characters.');
    }
  }

  issue(payload: AccessTokenPayload): string {
    return jwt.sign(
      { role: payload.role },
      this.signingKey,
      {
        algorithm: 'HS256',
        subject: payload.subject,
        expiresIn: accessTokenLifetimeSeconds,
      },
    );
  }

  verify(token: string): AccessTokenPayload {
    const decoded = jwt.verify(token, this.signingKey, {
      algorithms: ['HS256'],
    });
    if (
      typeof decoded === 'string' ||
      typeof decoded.sub !== 'string' ||
      (decoded.role !== 'admin' && decoded.role !== 'staff')
    ) {
      throw new jwt.JsonWebTokenError('Invalid access token claims.');
    }

    return {
      subject: decoded.sub,
      role: decoded.role as StaffRole,
    };
  }
}
