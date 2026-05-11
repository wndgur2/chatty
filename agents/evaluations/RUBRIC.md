# Dev-agent evaluation rubric

Apply when writing `evaluations/reports/TASK-NNNN-eval.md`.

## Verdict

| Verdict | Meaning |
|---------|---------|
| **pass** | All acceptance criteria met; no material contract drift; acceptable test/lint posture for the change. |
| **partial** | Shippable with gaps: minor criterion missed, or documentation debt, or tests incomplete with explicit justification in report. |
| **fail** | Wrong behavior, broken contract, missing critical tests, or regressions not accepted. |

## contract_compliance

| Value | Meaning |
|-------|---------|
| **pass** | Behavior matches `documents/development/API_DOCUMENTATION.md` / `documents/development/SCHEMA.md` and relevant design docs. |
| **drift** | Works but docs or types lag; follow-up task required if merged. |
| **break** | Intentional or accidental breaking API/socket/schema change without coordinated doc + consumer update. |

## Counters

- **regressions_introduced**: Count of verified regressions attributable to the change (0 target).
- **review_iterations**: Human or agent review rounds until merge-ready.
- **acceptance_criteria_hit**: `met/total` from the task file (do not redefine criteria in the eval).
