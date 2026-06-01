# ADR-002: Custom logger over AWS Lambda Powertools

**Date:** 2026-06-01
**Status:** Accepted

## Context

The project needed a structured logger for Lambda. Two main options were evaluated: a custom flat-JSON logger and AWS Lambda Powertools for TypeScript.

## Decision

Use a **custom flat-JSON logger** with a Powertools-compatible interface.

## Rationale

- **No extra dependency** — the logger is ~50 lines; Powertools adds ~1MB to the Lambda bundle.
- **Sufficient for current needs** — CloudWatch Logs Insights can query any top-level field; X-Ray tracing is handled by `aws-xray-sdk-core` directly.
- **Powertools-compatible interface** — the logger exports `.info()`, `.warn()`, `.error()`, `.debug()`, `.appendKeys()` with identical signatures to Powertools Logger. Migration is a single-file swap if needed.

## Migration path to Powertools

If cold-start annotations, X-Ray custom subsegments, or EMF metrics are needed in future:
1. Delete `src/lib/logger.ts`
2. `npm install @aws-lambda-powertools/logger`
3. Update the import in `src/lib/handler.ts` — all call sites remain unchanged.
4. Add the Powertools middleware to `createHandler`.

## Trade-offs

- Automatic Lambda context injection (cold start flag, function name, function ARN) is not included in log entries — these are available via X-Ray traces instead.
- If custom subsegment tracing (wrapping arbitrary code blocks) becomes necessary, `aws-xray-sdk-core` can still be used directly; Powertools is not required for this.

## Alternatives considered

- **AWS Lambda Powertools** — deferred; adds dependency weight before the feature is needed. Straightforward to migrate later.
- **Pino** — rejected; `level` as a number (30=INFO) is harder to read in raw CloudWatch logs.
