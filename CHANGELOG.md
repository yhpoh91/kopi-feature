# Changelog

All notable changes to Kopi Feature are documented here.
Format: `## [version] - YYYY-MM-DD` with `### Added / Changed / Fixed / Removed` sections.

---

## [0.1.0] - 2026-06-01

### Added
- Project scaffold: Serverless Framework v3, TypeScript strict mode, ESLint, Prettier, Vitest
- GitHub Actions deploy workflow (typecheck → lint → test → gitleaks → npm audit → deploy)
- GitHub Actions migrate workflow (manual trigger, stage + allow_destructive inputs)
- DynamoDB single-table provisioned via CloudFormation with GSI1, PITR on prod, PAY_PER_REQUEST
- Per-function IAM roles (least-privilege), API Gateway throttling, CORS locked to kopi.life origins
- Structured flat-JSON logger (`logger`) with Powertools-compatible interface and X-Ray trace ID
- `createHandler` middleware composition utility with error boundary (ValidationError → 400, unhandled → 500)
- `validateBody` and `validateQueryParams` Zod-based request validators
- DynamoDB client singleton wrapped with `aws-xray-sdk-core` for X-Ray subsegment tracing
- `requireHumanSession` and `requireAppToken` middleware stubs (501 until Milestone 2)
- `GET /health` endpoint returning `{ status, stage }`
- CloudWatch log group retention: 7 days (preview), 90 days (prod)
