import { compare } from 'bcryptjs';
import type { PasswordVerifier } from '../../application/ports/password-verifier.interface';

export class BcryptPasswordVerifier implements PasswordVerifier {
  verify(plainText: string, passwordHash: string): Promise<boolean> {
    return compare(plainText, passwordHash);
  }
}
