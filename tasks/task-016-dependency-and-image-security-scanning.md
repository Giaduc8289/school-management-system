# Task 016: Dependency and Image Security Scanning

## Goal
Detect known vulnerabilities in application dependencies and release container images as part of the existing CI and staging release process.

## Dependencies
- TASK-012: CI and Staging Deployment

## Acceptance Criteria
- [ ] Scan the committed npm dependency lockfile and the API, frontend, and migration container images.
- [ ] Run applicable scans in CI for pull requests and pushes to `main`; scan the exact immutable images produced for staging before deployment.
- [ ] Fail the relevant workflow when a Critical or High vulnerability is found, except for an explicitly documented, time-limited exception approved through the repository's review process.
- [ ] Include the affected package or image, vulnerability identifier, severity, and remediation guidance in failure output without exposing secrets.
- [ ] Document how to triage findings, update vulnerable dependencies or base images, and request a temporary exception.
- [ ] Do not publish credentials, secret values, or sensitive scan artifacts in logs or workflow artifacts.
- [ ] Keep scanner configuration and workflow changes reviewable and pinned according to repository policy.
- [ ] Verify the scan gates using a controlled test fixture or scanner test mode without introducing a known vulnerable production dependency.

## Scope
- `.github/workflows/ci.yml`
- `.github/workflows/staging-deploy.yml`
- `Dockerfile`
- `frontend/Dockerfile`
- `package.json` and lockfiles
- Scanner configuration
- `README.md`
