# Milestones

## Milestone 1: Foundation
Status: Planned

### 1.1 Project scaffold
Status: Planned
Feature: .moon_palace/feature_requests/20260601-001-foundation/
Description: Serverless Framework project structure, TypeScript config, ESLint/Prettier, GitHub Actions CI/CD pipeline (typecheck, lint, test, deploy to preview on any push, deploy to prod on main), DynamoDB single-table provisioning, base Lambda handler wrapper.

### 1.2 Shared middleware
Status: Planned
Feature: .moon_palace/feature_requests/20260601-001-foundation/
Description: Request validation (Zod), error boundary (no stack traces to client), structured logging helper, auth middleware stubs (human session + app Bearer token) to be wired up in Milestone 2.

---

## Milestone 2: Authentication
Status: Planned

### 2.1 Human auth — Kopi SSO (OIDC + PKCE)
Status: Planned
Description: `/auth/login`, `/auth/callback`, `/auth/logout` routes. PKCE flow against `https://sso.kopi.life`. JIT user provisioning (`USER#<sub>` in DynamoDB on first login). Session stored as `SESSION#<id>` with TTL. Transparent refresh token rotation. CSRF token issued alongside session cookie.

### 2.2 App auth — Client Credentials JWT middleware
Status: Planned
Description: Bearer token validation middleware for M2M routes. Verify JWT signature (JWKS cached at module level from OIDC discovery), `iss`, `exp`, `sub` (must match a non-deleted app record in DynamoDB). Shared middleware — no per-handler duplication.

---

## Milestone 3: Admin portal — shell + user management
Status: Planned

### 3.1 Admin portal shell
Status: Planned
Description: Server-rendered HTML layout (navigation, authenticated route guard, admin-only guard). Base page templates. Session cookie check on all portal routes.

### 3.2 User management
Status: Planned
Description: List all users, promote user to admin (`isAdmin` flag on user record), soft-delete user (`deletedAt`, `deletedBy`). Audit log entry written on every mutation.

---

## Milestone 4: App management
Status: Planned

### 4.1 App registration
Status: Planned
Description: Admin creates an app — records `clientId` (the `sub` from Kopi SSO client credentials client), `name`, `description`. List apps. Soft-delete app (flags for that app remain, API calls rejected once app is deleted). Audit log entry on every mutation.

---

## Milestone 5: Feature flags
Status: Planned

### 5.1 Flag management (admin portal)
Status: Planned
Description: Create, update, soft-delete flags per app. Fields: `key`, `description`, `killSwitch`, `allowlist` (array of user `sub`s), `rolloutPct` (0–100), `salt` (generated once at creation, never changed). Audit log entry on every mutation (old value → new value, who changed it, when).

### 5.2 Flag query API (app-facing)
Status: Planned
Description: `GET /v1/flags?userId={sub}` (all flags evaluated for userId) and `GET /v1/flags/{key}?userId={sub}` (single flag). Evaluation pipeline: (1) killSwitch → false, (2) userId in allowlist → true, (3) hash(userId + salt + flagKey) % 100 < rolloutPct → true, (4) false. If userId is omitted: allowlist check skipped, rollout check skipped — returns true only if rolloutPct = 100 and killSwitch is off.
