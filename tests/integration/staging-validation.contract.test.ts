import { readFileSync } from 'node:fs';
import path from 'node:path';

const repositoryRoot = path.resolve(__dirname, '../..');
const stagingWorkflowPath = path.join(
  repositoryRoot,
  '.github',
  'workflows',
  'staging-deploy.yml',
);
const readmePath = path.join(repositoryRoot, 'README.md');

describe('staging validation and recovery contract', () => {
  const stagingWorkflow = readFileSync(stagingWorkflowPath, 'utf8');
  const readme = readFileSync(readmePath, 'utf8');

  describe('post-deployment verification', () => {
    it('verifies frontend access, staff login, and an authorized student operation', () => {
      expect(stagingWorkflow).toMatch(/health\/ready/);
      expect(stagingWorkflow).toMatch(/curl[^\n]*https?:\/\/[^\n]*:8080\//i);
      expect(stagingWorkflow).toMatch(/\/auth\/login/);
      expect(stagingWorkflow).toMatch(/\/students(?:[/?\s"'\\]|$)/);
    });

    it('verifies the deployed API and frontend revision after a successful release', () => {
      expect(stagingWorkflow).toMatch(/API_IMAGE/);
      expect(stagingWorkflow).toMatch(/FRONTEND_IMAGE/);
      expect(stagingWorkflow).toMatch(/health\/ready/);
      expect(stagingWorkflow).toMatch(/verify.*(?:revision|image|deployment)|(?:revision|image|deployment).*verify/i);
    });

    it('keeps smoke-test credentials and tokens out of command arguments and logs', () => {
      expect(stagingWorkflow).toMatch(/--data-binary @-/);
      expect(stagingWorkflow).toMatch(/printf '%s' "\$STAGING_SMOKE_PASSWORD"/);
      expect(stagingWorkflow).toMatch(/--config -/);
      expect(stagingWorkflow).toMatch(/trap 'rm -f "\$response_file"' EXIT/);
      expect(stagingWorkflow).not.toMatch(/unset response_file/);
      expect(stagingWorkflow).not.toMatch(/--data "\$login_body"/);
      expect(stagingWorkflow).not.toMatch(/--header "Authorization: Bearer \$access_token"/);
    });
  });

  describe('failed deployment recovery', () => {
    it('checks readiness after restoring the previous application images', () => {
      const rollbackFunction = stagingWorkflow.match(
        /rollback_images\(\)\s*\{([\s\S]*?)\n\s*\}/,
      )?.[1];

      expect(rollbackFunction).toBeDefined();
      expect(rollbackFunction).toMatch(/previous_api_image/);
      expect(rollbackFunction).toMatch(/previous_frontend_image/);
      expect(rollbackFunction).toMatch(/health\/ready/);
    });

    it('documents a repeatable failed-candidate rollback drill and its expected result', () => {
      expect(readme).toMatch(/failed candidate|candidate deployment/i);
      expect(readme).toMatch(/previous (?:API and frontend )?images/i);
      expect(readme).toMatch(/readiness (?:returns|is restored|succeeds)|health\/ready/i);
    });
  });

  describe('database backup and restore drill', () => {
    it('documents executable backup and restore commands for a staging-equivalent database', () => {
      expect(readme).toMatch(/\bpg_dump\b/);
      expect(readme).toMatch(/\bpg_restore\b/);
      expect(readme).toMatch(/staging-equivalent|isolated (?:staging|test) database/i);
      expect(readme).toMatch(/_recovery_drill_source/);
      expect(readme).toMatch(/_recovery_drill_target/);
      expect(readme).toMatch(/verify.*(?:restored|restore).*(?:student|record)|(?:student|record).*after restore/i);
    });

    it('explicitly prohibits using production data or restoring into production', () => {
      expect(readme).toMatch(/do not (?:use|copy|restore)[^.\n]*production (?:data|database)/i);
    });
  });

  describe('staging drill evidence', () => {
    it('provides a report template for the drill date, revision, results, duration, and follow-ups', () => {
      expect(readme).toMatch(/staging validation record|recovery drill report/i);
      expect(readme).toMatch(/drill date|validation date/i);
      expect(readme).toMatch(/deployed revision|commit (?:sha|revision)/i);
      expect(readme).toMatch(/verification results|validation results/i);
      expect(readme).toMatch(/recovery duration|recovery time/i);
      expect(readme).toMatch(/follow-up defects|follow-up actions/i);
    });

    it('requires drill evidence to exclude credentials and personal data', () => {
      expect(readme).toMatch(/without (?:recording|including)[^.\n]*(?:credentials|secrets)/i);
      expect(readme).toMatch(/without (?:recording|including)[^.\n]*personal data/i);
    });
  });
});
