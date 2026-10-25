import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

interface WorkflowFile {
  name: string;
  content: string;
}

const repositoryRoot = path.resolve(__dirname, '../..');
const workflowDirectory = path.join(repositoryRoot, '.github', 'workflows');
const readmePath = path.join(repositoryRoot, 'README.md');
const packagePath = path.join(repositoryRoot, 'package.json');
const jestConfigPath = path.join(repositoryRoot, 'jest.config.ts');
const environmentExamplePath = path.join(repositoryRoot, '.env.example');

function readWorkflows(): WorkflowFile[] {
  if (!existsSync(workflowDirectory)) {
    return [];
  }

  return readdirSync(workflowDirectory)
    .filter((fileName) => /\.(?:yml|yaml)$/i.test(fileName))
    .map((name) => ({
      name,
      content: readFileSync(path.join(workflowDirectory, name), 'utf8'),
    }));
}

function readJsonFile(filePath: string): Record<string, unknown> {
  const value: unknown = JSON.parse(readFileSync(filePath, 'utf8'));
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${path.basename(filePath)} must contain a JSON object.`);
  }
  return value as Record<string, unknown>;
}

describe('CI and staging deployment contract', () => {
  const workflows = readWorkflows();
  const workflowText = workflows.map(({ content }) => content).join('\n');
  const ciWorkflow = workflows.find(({ name }) => /^(?:ci|quality|checks)\.(?:yml|yaml)$/i.test(name));
  const stagingWorkflow = workflows.find(({ name }) =>
    /(?:staging|stage|deploy).*\.(?:yml|yaml)$/i.test(name),
  );
  const ciWorkflowContent = ciWorkflow?.content ?? '';
  const stagingWorkflowContent = stagingWorkflow?.content ?? '';
  const readme = readFileSync(readmePath, 'utf8');
  const packageManifest = readJsonFile(packagePath);

  describe('continuous integration', () => {
    it('defines GitHub Actions workflows for CI and staging deployment', () => {
      expect(workflows.length).toBeGreaterThanOrEqual(2);
      expect(ciWorkflow).toBeDefined();
      expect(stagingWorkflow).toBeDefined();
    });

    it('runs CI on pull requests and pushes to the reviewed integration branch', () => {
      expect(ciWorkflow).toBeDefined();
      expect(ciWorkflowContent).toMatch(/pull_request\s*:/);
      expect(ciWorkflowContent).toMatch(/push\s*:/);
      expect(ciWorkflowContent).toMatch(/branches\s*:\s*\[?\s*main\b/i);
    });

    it('installs dependencies from the lockfile and runs backend type-check, tests, and coverage', () => {
      expect(ciWorkflowContent).toMatch(/\bnpm ci\b/);
      expect(ciWorkflowContent).toMatch(/\bnpm run typecheck\b/);
      expect(ciWorkflowContent).toMatch(/\bnpm test\b/);
      expect(ciWorkflowContent).toMatch(/--coverage\b/);

      const scripts = packageManifest.scripts as Record<string, unknown>;
      expect(scripts.typecheck).toBe('tsc --noEmit');
      expect(scripts.test).toBe('jest');
    });

    it('enforces the global minimum line-coverage threshold of 80 percent', () => {
      const jestConfig = readFileSync(jestConfigPath, 'utf8');

      expect(jestConfig).toMatch(/coverageThreshold/);
      expect(jestConfig).toMatch(/global/);
      expect(jestConfig).toMatch(/lines\s*:\s*80/);
    });

    it('builds and tests the frontend when frontend files are changed', () => {
      expect(ciWorkflowContent).toMatch(/frontend\/\*\*/);
      expect(ciWorkflowContent).toMatch(/npm run build:frontend/);
      expect(ciWorkflowContent).toMatch(/npm --workspace frontend run build/);
      expect(ciWorkflowContent).toMatch(/npm --workspace frontend (?:run )?test/);
    });

    it('runs database-backed integration tests against an isolated PostgreSQL service', () => {
      expect(ciWorkflowContent).toMatch(/services\s*:/);
      expect(ciWorkflowContent).toMatch(/postgres:\d+/i);
      expect(ciWorkflowContent).toMatch(/TEST_DATABASE_URL\s*:/);
      expect(ciWorkflowContent).toMatch(/health-cmd|pg_isready/i);
      expect(ciWorkflowContent).toMatch(/postgres-student\.repository\.test/);
    });

    it('fails the workflow when any required quality gate fails', () => {
      expect(ciWorkflowContent).toMatch(/npm run typecheck/);
      expect(ciWorkflowContent).toMatch(/npm test/);
      expect(ciWorkflowContent).toMatch(/npm run build:frontend/);
      expect(ciWorkflowContent).not.toMatch(/continue-on-error\s*:\s*true/i);
      expect(ciWorkflowContent).not.toMatch(/fail-fast\s*:\s*false/i);
    });
  });

  describe('staging deployment safety and recovery', () => {
    it('provides a repeatable staging deployment workflow for reviewed changes', () => {
      expect(stagingWorkflow).toBeDefined();
      expect(stagingWorkflowContent).toMatch(/workflow_dispatch\s*:/);
      expect(stagingWorkflowContent).toMatch(/environment\s*:\s*staging/i);
      expect(stagingWorkflowContent).toMatch(/actions\/checkout/);
    });

    it('uses secret-store references instead of committing deployment credentials', () => {
      expect(stagingWorkflowContent).toMatch(/\$\{\{\s*secrets\.[A-Z0-9_]+\s*\}\}/);
      expect(stagingWorkflowContent).not.toMatch(
        /(?:password|token|secret|api[_-]?key)\s*:\s*['"]?(?!\$\{\{)[A-Za-z0-9_/-]{12,}/i,
      );
      expect(workflowText).not.toMatch(
        /postgres(?:ql)?:\/\/[^<\s"']+:[^<\s"']+@/i,
      );
    });

    it('runs database migrations as part of the staging release', () => {
      const scripts = packageManifest.scripts as Record<string, unknown>;

      expect(stagingWorkflowContent).toMatch(/npm run db:migrate/);
      expect(scripts['db:migrate']).toBe('ts-node src/infrastructure/database/migrate.ts');
    });

    it('checks readiness before reporting the staging deployment as successful', () => {
      expect(stagingWorkflowContent).toMatch(/health\/ready/);
      expect(stagingWorkflowContent).toMatch(/curl|Invoke-WebRequest|Invoke-RestMethod/i);
      expect(stagingWorkflowContent).toMatch(/--fail|fail-on-error|StatusCode/i);
    });

    it('does not automatically deploy unreviewed changes to production', () => {
      expect(stagingWorkflowContent).not.toMatch(/environment\s*:\s*production/i);
      expect(stagingWorkflowContent).not.toMatch(/environment:\s*\n\s*name:\s*production/i);
      expect(stagingWorkflowContent).toMatch(/staging/i);
      expect(stagingWorkflowContent).toMatch(/workflow_dispatch\s*:/);
    });

    it('documents branch and pull-request expectations, release, rollback, and readiness verification', () => {
      expect(readme).toMatch(/pull request|pull-request/i);
      expect(readme).toMatch(/branch/i);
      expect(readme).toMatch(/release|deploy/i);
      expect(readme).toMatch(/rollback/i);
      expect(readme).toMatch(/health\/ready/);
      expect(readme).toMatch(/db:migrate/);
    });
  });

  describe('secret-safe CI configuration', () => {
    it('keeps environment examples placeholder-only and excludes real credentials', () => {
      const environmentExample = readFileSync(environmentExamplePath, 'utf8');

      expect(environmentExample).toMatch(/<[^>]+>/);
      expect(environmentExample).not.toMatch(
        /(?:postgres(?:ql)?:\/\/[^<\s"']+:[^<\s"']+@|JWT_SECRET=(?!<)[A-Za-z0-9_-]{32,})/i,
      );
    });

    it('does not grant deployment workflows unnecessary repository write permissions', () => {
      expect(stagingWorkflowContent).toMatch(/permissions\s*:/);
      expect(stagingWorkflowContent).not.toMatch(/contents\s*:\s*write/i);
      expect(stagingWorkflowContent).not.toMatch(/permissions\s*:\s*write-all/i);
    });
  });
});
