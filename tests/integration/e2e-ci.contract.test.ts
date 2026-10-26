import { readFileSync } from 'node:fs';
import path from 'node:path';

const repositoryRoot = path.resolve(__dirname, '../..');
const ciWorkflowPath = path.join(
  repositoryRoot,
  '.github',
  'workflows',
  'ci.yml',
);
const playwrightConfigPath = path.join(repositoryRoot, 'playwright.config.ts');
const e2eTestPath = path.join(
  repositoryRoot,
  'tests',
  'e2e',
  'student-management-ui.spec.ts',
);
const readmePath = path.join(repositoryRoot, 'README.md');
const packagePath = path.join(repositoryRoot, 'package.json');

describe('Playwright end-to-end CI contract', () => {
  const ciWorkflow = readFileSync(ciWorkflowPath, 'utf8');
  const playwrightConfig = readFileSync(playwrightConfigPath, 'utf8');
  const e2eTest = readFileSync(e2eTestPath, 'utf8');
  const readme = readFileSync(readmePath, 'utf8');
  const packageManifest = JSON.parse(readFileSync(packagePath, 'utf8')) as {
    scripts?: Record<string, string>;
  };

  it('runs the existing Playwright smoke test in CI for pull requests and main pushes', () => {
    expect(ciWorkflow).toMatch(/pull_request\s*:/);
    expect(ciWorkflow).toMatch(/push\s*:/);
    expect(ciWorkflow).toMatch(/branches\s*:\s*\[?\s*main\b/i);
    expect(ciWorkflow).toMatch(/npm run test:e2e/);
  });

  it('installs the required Playwright browser and operating-system dependencies before testing', () => {
    expect(ciWorkflow).toMatch(/npx playwright install --with-deps chromium/);
    expect(ciWorkflow).toMatch(/npm run test:e2e/);
  });

  it('uses non-production test credentials and signing configuration', () => {
    expect(ciWorkflow).toMatch(/NODE_ENV:\s*test/);
    expect(ciWorkflow).toMatch(/JWT_SECRET:\s*ci-only-/);
    expect(ciWorkflow).toMatch(/AUTH_ADMIN_EMAIL:/);
    expect(ciWorkflow).toMatch(/AUTH_ADMIN_PASSWORD:/);
    expect(ciWorkflow).not.toMatch(/^\s+DATABASE_URL:/m);
    expect(ciWorkflow).not.toMatch(/STAGING_BASE_URL|PRODUCTION_BASE_URL/i);
  });

  it('starts only local API and frontend servers and fails when either is not ready', () => {
    expect(playwrightConfig).toMatch(/http:\/\/127\.0\.0\.1:3000\/health/);
    expect(playwrightConfig).toMatch(/http:\/\/127\.0\.0\.1:5173/);
    expect(playwrightConfig).toMatch(/reuseExistingServer:\s*!process\.env\.CI/);
    expect(playwrightConfig).toMatch(/timeout:\s*30_000/);
    expect(playwrightConfig).toMatch(/DATABASE_URL:\s*''/);
    expect(playwrightConfig).not.toMatch(/staging|production/i);
  });

  it('uploads Playwright diagnostics only after a failed CI run', () => {
    expect(ciWorkflow).toMatch(/actions\/upload-artifact@/);
    expect(ciWorkflow).toMatch(/if:\s*\$\{\{\s*failure\(\)\s*\}\}/);
    expect(ciWorkflow).toMatch(/playwright-report|test-results/);
    expect(ciWorkflow).not.toMatch(/if:\s*\$\{\{\s*always\(\)\s*\}\}[\s\S]*?upload-artifact/i);
  });

  it('keeps the browser smoke test data synthetic and generated per run', () => {
    expect(e2eTest).toMatch(/Date\.now\(\)/);
    expect(e2eTest).toMatch(/@example\.com/);
    expect(e2eTest).not.toMatch(/process\.env\.(?:STAGING|PRODUCTION)_/i);
    expect(e2eTest).not.toMatch(/process\.env\.AUTH_ADMIN_(?:EMAIL|PASSWORD)/);
  });

  it('documents the local E2E command and one-time browser installation', () => {
    expect(readme).toMatch(/npm run test:e2e/);
    expect(readme).toMatch(/playwright install(?: --with-deps)? chromium/);
    expect(packageManifest.scripts?.['test:e2e']).toBe('playwright test');
  });
});
