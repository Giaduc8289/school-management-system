export interface PasswordVerifier {
  verify(plainText: string, passwordHash: string): Promise<boolean>;
}
