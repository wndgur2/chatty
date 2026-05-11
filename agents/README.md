# Agent operating data

This directory holds **task lifecycle** and **dev-agent evaluation** artifacts. Product and API truth stay in `documents/`; skills in `.cursor/skills/` describe how to execute work.

## Lifecycle

1. **Backlog** — `tasks/backlog/TASK-NNNN-short-slug.md` (optional template: `tasks/TEMPLATE.md`).
2. **Active** — move the file to `tasks/active/` when an agent starts work; one primary task per branch is recommended.
3. **Done** — after merge (or explicit cancellation), move to `tasks/done/` and link the PR + evaluation report.
4. **Evaluation** — for each completed task, add `evaluations/reports/TASK-NNNN-eval.md` and bump `evaluations/SCORECARD.md`.

Do not edit **acceptance criteria** in a task file after work starts; file follow-ups as new tasks or notes with explicit user approval.

## Status values

`backlog` | `active` | `done` | `cancelled`

## Owner agent

`backend` | `frontend` | `full-stack` | `design` — routing hint only.

## Guardrails

- No story points, epics-in-repo, or duplicate sources of truth for intent (task file owns criteria; PR owns code; eval owns verdict).
- UI mockups are not stored here; use `documents/design/SCREENS.md` and external links in task **Notes** if needed.
