# UX principles (Chatty)

## Streaming

- AI replies are **cumulative** over the socket (`ai_message_chunk` = full content-so-far). UI must replace terminal AI content, not append deltas incorrectly.
- Show **typing / inference** state while waiting; avoid duplicate “pending” messages.
- Prefer **local optimistic** user messages only where contract allows; reconcile on failure.

## Errors and network

- Surface **recoverable** errors near the action (composer, modal). Use toast/popup only for background events (e.g. foreground notification).
- Distinguish **auth expired** vs **generic network**; offer re-login when appropriate.

## Performance

- Message list must **not** re-render the full app on each chunk; keep streaming state localized (see `useWebSocketStream`).

## Accessibility

- Composer and modals: focus trap where modal; visible **focus** rings (`focus-visible:`).
- Buttons need **accessible names**; icon-only buttons need `aria-label`.
- Prefer semantic elements (`button`, `nav`, `main`) before ARIA roles.

## Notifications

- Do **not** request notification permission on first paint; tie to **user interaction** (button or explicit settings).

## Consistency

- Reuse **brand** / **surface** tokens from [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md); avoid one-off hex colors in new UI.
