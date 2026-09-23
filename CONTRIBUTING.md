# Contributing

Thank you for considering an improvement to Expense Tracker API.

## Local Setup

1. Fork and clone the repository.
2. Run `npm ci`.
3. Copy `.env.example` to `.env` and provide local values.
4. Start MongoDB or use a development Atlas database.
5. Run `npm run dev`.

## Development Workflow

1. Create a focused branch from `main`.
2. Keep changes scoped to one behavior or concern.
3. Add or update tests for changed behavior.
4. Run `npm run validate` before opening a pull request.
5. Describe the reason for the change and how it was verified.

Commit messages should be concise and action-oriented. Conventional Commit
prefixes such as `feat:`, `fix:`, `docs:`, `test:`, and `chore:` are welcome.

## API Changes

When adding or changing an endpoint, update `docs/openapi.yaml` and the API
reference in `README.md`. Never commit real credentials or production data.
