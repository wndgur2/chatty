# Go-to-market (Chatty) — draft

Positioning and **first audiences** for Chatty, separate from engineering delivery.

## Positioning statement (candidate)

**For** people who want an AI chat that **remembers context per room** and can **check in proactively**, **Chatty** is a **web chat app** that combines **real-time streaming**, **scheduled AI initiation**, and **optional push**—**unlike** generic single-thread UIs, it treats **rooms, prompts, and branching** as first-class.

## Differentiators to message

1. **Proactive + slow-start** — not a naive “ping every N minutes”; evaluator + backoff.
2. **Multi-room mental model** — aligns with how people separate topics.
3. **Self-host friendly** — Ollama + MySQL narrative for privacy-conscious and builders.

## Channel ideas

- **Developer communities** — Show HN, Reddit r/selfhosted, Discord OSS servers: lead with architecture and local-first story.
- **Product-led content** — short demos: streaming + notification after idle proactive message.
- **Docs SEO** — “Socket.IO cumulative chunks”, “FCM web push NestJS”, etc., if OSS growth matters.

## Launch modes

| Mode | Pros | Cons |
|------|------|------|
| **Quiet OSS release** | Low support pressure | Slower feedback |
| **Wait-list beta** | Curated feedback, narrative control | Ops for invites |
| **Open install (Docker)** | Fast try-out | Support load, abuse surface |

## Open questions / to confirm

- Primary launch is **source + docker** only, or also a **hosted demo**?
- Brand tone: playful companion vs neutral productivity tool?
- Localization priority (Korean vs English-first marketing)?
