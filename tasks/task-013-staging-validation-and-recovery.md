# Task 013: Staging Validation and Recovery Drill

## Goal
Validate the staging release process end to end and prove that application and database recovery procedures are actionable before relying on staging as a release gate.

## Dependencies
- TASK-006: Persistent Student Repository
- TASK-011: API Documentation and Operational Readiness
- TASK-012: CI and Staging Deployment

## Acceptance Criteria
- [ ] Deploy a reviewed commit to staging using the documented workflow and verify the deployed API and frontend versions.
- [ ] Verify public readiness, staff login, authorized student operations, and frontend-to-API connectivity after deployment.
- [ ] Exercise a failed candidate deployment and verify that the previous API and frontend images are restored and readiness returns.
- [ ] Document and execute a database backup and restore drill against staging or an isolated staging-equivalent database.
- [ ] Verify that the restored database contains expected student records and that the application can use it successfully.
- [ ] Document the drill date, deployed revision, verification results, recovery duration, and any follow-up defects without recording credentials or personal data.
- [ ] Update the staging runbook in `README.md` if the tested procedure differs from the existing instructions.
- [ ] Do not use production data or perform destructive recovery operations against production.

## Scope
- `.github/workflows/staging-deploy.yml`
- `compose.staging.yml`
- Database backup and restore procedure
- `README.md`
- Staging validation evidence
