# Shared test mocks

Place **Vitest mocks** here when multiple suites need the same module replacement (for example Firebase, `socket.io-client`, or browser APIs).

- Prefer **colocated** `vi.mock(...)` next to a single test file when the double is not reused.
- Use this folder for **`__mocks__` subdirectories** or small mock modules imported from `src/**/*.test.ts(x)` and `tests/integration/**`.
- Keep mocks **minimal**: only implement the surface your tests exercise so failures stay easy to interpret.

Related: shared render helpers and fixtures live under `src/test/` (parent of `mocks/`).
