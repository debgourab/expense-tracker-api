# Security Policy

## Supported Version

Security fixes are applied to the latest version on the `main` branch.

## Reporting a Vulnerability

Please do not disclose suspected vulnerabilities in a public issue. Use
GitHub's private vulnerability reporting feature on the repository's
**Security** tab and include:

- The affected endpoint or component
- Steps to reproduce the issue
- The potential impact
- Any suggested mitigation

Reports will be reviewed as promptly as possible. Please avoid accessing,
changing, or retaining data that does not belong to you while investigating.

## Secret Handling

Production values for `MONGO_URI` and `JWT_SECRET` must be stored in the
hosting provider's secret manager. They must never be committed to Git or
included in client-side code.
