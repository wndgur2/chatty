---
name: design-handoff
description: Loads UI/UX context from documents/design before frontend or visual changes. Use when touching React layout, styling, chat UX, notifications UX, or accessibility.
---

# Design handoff

## When to apply

Any change that affects user-visible layout, copy placement, colors, typography, streaming UX, modals, or a11y in `frontend/`.

## Source of truth

Read in order (skim tables first, deep-read sections you touch):

1. [documents/design/DESIGN_SYSTEM.md](../../../documents/design/DESIGN_SYSTEM.md)
2. [documents/design/SCREENS.md](../../../documents/design/SCREENS.md) — anchor the screen you change (`#screen-*`).
3. [documents/design/COMPONENT_INVENTORY.md](../../../documents/design/COMPONENT_INVENTORY.md) — prefer listed components over new ones.
4. [documents/design/UX_PRINCIPLES.md](../../../documents/design/UX_PRINCIPLES.md)
5. If deviating from an accepted ADR under `documents/design/decisions/`, cite the ADR id in PR/task notes and prefer a new ADR for material UX contract changes.

## Required workflow

- Map the task to a **screen** and **components** from the inventory; note gaps in task **Notes** if docs lag code.
- Preserve streaming semantics (cumulative chunks) per ADR `0001` and API docs.
- Avoid one-off hex colors; use documented tokens / Tailwind theme classes.

## Checklist snippet

```markdown
Design handoff
- [ ] DESIGN_SYSTEM + SCREENS section identified
- [ ] COMPONENT_INVENTORY reuse checked
- [ ] UX_PRINCIPLES (streaming, a11y, notifications) honored
- [ ] ADR cited if diverging
```
