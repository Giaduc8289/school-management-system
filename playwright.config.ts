import { defineConfig } from '@playwright/test';

const frontendUrl = 'http://127.0.0.1:5173';
const apiUrl = 'http://127.0.0.1:3000';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL: frontendUrl,
    headless: true,
  },
  webServer: [
    {
      command: 'npx ts-node src/server.ts',
      url: `${apiUrl}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
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
