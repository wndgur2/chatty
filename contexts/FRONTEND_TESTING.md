# Frontend Testing Guide

## 1. Scope

- Unit tests validate isolated logic (utils, API wrapper behavior, hook side effects).
- Component tests validate render and interaction behavior in React components.
- Integration tests validate cross-module user flows.
- E2E is out of scope for this document.

## 2. Tooling and Runtime

- Runner: Vitest.
- DOM environment: `jsdom`.
- UI testing: React Testing Library.
- Global setup: `frontend/src/test/setup/vitest.setup.ts`.
- Config source: `frontend/vitest.config.ts`.

## 3. File Structure

- Unit/component/hook tests: `frontend/src/**/<name>.test.ts(x)` (colocated).
- API contract tests: `frontend/src/api/*.contract.test.ts`.
- Integration tests: `frontend/tests/integration/*.integration.test.tsx`.
- Shared testing assets:
  - `frontend/src/test/utils/`
  - `frontend/src/test/fixtures/`
  - `frontend/src/test/factories/`
  - `frontend/src/test/mocks/`
  - `frontend/src/test/setup/`

## 4. Naming Convention

- Unit and component tests: `<module>.test.ts` or `<component>.test.tsx`.
- Contract tests: `<module>.contract.test.ts`.
- Integration tests: `<flow>.integration.test.tsx`.
- Test case naming:
  - `describe('<moduleOrComponent>')`
  - `it('does <behavior> when <condition>')`

## 5. Mocking Policy

- Mock API boundaries (`src/api/*`) in hook and component tests.
- Mock websocket and browser notification boundaries in notification/chatstream tests.
- Avoid mocking the component under test.
- Prefer fixtures/factories over ad-hoc inline object duplication.

## 6. Determinism Rules

- Always disable retries in test QueryClient.
- Clear/stub globals (`localStorage`, `Notification`, timers) per test where needed.
- Keep tests independent; no shared mutable state across files.
- Use explicit waits (`waitFor`) only for async state transitions.

## 7. Coverage Policy

- Run coverage with `npm run test:coverage`.
- Coverage reports are generated as text, HTML, and lcov.
- Initial targets:
  - global lines/statements >= 60%
  - critical domains (`features/chatroom`, `features/auth`, `api`) >= 75%
- Start as a reporting gate, then enforce as a hard gate after stable iterations.

## 8. PR Checklist

- Added or updated tests for behavior changes.
- Happy path and at least one failure/edge case are covered for changed logic.
- Async tests assert final observable state, not implementation details.
- `npm run lint && npm run typecheck && npm run test && npm run build` passes.
- If API contract changed, corresponding `*.contract.test.ts` is updated.

## 9. Flaky Test Playbook

- Remove timer races and implicit waits.
- Replace brittle selectors with semantic role/label queries.
- Minimize shared mutable mocks; reset between tests.
- Reproduce by running target file repeatedly with Vitest CLI before merging.
