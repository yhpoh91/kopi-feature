# Local Setup

## Prerequisites

- **Node.js 22+** — `node --version` should show `v22.x.x`
- **npm 10+** — comes with Node 22
- **AWS CLI v2** — only needed if running against real AWS resources
- **Serverless Framework v3** — installed locally via `npm ci`, no global install needed

## Install dependencies

```bash
npm ci
```

## Environment variables

Create a `.env.local` file at the project root (already gitignored):

```bash
# .env.local — never commit this file
STAGE=preview
TABLE_NAME=kopi-feature_data_preview
AWS_REGION=ap-southeast-1
```

Secrets (SSO client credentials, etc.) are **never** stored in `.env.local` — they are fetched from AWS Secrets Manager at Lambda cold start. For local development, configure a local Secrets Manager emulator or use a personal AWS account.

## Run tests

```bash
npm test              # run all tests with coverage
npm run test:watch    # watch mode
```

Coverage report is generated at `coverage/` — open `coverage/index.html` in a browser for the full report.

## Typecheck and lint

```bash
npm run typecheck     # tsc --noEmit
npm run lint          # eslint src test
npm run lint:fix      # auto-fix lint issues
npm run format        # prettier write
```

## Deploy locally (preview)

Requires AWS credentials configured in your shell (OIDC or static credentials for a personal dev account):

```bash
npx serverless deploy --stage preview
```

## Project structure

```
src/
  handlers/    — Lambda entry points (one file per handler)
  lib/         — Shared utilities (logger, handler wrapper, validation, DynamoDB client)
  middleware/  — Reusable Lambda middlewares
  types/       — TypeScript type definitions
test/
  unit/        — Unit tests (AWS SDK mocked)
  integration/ — Integration tests (full handler invocations)
```
