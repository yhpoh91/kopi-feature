# Kopi Feature

A multi-tenant feature flag service. Apps register here to create and manage their feature flags, then query flag values at runtime via a REST API using Client Credentials tokens.

## Architecture

- **AWS Lambda** (Node.js 22) behind **API Gateway HTTP API**
- **DynamoDB** single-table for all persistent data
- **Kopi SSO** for human (OIDC + PKCE) and app (Client Credentials) authentication
- **Serverless Framework v3** for infrastructure as code
- **GitHub Actions** for CI/CD

## Environments

| Stage   | Domain                    | Branch      |
|---------|---------------------------|-------------|
| prod    | feature.kopi.life         | main        |
| preview | feature-preview.kopi.life | any         |

## Documentation

- [Local Setup](docs/local-setup.md) — prerequisites, environment setup, running locally
- [Data Model](docs/datamodel.md) — DynamoDB table structure and entities
- [API Docs](docs/apidoc.md) — endpoint reference (added as endpoints are built)
- [Runbook](docs/runbook.md) — operations guide
- [ADR](docs/adr/) — architecture decision records
- [Test Plans](docs/testplan/) — per-feature test plans

## Quick start

```bash
npm install
npm run typecheck
npm run lint
npm test
```

See [docs/local-setup.md](docs/local-setup.md) for full setup instructions.
