---
id: TASK-0001
title: Add structured agent context (design, tasks, evaluation)
status: done
owner_agent: full-stack
created: 2026-05-11
related_docs:
  - AGENTS.md
  - documents/design/SCREENS.md
related_files:
  - documents/design/
  - agents/
  - .cursor/skills/task-intake/
  - .cursor/skills/design-handoff/
  - .cursor/skills/agent-evaluation/
acceptance_criteria:
  - documents/design/ contains DESIGN_SYSTEM, COMPONENT_INVENTORY, SCREENS, UX_PRINCIPLES, and decisions/ with ADR template + 0001 example
  - agents/ contains README, tasks/TEMPLATE, backlog/active/done, evaluations RUBRIC + SCORECARD + reports/
  - Three new skills exist; api-development, nestjs-development, react-19-development reference active task files
  - AGENTS.md links operating data and design; example TASK-0001 + eval report demonstrate the pattern
---

## Intent

Establish in-repo structured context for UI/UX, task tracking, and dev-agent evaluation without replacing external PM/design tools.

## Out of scope

- Product LLM evaluation datasets
- Automated scoring of eval reports
- Image/mock assets in the repo

## Notes

- Evaluation: [agents/evaluations/reports/TASK-0001-eval.md](../../evaluations/reports/TASK-0001-eval.md)
- PR: link when opened.
