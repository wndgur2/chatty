---
name: api-development
description: Implements and updates Chatty REST and Socket.IO APIs with consistent auth, route design, DTO validation, status codes, and documentation. Use when adding or refactoring API endpoints, aligning backend behavior with API docs, or when the user asks for API development in this repository.
---

# API Development

## When to apply

Apply this skill when building, changing, reviewing, or documenting backend API behavior for Chatty.

## Source of truth

- Use `/documents/API_DOCUMENTATION.md` as the default contract for endpoint behavior.
- Keep route shape, auth requirements, and response status codes aligned with that file unless the user explicitly asks to change the contract.

## Contract defaults

1. Auth and public routes:
   - Require `Authorization: Bearer <accessToken>` for `/api/**` by default.
   - Keep `GET /` and `POST /api/auth/login` public unless explicitly changed.

2. Route and method conventions:
   - Use resource-oriented routes and HTTP methods (`GET`, `POST`, `PATCH`, `DELETE`).
   - Keep path parameter naming stable (for example, `chatroomId`).

3. Input/output discipline:
   - Validate all request payloads and query/path params using DTOs.
   - Return explicit, stable response shapes and avoid ad-hoc field names.
   - For file upload flows (`multipart/form-data`), preserve optional/required field semantics.

4. Status code semantics:
   - `200` for successful reads/updates/deletes with response body.
   - `201` for resource creation.
   - `202` when accepted for async processing (for example, message send + streamed response).

5. API and realtime consistency:
   - Keep HTTP message-trigger endpoints and Socket.IO streaming events consistent.
   - Preserve documented event contracts (`joinRoom`, `leaveRoom`, `ai_typing_state`, `ai_message_chunk`, `ai_message_complete`) unless requested otherwise.

## Required workflow

Use this checklist while implementing API work:

```markdown
API Task Checklist

- [ ] Confirm intended contract in /documents/API_DOCUMENTATION.md
- [ ] Identify affected routes, DTOs, services, and auth guards
- [ ] Implement or update endpoint behavior and validation
- [ ] Keep status codes and response shape contract-consistent
- [ ] Update API documentation for any contract change
- [ ] Add or update tests (controller/service/integration as appropriate)
- [ ] Run lint/tests and resolve issues before finalizing
```

## Review rubric

When reviewing API changes, evaluate in this order:

1. Contract correctness and backward compatibility
2. Auth and authorization correctness
3. Validation and error handling completeness
4. Response shape/status code consistency
5. Test coverage for changed behavior

## Output format for recommendations

When proposing API changes, use:

```markdown
## API Recommendation

- **Decision**: <what to build or change>
- **Contract impact**: <none | backward compatible | breaking>
- **Auth/validation**: <guards + DTO strategy>
- **Implementation notes**:
  - <step 1>
  - <step 2>
- **Tests/docs**:
  - <tests to add/update>
  - <docs to update>
```
