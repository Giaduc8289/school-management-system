import { Pool } from 'pg';

export function createPostgresPool(
  connectionString = process.env.DATABASE_URL,
): Pool {
  if (!connectionString?.trim()) {
    throw new Error('DATABASE_URL must be configured to use PostgreSQL.');
  }

  return new Pool({ connectionString });
}
