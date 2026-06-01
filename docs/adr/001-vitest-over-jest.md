# ADR-001: Vitest over Jest

**Date:** 2026-06-01
**Status:** Accepted

## Context

The project uses TypeScript with `module: NodeNext` targeting Node.js 22 on Lambda. A test framework was needed.

## Decision

Use **Vitest** instead of Jest.

## Rationale

- **Native ESM and TypeScript support** — Vitest uses Vite's transform pipeline; no `ts-jest` or `babel-jest` configuration required.
- **Faster** — 2–5× faster than Jest in TypeScript projects due to no Babel transform overhead.
- **API compatibility** — `describe`, `it`, `expect`, `vi.mock` are near-identical to Jest; existing Jest examples translate directly.
- **Node.js 22 alignment** — `module: NodeNext` is ESM-first; Vitest fits this without workarounds.

## Trade-offs

- Vitest is newer (~3 years) vs Jest (~10 years); fewer Stack Overflow answers for Vitest-specific edge cases.
- Migration from Vitest to Jest is low-cost if needed in future (API is ~99% compatible).

## Alternatives considered

- **Jest** — rejected due to required `ts-jest` config and awkward ESM support with `module: NodeNext`.
