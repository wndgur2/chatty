---
name: agent-evaluation
description: Writes a structured dev-agent evaluation after a task reaches PR-ready or merged state. Use when closing a TASK, reviewing an agent run, or updating the evaluation scorecard.
---

# Agent evaluation

## When to apply

After implementation is PR-ready or merged, for each `TASK-NNNN` that had an `agents/tasks/active/` file.

## Source of truth

- Rubric: [agents/evaluations/RUBRIC.md](../../../agents/evaluations/RUBRIC.md)
- Task criteria: matching `agents/tasks/done/TASK-NNNN-*.md` (never rewrite criteria post-hoc in the task file).
- Scorecard: [agents/evaluations/SCORECARD.md](../../../agents/evaluations/SCORECARD.md)

## Required workflow

1. Open the task file from `done/`; count acceptance criteria bullets.
2. For each criterion, mark met/unmet with one line of evidence (test name, behavior, or file).
3. Assign `verdict`, `contract_compliance`, `regressions_introduced`, `review_iterations`, `acceptance_criteria_hit` per rubric.
4. Write `agents/evaluations/reports/TASK-NNNN-eval.md` using the schema in [agents/README.md](../../../agents/README.md) (frontmatter + three sections).
5. Append one row to `SCORECARD.md` with the same summary fields.

## Report template

```markdown
---
task: TASK-NNNN
agent: frontend
verdict: pass
contract_compliance: pass
regressions_introduced: 0
review_iterations: 1
acceptance_criteria_hit: 3/3
---

## What worked
## What missed (vs acceptance criteria)
## Follow-ups (new TASK ids if filed)
```
