# Chatty — agent entry point

Read these in order before coding or reviewing:

1. **[documents/PROJECT_PROPOSAL.md](documents/PROJECT_PROPOSAL.md)** — product intent and scope (authoritative feature description).
2. **[documents/development/PROJECT_STATUS.md](documents/development/PROJECT_STATUS.md)** — current implementation snapshot, pitfalls, canonical file index.
3. **[documents/development/API_DOCUMENTATION.md](documents/development/API_DOCUMENTATION.md)** — REST + Socket.IO contracts.
4. **[documents/development/SCHEMA.md](documents/development/SCHEMA.md)** — data model invariants.

## Document pillars

**Business / product strategy** — objectives, personas, scenarios, monetization, operations, GTM, risks:

- **[documents/business/BUSINESS_OBJECTIVES.md](documents/business/BUSINESS_OBJECTIVES.md)**
- **[documents/business/TARGET_PERSONAS.md](documents/business/TARGET_PERSONAS.md)**
- **[documents/business/USER_SCENARIOS.md](documents/business/USER_SCENARIOS.md)**
- **[documents/business/MONETIZATION.md](documents/business/MONETIZATION.md)**
- **[documents/business/OPERATIONS.md](documents/business/OPERATIONS.md)**
- **[documents/business/GO_TO_MARKET.md](documents/business/GO_TO_MARKET.md)**
- **[documents/business/RISKS.md](documents/business/RISKS.md)**

**Development** — engineering reference (same folder as above status/API/schema):

- **[documents/development/ci-cd.md](documents/development/ci-cd.md)** — CI expectations.
- **[documents/development/decisions/](documents/development/decisions/)** — engineering ADRs (template + index).

**Design (UI/UX)** — tokens, screens, components, principles, ADRs:

- **[documents/design/](documents/design/)**

Supporting material:

- **[.cursor/skills/](.cursor/skills/)** — task playbooks (NestJS, API, React, git, local dev).
- **[.cursor/rules/](.cursor/rules/)** — glob-scoped and always-on coding rules.

Operating data (tasks, evaluations):

- **[agents/README.md](agents/README.md)** — task lifecycle, evaluation workflow, guardrails.
- Skills: **[.cursor/skills/task-intake/SKILL.md](.cursor/skills/task-intake/SKILL.md)**, **[.cursor/skills/design-handoff/SKILL.md](.cursor/skills/design-handoff/SKILL.md)**, **[.cursor/skills/agent-evaluation/SKILL.md](.cursor/skills/agent-evaluation/SKILL.md)**.
