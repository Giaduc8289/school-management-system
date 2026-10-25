import { hashSync } from 'bcryptjs';
import type {
  StaffCredential,
  StaffCredentialRepository,
  StaffRole,
} from '../../application/ports/staff-credential.repository.interface';

interface StaffEnvironmentEntry {
  role: StaffRole;
  emailVariable: string;
  hashVariable: string;
  testPasswordVariable: string;
}

const staffEntries: StaffEnvironmentEntry[] = [
  {
    role: 'admin',
    emailVariable: 'AUTH_ADMIN_EMAIL',
    hashVariable: 'AUTH_ADMIN_PASSWORD_HASH',
    testPasswordVariable: 'AUTH_ADMIN_PASSWORD',
  },
  {
    role: 'staff',
    emailVariable: 'AUTH_STAFF_EMAIL',
    hashVariable: 'AUTH_STAFF_PASSWORD_HASH',
    testPasswordVariable: 'AUTH_STAFF_PASSWORD',
  },
];

function resolvePasswordHash(entry: StaffEnvironmentEntry): string | undefined {
  const configuredHash = process.env[entry.hashVariable];
  if (configuredHash) {
    return configuredHash;
  }

  if (process.env.NODE_ENV !== 'test') {
    return undefined;
  }

  const testPassword = process.env[entry.testPasswordVariable];
  if (!testPassword) {
    return undefined;
  }

  return hashSync(testPassword, 10);
}

export class EnvironmentStaffCredentialRepository
  implements StaffCredentialRepository
{
  private readonly credentials: ReadonlyMap<string, StaffCredential>;

  constructor() {
    const credentials = new Map<string, StaffCredential>();

    for (const entry of staffEntries) {
      const email = process.env[entry.emailVariable]?.trim().toLowerCase();
      const passwordHash = resolvePasswordHash(entry);
      if (!email && !passwordHash) {
        continue;
      }
      if (!email || !passwordHash) {
        throw new Error(
          `Both ${entry.emailVariable} and its password hash must be configured.`,
        );
      }
      if (!/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(passwordHash)) {
        throw new Error(`${entry.hashVariable} must be a bcrypt password hash.`);
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error(`${entry.emailVariable} must be a valid email address.`);
      }
      if (credentials.has(email)) {
        throw new Error('Staff account email addresses must be unique.');
      }

      credentials.set(email, { email, passwordHash, role: entry.role });
    }

    if (process.env.NODE_ENV !== 'test' && credentials.size === 0) {
      throw new Error('At least one staff account must be configured.');
    }

    this.credentials = credentials;
  }

  async findByEmail(email: string): Promise<StaffCredential | undefined> {
    return this.credentials.get(email.trim().toLowerCase());
  }
}
