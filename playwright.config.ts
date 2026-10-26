import { defineConfig } from '@playwright/test';

const frontendUrl = 'http://127.0.0.1:5173';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  outputDir: 'test-results',
  use: {
    baseURL: frontendUrl,
    headless: true,
    screenshot: 'off',
    trace: 'off',
    video: 'off',
  },
  webServer: [
    {
      command: 'npx ts-node src/server.ts',
      url: 'http://127.0.0.1:3000/health',
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
      env: {
        NODE_ENV: 'test',
        JWT_SECRET: 'ci-only-e2e-signing-key-with-at-least-32-characters',
        AUTH_ADMIN_EMAIL: 'ci-admin@example.test',
        AUTH_ADMIN_PASSWORD: 'ci-only-e2e-password',
        DATABASE_URL: '',
      },
    },
    {
      command:
        'npm --workspace frontend run dev -- --host 127.0.0.1 --port 5173',
      url: frontendUrl,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
  ],
});
