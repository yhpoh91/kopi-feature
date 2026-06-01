# Moon Palace — Agentic Software Factory Design

## Context

Moon Palace is an agentic software factory: independent, specialised Claude agents each own a distinct phase of the software delivery lifecycle. Projects copy `sample-v2/` as their governance baseline. All agents must comply with those rules.

The factory is split into two phases — **Plan** and **Build** — which can run in parallel across different features/milestones. A human engineer is the final authority on merges, conflict resolution, and approval gates.

---

## Two-Phase Structure

```
┌─────────────────────────────────────┐     ┌──────────────────────────────────────────┐
│           PLAN PHASE                │     │              BUILD PHASE                  │
│                                     │     │                                           │
│  Human raises feature request       │     │  Human selects a milestone item           │
│          │                          │     │          │                                │
│  [1] Intake                         │     │  [6] Impact Analysis  ← Phase 2           │
│  [2] Clarification + Human gate     │     │  [7] Test Plan        ← Phase 2           │
│  [3] Scoping + Human gate           │     │  [8] Build                                │
│  [4] Design + Human gate            │     │  [9] Documentation    ← Phase 3           │
│  [5] Milestone Planning + gate      │     │  [10] Test      ─┐                        │
│                                     │     │  [11] Code Review├─ max 3 loops each      │
│  ← can plan next feature while      │     │  [12] Sec Review ┘  before escalating     │
│    another is being built →         │     │  [13] PR Creation                         │
│                                     │     │         │                                 │
└─────────────────────────────────────┘     │  Human merges PR (agents never merge)     │
                                            └──────────────────────────────────────────┘
```

---

## PLAN Phase — Detailed Flow

All files created during the Plan phase live in `.moon_palace/feature_requests/{YYYYMMDD}-{id}-{slug}/`.

```
Human raises feature request
         │
         ▼
[1] INTAKE
    Agent: planner (Phase 0–1) / intake (Phase 3+)
    Creates: .moon_palace/feature_requests/{YYYYMMDD}-{id}-{slug}/01-request.md
         │
         ▼
[2] CLARIFICATION
    Agent: planner (Phase 0–1) / clarifier (Phase 3+)
    Asks clarifying questions to human, documents Q&A
    Creates: .moon_palace/feature_requests/{YYYYMMDD}-{id}-{slug}/02-clarification.md
         │
    ⛔ Human approval gate — confirm intent before scope work begins
         │
         ▼
[3] SCOPING
    Agent: planner (Phase 0–1) / scoper (Phase 3+)
    User stories, acceptance criteria, explicit out-of-scope
    Creates: .moon_palace/feature_requests/{YYYYMMDD}-{id}-{slug}/03-scope.md
         │
    ⛔ Human approval gate
         │
         ▼
[4] DESIGN
    Agent: planner (Phase 0–1) / designer (Phase 3+)
    API contract, data model changes, architecture decisions, ADRs
    Creates: .moon_palace/feature_requests/{YYYYMMDD}-{id}-{slug}/04-design.md
         │
    ⛔ Human approval gate
         │
         ▼
[5] MILESTONE PLANNING
    Agent: planner (Phase 0) / milestone-planner (Phase 2+)
    Reads: 03-scope.md + 04-design.md + .moon_palace/milestone_status.md (what's in-flight)
    Assigns feature to numbered milestone, may reorder Planned (not In Progress/Merged) items
    Updates: MILESTONES.md (descriptions, priority, ordering)
             .moon_palace/feature_requests/{id}/05-milestone.md (milestone assignment record)
         │
    ⛔ Human approval gate
```

---

## BUILD Phase — Detailed Flow

```
Human selects a milestone item to start
         │
         ▼
    Builder agent adds milestone to .moon_palace/milestone_status.md  ← marks "In Progress"
         │
         ▼
[6] IMPACT ANALYSIS  ← Phase 2 (manual in Phase 1)
    Agent: impact-analyzer
    Scans codebase, identifies affected files, risk areas, migration needs
    Creates: .moon_palace/feature_requests/{id}/06-impact.md
         │
         ▼
[7] TEST PLAN  ← Phase 2 (manual in Phase 1)
    Agent: test-planner
    Writes per-feature testplan (happy/unhappy/security/idempotency)
    BEFORE build starts — builder and tester share this contract
    Creates: docs/testplan/{feature}.md
         │
    ⛔ Human approval gate on test plan
         │
         ▼
[8] BUILD
    Agent: builder
    Reads: 03-scope.md, 04-design.md, 06-impact.md, test plan, sample-v2 rules
    Writes: code only — must NOT edit any upstream feature docs
    Implements per all sample-v2 conventions
         │
         ▼
[9] DOCUMENTATION UPDATE  ← Phase 3 (manual in Phase 1)
    Agent: doc-writer
    Reads: 04-design.md + code output
    Updates: docs/apidoc.md, docs/datamodel.md, CHANGELOG.md
    Must NOT modify scope/design docs
         │
         ▼
[10] TEST  ─────────────────────────────────────────────┐
    Agent: tester (Phase 3+) / builder (Phase 0–1)       │ max 3 loops
    Reads: test plan, 03-scope.md, 04-design.md          │ before escalating
    Runs tests, checks 90% coverage                      │ to human
    If fails → findings routed to builder → rebuild ─────┘
         │ (passes)
         ▼
[11] CODE REVIEW  ───────────────────────────────────────┐
    Agent: verifier (Phase 1+) / builder (Phase 0)        │ max 3 loops
    Reads: 03-scope.md, 04-design.md, sample-v2 rules    │ before escalating
    Cannot edit scope/design; files written feedback only │ to human
    If fails → routed to builder with specific issues ────┘
         │ (passes)
         ▼
[12] SECURITY REVIEW  ───────────────────────────────────┐
    Agent: verifier (Phase 1+) / builder (Phase 0)        │ max 3 loops
    Reads: security.md, data-governance.md, do_not_do.md │ before escalating
    Cannot edit scope/design docs                         │ to human
    If fails → routed to builder ────────────────────────┘
         │ (passes)
         ▼
[13] PR CREATION
    Agent: verifier (Phase 1+) / builder (Phase 0)
    Creates PR following Conventional Commits title format (feat/fix/chore...)
    Updates .moon_palace/milestone_status.md → "In Review"
    Updates MILESTONES.md status → "In Review"
         │
    Human may request changes in the PR ─────────────────┐
    Builder addresses changes → test → review loop ───────┘ max 3 PR change loops
         │
    ⛔ Human merges PR (NEVER agents)
    Human updates MILESTONES.md status → "Merged"
    milestone_status.md updated → "Completed"
```

---

## Build Loop Rules

Each verification stage (test, code-review, security-review, pr change requests) has an independent loop counter, max **3 iterations** before escalating to human.

**On escalation, the agent produces an escalation report containing:**
- Which loop iteration this is (#3 of 3)
- What the original issue was
- What was attempted in each loop and why it didn't resolve it
- The blocking ambiguity or misalignment (with specifics: file, line, rule, requirement)
- Suggested options for the human to choose from (minimum 3)

Human resolves the escalation. The responsible document-owner agent (scoper for scope issues, designer for design issues) applies the resolution before the build loop restarts.

**PR change request loops** are tracked separately. After 3 rounds of PR changes without merge, escalate with a full summary of all change requests vs implementations — the human decides whether to merge as-is, revise scope, or close.

---

## Shared Files in `.moon_palace/`

`.moon_palace/` consolidates all agent-shared state in one place. Feature request files live at `.moon_palace/feature_requests/` so all transient agent state is co-located under a single gitignore entry.

**`.moon_palace/` must be added to the project's `.gitignore`.**

```
.moon_palace/
├── project/                      ← copy of sample-v2/, customised per project by engineer
│   ├── PROJECT.md                   roles, environments, tech stack
│   └── docs/
│       ├── do_not_do.md             highest precedence — agents re-read every step
│       ├── api-design.md
│       ├── auth.md
│       ├── backend.md
│       ├── frontend.md
│       ├── security.md
│       ├── data-governance.md
│       ├── resilience.md
│       ├── infrastructure.md
│       ├── testing.md
│       ├── logging.md
│       ├── observability.md
│       ├── dev-process.md
│       ├── documentation.md
│       └── theme.md
├── milestone_status.md           ← build coordination
└── feature_requests/
    └── {YYYYMMDD}-{id}-{slug}/
        ├── 01-request.md         ← Plan: intake
        ├── 02-clarification.md   ← Plan: clarification
        ├── 03-scope.md           ← Plan: scoping
        ├── 04-design.md          ← Plan: design
        ├── 05-milestone.md       ← Plan: milestone assignment record
        ├── 06-impact.md          ← Build Phase 2: impact analysis
        ├── 07-conflicts.md       ← any phase: conflict log + resolutions
        └── amendments/           ← plan amendment history
            └── {YYYYMMDD}-{n}-amendment.md
```

**Setup instruction:** When starting a new project using Moon Palace, copy `sample-v2/` into `.moon_palace/project/`. The engineer then edits `.moon_palace/project/` to reflect project-specific decisions (stack choices, domain names, env names, etc.). Agents always read from `.moon_palace/project/docs/` — never from `sample-v2/` directly.

---

## `milestone_status.md` vs `MILESTONES.md`

Two files, one source of truth each.

| File | Source of Truth For | Who Writes | Who Reads |
|---|---|---|---|
| `MILESTONES.md` (project root, committed) | What milestones exist, their descriptions, priority order, full content | milestone-planner (content + order), human (status after merge) | Everyone, humans browsing the repo |
| `.moon_palace/milestone_status.md` (gitignored) | Current build state of milestones (in-progress, completed builds) | builder (start), pr-creator (in review), human (completed) | milestone-planner (to avoid planning conflicts), all build agents |

`MILESTONES.md` is the committed, human-readable roadmap. `milestone_status.md` is the live operational state for agent coordination — build attempts, loop counts, current step. The milestone-planner reads `milestone_status.md` to know what is currently being built before reordering uncompleted milestones.

`milestone_status.md` contains both in-progress AND completed milestones — completed entries prevent the milestone-planner from accidentally reordering finished work.

---

## MILESTONES.md Format

```markdown
# Milestones

## Milestone 1: Foundation
Status: In Progress

### 1.1 Feature Name
Status: In Review
Feature: .moon_palace/feature_requests/20260530-001-feature-name/
PR: #12

### 1.2 Another Feature
Status: Planned
Feature: .moon_palace/feature_requests/20260530-002-another/
```

Statuses: `Planned` → `In Progress` → `In Review` → `Merged`

Sub-milestones use decimal notation (1.1, 4.6, 8.2). Milestone-planner may reorder `Planned` items freely. `In Progress` and `Merged` items are locked from reordering.

---

## Document Ownership

| Document | Owner Agent | Others May |
|---|---|---|
| `01-request.md` | intake / planner | read only |
| `02-clarification.md` | clarifier / planner | read only |
| `03-scope.md` | scoper / planner | read + file feedback in `07-conflicts.md` |
| `04-design.md` | designer / planner | read + file feedback in `07-conflicts.md` |
| `05-milestone.md` | milestone-planner / planner | read only |
| `06-impact.md` | impact-analyzer | read only |
| `docs/testplan/{f}.md` | test-planner | read only |
| `MILESTONES.md` | milestone-planner / planner (content), human (status post-merge) | read only |
| `milestone_status.md` | builder (start), verifier/builder (in review), human (complete) | read |
| `07-conflicts.md` | any agent (append only) | all agents append, owner agents resolve |
| Code | builder | tester writes test code |
| `apidoc.md`, `datamodel.md`, `CHANGELOG.md` | doc-writer (Phase 3+) / manual | read only |

---

## Conflict Resolution Protocol

1. Agent **stops work immediately**.
2. Appends a conflict entry to `07-conflicts.md`:
   - What the conflict/ambiguity is
   - Minimum **3 options** with description and trade-offs
   - Agent's recommended option (labeled)
3. Human reviews and selects an option **or provides a custom answer**.
4. The **responsible document-owner agent** applies the resolution and updates its document.
5. Human decision recorded in `07-conflicts.md` for traceability.
6. Downstream agents re-invoked with updated documents.

---

## Parallel Plan + Build — Isolation

Plan and Build can run in parallel across **different** features. Isolation holds as follows:

| What | Isolation Mechanism | Risk |
|---|---|---|
| **Feature request files** | Separate subdirectory per feature — Plan writes Feature B's folder, Build reads Feature A's folder | None |
| **Code changes** | Git branch — each Build works on its own `feature/*` branch; Plan never touches code | None |
| **`MILESTONES.md`** | Plan adds new entries; Build updates status of existing entries (different sections) | Low — non-overlapping edits; human-resolvable if merge conflict occurs |
| **`.moon_palace/` state files** | Gitignored — not tracked by git | Very low |
| **Same feature, Plan + Build** | Build only starts when human selects a completed milestone item | None by design |

**`.moon_palace/` across git branches:** Because `.moon_palace/` is gitignored, git never touches it on branch switch. A Build agent on `feature/user-auth` and a Plan agent on `main` both read and write the same `.moon_palace/` directory on the filesystem. Gitignored files are filesystem-level, not branch-level.

**`MILESTONES.md` coordination rule:** Agents treat `MILESTONES.md` as append-only for new entries (Plan) and targeted single-field status updates (Build). Never rewrite the whole file.

---

## Plan Amendment Flow

At any point before a PR is merged, the human can request to amend the plan for a milestone.

**Triggers:**
- Human explicitly requests a change to an existing plan
- Builder discovers an ambiguity that cannot be resolved within the conflict protocol
- PR review reveals the implementation doesn't match the original intent

**Amendment flow:**
```
Human requests amendment to milestone X
         │
         ▼
Planner agent reviews current 01–04 docs and the nature of the change
         │
         ▼
Agent proposes ONE of three options (with trade-offs):
  a) Update current docs — minor clarification, same scope intent, low disruption
  b) New feature request / sub-milestone — change is distinct enough to track separately
  c) Supersede current milestone — major redesign; current build should be paused/closed
         │
    ⛔ Human decides (or provides a custom answer)
         │
         ├── (a) Owner agent updates the relevant doc(s), appends amendment log to
         │        .moon_palace/feature_requests/{id}/amendments/{YYYYMMDD}-{n}-amendment.md
         │        Build agents are re-invoked with updated docs (not prior cached context)
         │
         ├── (b) New Plan phase starts for the new feature request
         │        Current milestone continues with its original scope
         │
         └── (c) Build is paused/closed, current milestone marked "Superseded" in MILESTONES.md
                  New Plan phase starts fresh
                  milestone_status.md updated accordingly
```

**Amendment log format:**
```
## Amendment — {date}
Requested by: Human
Change: <what changed and why>
Affected docs: <list>
Decision: <which option the human chose>
```

---

## Orchestration Model

### Phase 0–1: Guided Hand-offs

There is no orchestrator. Each agent ends its output with an explicit **NEXT STEP block** that tells the human engineer exactly what to do next. The human controls the pace and remains fully aware of the flow.

**NEXT STEP block format** (every agent must produce this at the end of every run):

```
---
NEXT STEP
Agent to invoke : <agent-name>
When            : <immediately / after human approves X>
Pass as context : <list of file paths the next agent needs>
Human action    : <what the human should review or decide before continuing>
---
```

**Example — planner finishes scoping:**
```
---
NEXT STEP
Agent to invoke : planner (design step)
When            : after you approve 03-scope.md
Pass as context : .moon_palace/feature_requests/20260530-001-user-auth/
Human action    : Review 03-scope.md. Confirm user stories and acceptance criteria
                  are correct. Reply with corrections before continuing if needed.
---
```

**Example — builder finishes, hands off to verifier:**
```
---
NEXT STEP
Agent to invoke : verifier
When            : immediately
Pass as context : .moon_palace/feature_requests/20260530-001-user-auth/
                  branch: feature/user-auth
Human action    : None — verifier will surface findings and create PR.
                  You will be asked to review the PR before merging.
---
```

Approval gates are not automatic — the NEXT STEP block always states whether the human must review something first.

---

### Phase 1.5: Add Orchestrator (between Phase 1 and Phase 2)

Once there are 3+ agents and guided hand-offs feel repetitive, introduce an **orchestrator agent** as the single entry point the human primarily interacts with.

**Orchestrator responsibilities:**
- Receives high-level commands: `plan: user authentication`, `build: milestone 1.2`, `status`, `amend: milestone 1.2`
- Routes to the correct agent automatically based on current state
- Reads and writes per-feature flow state in `.moon_palace/feature_requests/{id}/state.md`
- Pauses at human approval gates and presents a concise summary of what needs review
- Surfaces conflicts and escalations from sub-agents
- Never skips a gate — human approval is always required

**`state.md` format:**
```markdown
## Feature: user-authentication
Current step : 3 — Scoping
Status       : awaiting human approval
Last updated : 2026-05-30
Loop counts  : test=0, code-review=0, security=0, pr-changes=0
```

Guided hand-off blocks from individual agents remain in place — the orchestrator reads them and acts on them automatically, only surfacing to the human when genuinely required.

---

## Phased Roll-Out

### Phase 0 — Super MVP (2 agents, guided hand-offs)

| Agent | Roles Covered |
|---|---|
| `planner` | Intake + Clarification + Scoping + Design + Milestone Planning |
| `builder` | Build + Test + Code Review + Security Review + PR Creation |

Steps 6 (impact analysis), 7 (test plan), 9 (documentation update) are done **manually by the human**. All document ownership and conflict rules still apply.

### Phase 1 — Split verify from build (3 agents, guided hand-offs)

| Agent | Roles Covered |
|---|---|
| `planner` | Intake + Clarification + Scoping + Design + Milestone Planning |
| `builder` | Build only |
| `verifier` | Test + Code Review + Security Review + PR Creation |

### Phase 1.5 — Add orchestrator (3 agents + orchestrator)

| Agent | Roles Covered |
|---|---|
| `orchestrator` | Entry point, routing, state tracking, gate management |
| `planner` | Intake + Clarification + Scoping + Design + Milestone Planning |
| `builder` | Build only |
| `verifier` | Test + Code Review + Security Review + PR Creation |

### Phase 2 — Split milestone planning (5 agents + orchestrator)

| Agent | Roles Covered |
|---|---|
| `orchestrator` | Entry point, routing, state tracking, gate management |
| `planner` | Intake + Clarification + Scoping + Design |
| `milestone-planner` | Milestone Planning only |
| `builder` | Build only |
| `verifier` | Test + Code Review + Security Review + PR Creation |

### Phase 3 — Full specialisation (10 agents + orchestrator)

| Agent | Role |
|---|---|
| `orchestrator` | Entry point, routing, state tracking, gate management |
| `intake` | Intake only |
| `clarifier` | Clarification only |
| `scoper` | Scoping only |
| `designer` | Design only |
| `milestone-planner` | Milestone Planning only |
| `impact-analyzer` | Impact Analysis |
| `test-planner` | Test Plan creation |
| `builder` | Build only |
| `verifier` | Test + Code Review + Security Review |
| `pr-creator` | PR Creation only |

### Phase 4 — Automation and maturity

| Addition | Purpose |
|---|---|
| `doc-writer` | Automates apidoc.md, datamodel.md, CHANGELOG.md updates |
| `migration-planner` | DB schema migration design (unblocks CI deploy checks) |
| Structured conflict templates | Standardised escalation report format |
| ADR automation | `designer` auto-generates docs/adr/ entries |

---

## File Structure (Project Root)

```
{project-root}/
├── .gitignore                 ← must include .moon_palace/
├── MILESTONES.md              ← committed, human-readable roadmap
├── CLAUDE.md
├── FACTORY.md                 ← this document
├── agents/                    ← agent definitions (grow per phase)
│   ├── planner.md             ← Phase 0
│   ├── builder.md             ← Phase 0
│   ├── verifier.md            ← Phase 1
│   ├── orchestrator.md        ← Phase 1.5+
│   └── ...
├── skills/
└── .moon_palace/              ← gitignored; filesystem-level, shared across all git branches
    ├── project/               ← copy of sample-v2/, edited by engineer per project
    │   ├── PROJECT.md
    │   └── docs/
    ├── milestone_status.md
    └── feature_requests/
        └── {YYYYMMDD}-{id}-{slug}/
            ├── 01-request.md
            ├── 02-clarification.md
            ├── 03-scope.md
            ├── 04-design.md
            ├── 05-milestone.md
            ├── 06-impact.md       ← Phase 2+
            ├── 07-conflicts.md
            ├── state.md           ← Phase 1.5+, orchestrator flow state
            └── amendments/
                └── {YYYYMMDD}-{n}-amendment.md
```
