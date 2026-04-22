---
name: nestjs-development
description: Implements and refactors Chatty backend features with NestJS and strict TypeScript using modular architecture, DTO validation, and test-first execution. Use when building backend modules/controllers/services/repositories, WebSocket streaming, schedulers, or file-upload flows.
---

# NestJS Development

## When to apply

Apply this skill for backend implementation and refactors in `backend/` that use NestJS modules, REST APIs, Socket.IO gateways, scheduler jobs, or persistence layers.

## Source of truth

- Use `../api-development/references/API_DOCUMENTATION.md` for API and Socket.IO contracts.
- Use `references/PROJECT_PROPOSAL.md` for feature intent and scope.
- Use `references/SCHEMA.md` for data model constraints and storage behavior.

## Engineering defaults

1. Architecture boundaries:
   - Keep flow modular: Module -> Controller/Gateway -> Service -> Repository.
   - Keep business logic out of controllers and gateways.
   - Use dependency injection consistently via `@Injectable()` and module providers.

2. Type and validation discipline:
   - Preserve strict TypeScript and avoid `any`.
   - Validate payloads with DTOs, `class-validator`, and `class-transformer`.
   - Keep request/response contracts stable unless explicitly changed.

3. Reliability:
   - Use centralized exception handling and semantic HTTP exceptions.
   - Ensure scheduler and streaming flows are safe under concurrency.
   - Prefer small, composable services over large multi-purpose classes.

4. Domain-specific expectations:
   - Slow-start scheduler logic doubles `current_delay_seconds` after negative evaluation.
   - AI stream responses should emit chunks incrementally instead of buffering full output.
   - File uploads should use Nest platform interceptors and storage abstraction for future portability.

## Required workflow

```markdown
Backend Task Checklist

- [ ] Confirm API and domain contract in references
- [ ] Identify affected test, module, controller/gateway, service, and repository layers
- [ ] Write or update failing tests first (unit/integration/e2e as needed)
- [ ] Implement minimal code to pass tests
- [ ] Refactor for readability, strict typing, and DI clarity
- [ ] Verify module wiring, validation, and error semantics
- [ ] Run lint/tests and fix regressions
```
