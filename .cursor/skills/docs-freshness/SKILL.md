---
name: docs-freshness
description: Keeps canonical Chatty docs (SCHEMA.md, API_DOCUMENTATION.md, ci-cd.md) in sync with the code by detecting structural drift after edits and updating only what changed. Use after any change to Prisma schema/migrations, backend controllers/gateways/DTOs/guards, response serializers, or CI workflows; also when the user asks to refresh, sync, or align docs.
---

# Docs Freshness

## When to apply

After making edits in this repository, before ending the turn, decide whether any change crossed a documented contract boundary. If yes, update the matching doc surgically. If no, do nothing.

## Source-to-doc map

Update the doc on the right **only** when the file on the left changed in a way that alters the contract described.

| Changed file (left) | Canonical doc (right) | What counts as structural |
|---|---|---|
| `backend/prisma/schema.prisma` | `documents/SCHEMA.md` | Tables, columns, types, nullability, defaults, enums, indexes, unique constraints, FK actions |
| `backend/prisma/migrations/**` | `documents/SCHEMA.md` | New migration adding/altering any of the above |
| `backend/src/**/*.controller.ts` | `documents/API_DOCUMENTATION.md` | Route path, HTTP method, status code, guard usage, response shape |
| `backend/src/**/*.gateway.ts` | `documents/API_DOCUMENTATION.md` | Socket event name, payload shape, ack shape |
| `backend/src/**/dto/*.ts` | `documents/API_DOCUMENTATION.md` | Required/optional fields, validation that affects 400 behavior |
| `backend/src/auth/{guards,strategies,decorators}/**` | `documents/API_DOCUMENTATION.md` | Public/member-only/guest-allowed semantics, JWT claim shape |
| `backend/src/common/serializers/*.ts` | `documents/API_DOCUMENTATION.md` | Fields added/removed/renamed in JSON output |
| `.github/workflows/**`, `deploy/**` | `documents/ci-cd.md` | New job, renamed check, changed trigger or required-check name |

If a change does not match any row above, the skill ends with **no-op**.

## Skip criteria (do nothing)

Treat these as non-structural and leave docs untouched:

- Internal refactors that preserve the public surface (renaming private methods, moving files within a module, splitting a service while keeping the controller signature).
- Comment, log, or whitespace changes.
- Test-only edits (`*.spec.ts`, `*.test.ts(x)`, `backend/test/**`, `frontend/src/**/__tests__/**`).
- Performance, error-message wording, or dependency-version bumps that do not alter request/response shape, status codes, or DB schema.
- Frontend-only changes (no canonical doc exists for FE structure today).

## Workflow

```markdown
Docs Freshness Checklist
- [ ] List the files just edited and classify each as structural or non-structural using the map above
- [ ] If all are non-structural: stop, no doc edit
- [ ] For each structural change, open the matching doc and locate the exact section that drifted
- [ ] Make the minimum edit needed (single field, single row, single bullet) — do NOT rewrite the file
- [ ] Re-read the touched section to confirm it matches the new code
- [ ] Mention the doc edit briefly in the turn summary
```

## Editing rules

1. **Surgical only.** Touch only the lines whose meaning changed. Do not reflow paragraphs, renumber sections, or "improve" adjacent prose.
2. **Mirror the code, not the intent.** Quote the new DTO/route/column verbatim; do not editorialize.
3. **Preserve existing structure.** Keep section numbering, heading levels, and JSON example formatting consistent with what's already in the file.
4. **Reflect invariants enforced in app code.** When a constraint lives in TypeScript rather than SQL (for example, the chatroom owner XOR), state that explicitly in the doc note.
5. **Migrations list.** When adding a Prisma migration, append its directory name to the migration list sentence in `documents/SCHEMA.md` and add/adjust the DDL block.

## Decision examples

- Added `guest_session_id CHAR(36) NULL` to `chatrooms` via a new migration → **update** `SCHEMA.md` (ERD, DDL, implementation notes).
- Added `@UseGuards(UserOnlyGuard)` to an existing controller method → **update** `API_DOCUMENTATION.md` (mark endpoint Member-only, add 403 error row).
- Renamed a private helper inside `chatrooms.service.ts` and kept the controller signature identical → **no-op**.
- Tightened a regex in a DTO so a previously accepted value now returns 400 → **update** `API_DOCUMENTATION.md` (note the new validation).
- Added a new Jest spec under `backend/src/messages/__tests__/` → **no-op**.
- Added a new required check to `.github/workflows/ci.yml` → **update** `documents/ci-cd.md`.

## Output

When a doc edit is made, end the turn with one line per touched doc:

```
docs: updated <doc path> for <one-phrase reason>
```

When no doc edit is needed, say nothing about docs.
