import type { StaffCredentialRepository } from '../ports/staff-credential.repository.interface';
import type { AccessTokenService } from '../ports/access-token.service.interface';
import type { PasswordVerifier } from '../ports/password-verifier.interface';
import { InvalidCredentialsError } from '../errors/invalid-credentials.error';

export class LoginStaffUseCase {
  constructor(
    private readonly staffCredentials: StaffCredentialRepository,
    private readonly passwordVerifier: PasswordVerifier,
    private readonly accessTokens: AccessTokenService,
  ) {}

  async execute(input: { email: string; password: string }): Promise<{
    accessToken: string;
    tokenType: 'Bearer';
    expiresIn: number;
    role: 'admin' | 'staff';
  }> {
    const staff = await this.staffCredentials.findByEmail(input.email);
    if (!staff) {
      throw new InvalidCredentialsError();
    }

    const passwordMatches = await this.passwordVerifier.verify(
      input.password,
      staff.passwordHash,
    );
    if (!passwordMatches) {
      throw new InvalidCredentialsError();
    }

    return {
      accessToken: this.accessTokens.issue({
        subject: staff.email,
        role: staff.role,
      }),
      tokenType: 'Bearer',
      expiresIn: this.accessTokens.expiresInSeconds,
      role: staff.role,
    };
  }
}
