# ADR 0001: Streaming message affordance

## Status

Accepted

## Context

AI responses arrive incrementally over Socket.IO. Users need clear feedback that generation is in progress and that partial content may still change until completion.

## Decision

- Treat the **terminal AI message** as the live stream target; update its body from cumulative chunks until `ai_message_complete`.
- Use **typing / inference** UI (`InferIndicator` and related state) while the model is active and no stable assistant message is shown yet, consistent with gateway events documented in `../../development/API_DOCUMENTATION.md`.

## Consequences

**Positive:** Predictable mental model; aligns with backend cumulative chunk contract.  
**Negative:** Implementations must avoid double-counting content or splitting into duplicate bubbles without explicit product approval.

## Links

- `frontend/src/features/chatroom/hooks/useWebSocketStream.ts`
- `../../development/API_DOCUMENTATION.md` (Socket.IO events)
