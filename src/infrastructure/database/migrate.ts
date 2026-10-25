import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { createPostgresPool } from './postgres-pool';

export async function runMigrations(): Promise<void> {
  const pool = createPostgresPool();
  const migrationsDirectory = path.join(__dirname, 'migrations');

  try {
    const migrationFiles = (await readdir(migrationsDirectory))
      .filter((fileName) => fileName.endsWith('.sql'))
      .sort();

    if (migrationFiles.length === 0) {
      throw new Error('No database migrations were found.');
    }

    for (const fileName of migrationFiles) {
      const migration = await readFile(
        path.join(migrationsDirectory, fileName),
        'utf8',
      );
      await pool.query(migration);
    }
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  runMigrations().catch((error: unknown) => {
    console.error('Database migration failed.', error);
    process.exitCode = 1;
  });
}
