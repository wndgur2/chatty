---
name: react-19-professional-development
description: Applies professional React 19 coding standards for components, hooks, state, side effects, performance, accessibility, and testing. Use when building or refactoring React code, reviewing React pull requests, designing component APIs, or when the user asks for React 19 best practices.
---

# React 19 Professional Development

## When to apply

Apply this skill when working on React components, hooks, context, forms, async data flows, and React code reviews.

## Operating mode

Use balanced guidance:

- Prefer the default standards in this skill.
- Allow deviations when project constraints justify them.
- Explain trade-offs briefly when choosing a non-default path.

## Core standards

1. Define clear component boundaries:
   - Keep presentational concerns separate from data orchestration when practical.
   - Keep components focused on one responsibility.

2. Design stable, explicit APIs:
   - Use descriptive prop names and predictable defaults.
   - Avoid broad "options" objects unless they reduce repeated prop churn.

3. Prefer composition over prop complexity:
   - Use child composition or small subcomponents before adding many conditional props.

4. Keep state minimal and local by default:
   - Store only data that must persist between renders.
   - Derive values from existing state/props instead of duplicating state.

5. Treat effects as synchronization:
   - Use effects only for external systems (network, subscriptions, browser APIs).
   - Avoid effects for pure data derivation or UI calculations.

6. Make async behavior resilient:
   - Handle loading, success, empty, and error states explicitly.
   - Prevent stale updates with cancellation/ignore patterns.

7. Prioritize accessibility from first pass:
   - Use semantic HTML before ARIA.
   - Ensure keyboard navigation, labels, and visible focus states.

8. Build for testability:
   - Keep domain logic in pure functions/hooks where possible.
   - Test user-observable behavior, not implementation details.

## Required workflow

Use this checklist while implementing:

```markdown
React 19 Task Checklist

- [ ] Clarify component responsibility and public API
- [ ] Model minimal state and derived state
- [ ] Implement UI with semantic and accessible markup
- [ ] Add side effects only for external synchronization
- [ ] Handle loading/empty/error edge states
- [ ] Verify render behavior and avoid unnecessary re-renders
- [ ] Add or update tests for user-facing behavior
- [ ] Run lint/tests and resolve issues
```

## Review rubric

When reviewing React changes, evaluate in this order:

1. Correctness and edge cases
2. State/effect model clarity
3. Accessibility and UX behavior
4. Performance risks
5. Test coverage relevance

## Output format for recommendations

When providing guidance, use this structure:

```markdown
## Recommendation

- **Decision**: <what to do>
- **Why**: <1-2 reasons>
- **Trade-offs**: <cost or limitation>
- **Implementation notes**:
  - <practical step 1>
  - <practical step 2>
```
