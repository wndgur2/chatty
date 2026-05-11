# Engineering ADRs (Architecture Decision Records)

This folder records **non-trivial engineering** decisions: backend/frontend architecture, libraries, data/schema shape, API contracts, and cross-cutting implementation patterns.

## When to write a dev ADR

Write one when the choice is **hard to reverse**, **affects multiple modules or contributors**, or **locks in a contract** (REST/Socket.IO, DB schema, deployment shape). Examples: new module boundary, ORM/query strategy, auth/session model, queue/cron design, observability baseline.

**Skip** for surgical bugfixes, single-file refactors, or one-off tweaks with no lasting pattern.

## Numbering and filenames

- Use `NNNN-short-title.md` (four digits, kebab-case title), e.g. `0001-use-prisma-migrations.md`.
- Numbers are **append-only**; do not renumber existing ADRs.

## Workflow

1. Copy **[TEMPLATE.md](TEMPLATE.md)** into a new file with the next number.
2. Start at **Proposed** while the PR is in review; move to **Accepted** when merged (or when the team explicitly accepts without a PR).
3. If replaced later, set status to **Superseded by ADR-NNNN** and add a forward link in the old file.
4. Link the related **`TASK-NNNN`** and PR in **Links**.

## Scope boundary

- **Engineering only** — this folder.
- **UI/UX and product presentation** — use [documents/design/decisions/](../../design/decisions/).
- **Agent workflow** (skills, `.cursor/rules`, task/eval process in `agents/`) — document there or in the relevant skill; not required here unless it changes runtime architecture.
