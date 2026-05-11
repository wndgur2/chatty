# Monetization (Chatty) — options, not decisions

Chatty today is oriented toward **local / self-hosted** use (Ollama, MySQL, optional FCM). This page lists **credible revenue paths** if the product moves beyond a personal or OSS-style deployment. No pricing is committed here.

## Cost drivers (for any hosted model)

- **LLM inference** — GPU or CPU time per token; proactive runs add periodic load even without user messages.
- **Evaluator calls** — extra model invocations on the scheduler cadence.
- **Storage** — messages, embeddings / vector memory if enabled at scale.
- **Push (FCM)** — low per message but non-zero at volume; abuse or misconfiguration can spike sends.
- **Operational labor** — on-call, incident response, model incident comms.

## Revenue model options

| Model | Fit | Trade-offs |
|-------|-----|------------|
| **Free OSS + paid support** | Builder-heavy audience | Revenue scales with services headcount; clear brand goodwill |
| **Hosted SaaS (freemium)** | Persona A without ops skills | Must solve multi-tenancy, abuse, privacy, and inference margin |
| **BYOK (user brings API keys)** | Margin-friendly for SaaS | UX complexity; key custody and compliance burden |
| **Seat-based team tier** | Persona C | Requires admin, SSO, audit story—later stage |
| **Usage-based (messages / tokens)** | Aligns cost to heavy users | Hard to explain to consumers; needs metering |

## Packaging ideas (hypothetical)

- **Free tier:** N rooms, proactive capped per day, community models only.
- **Pro:** Higher caps, priority streaming, optional hosted models.
- **Self-hosted enterprise:** license + support only; customer runs inference.

## Open questions / to confirm

- Is revenue a goal for year one, or is growth / reference adoption the goal?
- Will hosted Chatty ever store chat plaintext, or offer E2EE (major architecture fork)?
- Geographic focus affects tax, payment rails, and data residency promises.
