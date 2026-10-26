import { readFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const exceptionPath = path.join(repositoryRoot, '.npm-audit-exceptions.json');
const fixturePath = path.join(
  repositoryRoot,
  'tests',
  'fixtures',
  'npm-audit-high-vulnerability.json',
);
const highSeverity = new Set(['high', 'critical']);

function readExceptions() {
  const parsed = JSON.parse(readFileSync(exceptionPath, 'utf8'));
  if (!Array.isArray(parsed.exceptions)) {
    throw new Error('npm audit exceptions must be an array.');
  }

  const today = new Date().toISOString().slice(0, 10);
  return parsed.exceptions.map((exception) => {
    const expiration =
      typeof exception.expiresAt === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(exception.expiresAt)
        ? new Date(`${exception.expiresAt}T00:00:00Z`)
        : undefined;
    const validDate =
      expiration !== undefined &&
      !Number.isNaN(expiration.getTime()) &&
      expiration.toISOString().slice(0, 10) === exception.expiresAt;
    if (
      typeof exception.package !== 'string' ||
      typeof exception.id !== 'string' ||
      typeof exception.reason !== 'string' ||
      typeof exception.reviewRef !== 'string' ||
      !validDate ||
      exception.expiresAt < today
    ) {
      throw new Error(
        'Every npm audit exception must include package, id, reason, reviewRef, and a non-expired YYYY-MM-DD expiresAt date.',
      );
    }
    return exception;
  });
}

function findingsFromReport(report, exceptions) {
  if (!report || typeof report.vulnerabilities !== 'object') {
    throw new Error('npm audit did not return a vulnerability report.');
  }

  const findings = [];
  for (const [packageName, vulnerability] of Object.entries(
    report.vulnerabilities,
  )) {
    if (!highSeverity.has(String(vulnerability.severity).toLowerCase())) {
      continue;
    }

    const advisories = Array.isArray(vulnerability.via)
      ? vulnerability.via.filter(
          (advisory) =>
            advisory &&
            typeof advisory === 'object' &&
            highSeverity.has(
              String(advisory.severity ?? vulnerability.severity).toLowerCase(),
            ),
        )
      : [];
    const packageFindings =
      advisories.length > 0
        ? advisories.map((advisory) => ({
            packageName,
            id: String(
              advisory.source ??
                advisory.cve ??
                advisory.name ??
                advisory.title ??
                'unknown',
            ),
            severity: String(
              advisory.severity ?? vulnerability.severity,
            ).toUpperCase(),
            fixAvailable: vulnerability.fixAvailable,
          }))
        : [
            {
              packageName,
              id: String(vulnerability.name ?? 'unknown'),
              severity: String(vulnerability.severity).toUpperCase(),
              fixAvailable: vulnerability.fixAvailable,
            },
          ];

    for (const finding of packageFindings) {
      const excepted = exceptions.some(
        (exception) =>
          exception.package === finding.packageName &&
          exception.id === finding.id,
      );
      if (!excepted) {
        findings.push(finding);
      }
    }
  }
  return findings;
}

function remediation(fixAvailable) {
  if (fixAvailable && typeof fixAvailable === 'object') {
    const version = fixAvailable.version ? ` to ${fixAvailable.version}` : '';
    return `update the affected dependency${version}`;
  }
  return 'update the dependency to a patched release; run npm audit fix to review available updates';
}

function printFindings(findings) {
  for (const finding of findings) {
    console.error(
      `npm dependency ${finding.packageName} | ${finding.id} | ${finding.severity} | Remediation: ${remediation(finding.fixAvailable)}`,
    );
  }
}

function loadJson(text, description) {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${description} is not valid JSON.`);
  }
}

function runFixtureTest(exceptions) {
  const fixture = loadJson(
    readFileSync(fixturePath, 'utf8'),
    'The controlled npm audit fixture',
  );
  const findings = findingsFromReport(fixture, exceptions);
  const detected = findings.some(
    (finding) =>
      finding.packageName === 'synthetic-fixture-package' &&
      finding.id === '900001' &&
      finding.severity === 'HIGH',
  );

  if (!detected) {
    console.error('The npm audit gate did not detect the controlled fixture.');
    process.exitCode = 1;
    return;
  }
  console.log('The npm audit gate detected the controlled High-severity fixture.');
}

function runAudit(exceptions) {
  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const result = spawnSync(npmCommand, ['audit', '--json', '--audit-level=high'], {
    cwd: repositoryRoot,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    maxBuffer: 10 * 1024 * 1024,
  });

  if (result.error || !result.stdout) {
    console.error(
      'npm audit did not produce a report; verify registry connectivity and the committed lockfile.',
    );
    process.exitCode = 1;
    return;
  }

  let report;
  try {
    report = loadJson(result.stdout, 'The npm audit report');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
    return;
  }

  let findings;
  try {
    findings = findingsFromReport(report, exceptions);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
    return;
  }

  if (findings.length > 0) {
    printFindings(findings);
    process.exitCode = 1;
    return;
  }

  if (result.status !== 0 && Object.keys(report.vulnerabilities ?? {}).length === 0) {
    console.error(
      'npm audit failed without reporting vulnerabilities; verify registry connectivity and npm configuration.',
    );
    process.exitCode = 1;
    return;
  }
  console.log('npm audit found no unexcepted High or Critical vulnerabilities.');
}

try {
  const exceptions = readExceptions();
  if (process.argv.includes('--test-fixture')) {
    runFixtureTest(exceptions);
  } else {
    runAudit(exceptions);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
