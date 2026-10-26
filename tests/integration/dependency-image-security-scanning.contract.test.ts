import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const repositoryRoot = path.resolve(__dirname, '../..');
const ciWorkflowPath = path.join(
  repositoryRoot,
  '.github',
  'workflows',
  'ci.yml',
);
const stagingWorkflowPath = path.join(
  repositoryRoot,
  '.github',
  'workflows',
  'staging-deploy.yml',
);
const lockfilePath = path.join(repositoryRoot, 'package-lock.json');
const readmePath = path.join(repositoryRoot, 'README.md');

function readIfPresent(filePath: string): string {
  return existsSync(filePath) ? readFileSync(filePath, 'utf8') : '';
}

function getDeployJob(workflow: string): string {
  return (
    workflow.match(/^  deploy:[\s\S]*?(?=^  [\w-]+:|(?![\s\S]))/m)?.[0] ?? ''
  );
}

describe('dependency and container image security scanning contract', () => {
  const ciWorkflow = readIfPresent(ciWorkflowPath);
  const stagingWorkflow = readIfPresent(stagingWorkflowPath);
  const readme = readIfPresent(readmePath);
  const allWorkflowText = `${ciWorkflow}\n${stagingWorkflow}`;

  it('scans the committed npm lockfile on pull requests and pushes to main', () => {
    expect(existsSync(lockfilePath)).toBe(true);
    expect(ciWorkflow).toMatch(/pull_request\s*:/);
    expect(ciWorkflow).toMatch(/push\s*:/);
    expect(ciWorkflow).toMatch(/branches\s*:\s*\[?\s*main\b/i);
    expect(ciWorkflow).toMatch(/npm audit/i);
    expect(ciWorkflow).toMatch(/package-lock\.json/i);
  });

  it('scans API, frontend, and migration images in CI and fails on Critical or High findings', () => {
    expect(ciWorkflow).toMatch(/trivy|grype|docker scout|snyk/i);
    expect(ciWorkflow).toMatch(/api/i);
    expect(ciWorkflow).toMatch(/frontend/i);
    expect(ciWorkflow).toMatch(/migration/i);
    expect(ciWorkflow).toMatch(/critical/i);
    expect(ciWorkflow).toMatch(/\bhigh\b/i);
    expect(ciWorkflow).not.toMatch(/continue-on-error\s*:\s*true/i);
  });

  it('scans the exact immutable staging images after build and before deployment', () => {
    const deployJob = getDeployJob(stagingWorkflow);

    expect(stagingWorkflow).toMatch(/trivy|grype|docker scout|snyk/i);
    expect(stagingWorkflow).toMatch(/git rev-parse HEAD/);
    expect(stagingWorkflow).toMatch(/image-tag/);
    expect(stagingWorkflow).toMatch(/api/i);
    expect(stagingWorkflow).toMatch(/frontend/i);
    expect(stagingWorkflow).toMatch(/migration/i);
    expect(deployJob).toMatch(/needs\s*:[\s\S]*?(?:security[-_]scan|scan[-_]images)/i);
    expect(deployJob).toMatch(/build-and-publish/);
    expect(stagingWorkflow).toMatch(/critical/i);
    expect(stagingWorkflow).toMatch(/\bhigh\b/i);
  });

  it('prints actionable finding details without exposing secrets or uploading scan reports', () => {
    expect(allWorkflowText).toMatch(/vulnerability\s*id|vulnerabilityid|cve/i);
    expect(allWorkflowText).toMatch(/severity/i);
    expect(allWorkflowText).toMatch(/package|image/i);
    expect(allWorkflowText).toMatch(/remediation|fixedversion|fixed version/i);
    expect(allWorkflowText).not.toMatch(
      /^\s*run:.*(?:echo|printf).*\$\{\{\s*secrets\./im,
    );
    expect(allWorkflowText).not.toMatch(
      /uses:\s*actions\/upload-artifact@[^\n]*[\s\S]{0,300}path:\s*[^\n]*(?:sarif|trivy|grype|scan-report)/i,
    );
  });

  it('documents a reviewed, time-limited exception process and finding remediation', () => {
    expect(readme).toMatch(/security scanning|vulnerability scanning/i);
    expect(readme).toMatch(/triage|review findings/i);
    expect(readme).toMatch(/update.{0,40}(?:dependenc|base image)|(?:dependenc|base image).{0,40}update/i);
    expect(readme).toMatch(/temporary exception|time-limited exception/i);
    expect(readme).toMatch(/pull request|review process/i);
    expect(readme).toMatch(/expir|expiry|expiration/i);
    expect(readme).toMatch(/critical/i);
    expect(readme).toMatch(/\bhigh\b/i);
  });

  it('verifies scanner gates with a controlled fixture or scanner test mode', () => {
    expect(allWorkflowText).toMatch(/fixture|test[-_ ]mode/i);
    expect(readme).toMatch(/fixture|test[-_ ]mode/i);
  });

  it('pins scanner tooling or scanner actions to reviewed versions', () => {
    const scannerActionLines = allWorkflowText
      .split(/\r?\n/)
      .filter((line) => /uses:\s*.*(?:trivy|grype|snyk|docker\/scout)/i.test(line));

    if (scannerActionLines.length > 0) {
      expect(
        scannerActionLines.every((line) => /@[a-f0-9]{40}\s*$/i.test(line)),
      ).toBe(true);
      return;
    }

    expect(allWorkflowText).toMatch(
      /(?:trivy|grype|snyk|docker scout)[^\n]*(?:version|@v?\d+\.\d+)/i,
    );
  });
});
