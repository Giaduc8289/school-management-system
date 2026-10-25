export type StaffRole = 'admin' | 'staff';

export interface StaffCredential {
  email: string;
  passwordHash: string;
  role: StaffRole;
}

export interface StaffCredentialRepository {
  findByEmail(email: string): Promise<StaffCredential | undefined>;
}
