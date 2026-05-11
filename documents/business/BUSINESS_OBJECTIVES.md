# Business objectives (Chatty)

This document frames **why** Chatty exists and what “success” means beyond shipping features. Technical scope stays in [../PROJECT_PROPOSAL.md](../PROJECT_PROPOSAL.md); implementation state in [../development/PROJECT_STATUS.md](../development/PROJECT_STATUS.md).

## Mission (draft)

Give people a **persistent, multi-room AI chat** where the assistant can **reach out proactively** (not only answer prompts), with **real-time streaming** and optional **push** when the app is in the background—initially optimized for **local / self-hosted** operation (Ollama + MySQL).

## Product pillars (from proposal)

1. **Reactive chat** — user sends messages; AI streams replies over WebSockets.
2. **Proactive engagement** — slow-start scheduler + evaluator decides when to initiate; delay backs off on “no send.”
3. **Room isolation** — separate context, prompt, and profile per chatroom; clone vs branch semantics for experimentation.
4. **Transparency** — metadata for AI messages (delivery mode, triggers, read state) supports trust and debugging.

## Objectives (6 months, hypothetical)

| Horizon | Objective | Measurable signal (candidate) |
|--------|-----------|----------------------------------|
| 0–3 mo | Stable “happy path” for solo user | Successful room create → message → stream → optional proactive cycle without data loss |
| 3–6 mo | Habit formation | Returning sessions per user/week; rooms per user |
| 6 mo | Differentiation validated | Users cite proactive + multi-room as reason to prefer Chatty over generic chat UIs |

## North-star metric (candidate)

**Weekly proactive engagement rate** — share of active users who **open or reply** within a short window after a **proactive** AI message or push (definition needs product sign-off: window length, dedupe rules).

## Guardrail metrics

- **Notification opt-out / disable rate** — proactive value must not train users to silence the app.
- **Time-to-first-token** and **stream error rate** — streaming is core UX; regressions hurt retention.
- **Evaluator “spam” perception** — qualitative + support volume; tie to delay tuning and caps.

## Non-goals (current positioning)

- Replacing enterprise LLM platforms or full RAG products as a category.
- Owning model training; v0 assumes **Ollama-hosted models** and operator-chosen models.

## Open questions / to confirm

- Is the primary audience **end users** (companion/journal) or **builders/self-hosters** first?
- Single-tenant only vs any multi-tenant hosted offering in year one?
- Exact north-star and guardrails ownership (product vs community-led)?
