---
name: task-intake
description: Picks up and executes work from agents/tasks with explicit acceptance criteria. Use when starting implementation, moving a task between backlog/active/done, or when the user references a TASK id.
---

# Task intake

## When to apply

Before writing or changing product code, when work should map to a tracked task in `agents/tasks/`.

## Source of truth

- Task intent and **acceptance criteria**: `agents/tasks/active/<TASK-*.md>` (or move from `backlog/` to `active/` when starting).
- Product/API/schema: `documents/` per [AGENTS.md](../../../AGENTS.md).
- Do **not** invent new acceptance criteria; ask the user if the task file is missing or ambiguous.

## Required workflow

1. Locate the task file; if none exists in `agents/tasks/active/`, ask the user to create one or confirm ad-hoc work without a task.
2. Read frontmatter: `id`, `title`, `owner_agent`, `related_docs`, `related_files`, `acceptance_criteria`.
3. Restate the criteria in your plan in checklist form (verbatim ids).
4. Implement against `related_docs` and `related_files` first; expand scope only with explicit user approval.
5. On completion: open/update PR, link `id` in description; move file to `agents/tasks/done/` after merge policy allows; follow [agent-evaluation](../agent-evaluation/SKILL.md).

## Output format

```markdown
## Task: TASK-NNNN
- **Criteria**: (copy bullets from task)
- **Evidence**: tests run, key files touched
```
