# Data Model

## DynamoDB Table

| Property        | Prod                       | Preview                       |
|-----------------|----------------------------|-------------------------------|
| Table name      | `kopi-feature_data_prod`   | `kopi-feature_data_preview`   |
| Billing mode    | PAY_PER_REQUEST            | PAY_PER_REQUEST               |
| PITR            | Enabled                    | Disabled                      |

### Key schema

| Key      | Type   | Role  |
|----------|--------|-------|
| `PK`     | String | HASH  |
| `SK`     | String | RANGE |

### GSI1

| Key       | Type   | Role  | Projection |
|-----------|--------|-------|------------|
| `GSI1PK`  | String | HASH  | ALL        |
| `GSI1SK`  | String | RANGE | ALL        |

---

## Entity types

Entities are added to the table as milestones are completed. All entities use soft deletes (`deletedAt`, `deletedBy`). No hard deletes.

| Entity prefix               | Introduced in | Description                        |
|-----------------------------|---------------|------------------------------------|
| `USER#<sub>`                | Milestone 2.1 | Admin portal user (JIT provisioned from SSO) |
| `SESSION#<id>`              | Milestone 2.1 | Human session with TTL             |
| `APP#<clientId>`            | Milestone 4.1 | Registered app (client credentials client) |
| `FLAG#<appId>#<key>`        | Milestone 5.1 | Feature flag for an app            |
| `AUDIT#<appId>#<timestamp>` | Milestone 5.1 | Immutable audit log entry          |

Entity schemas are documented here as each milestone is completed.
