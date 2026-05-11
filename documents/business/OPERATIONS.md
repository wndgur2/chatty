# Operations (Chatty)

How the product is **run** in production: availability, cost control, support, and cross-functional handoffs. Technical deploy steps live in [../development/ci-cd.md](../development/ci-cd.md) and `deploy/`.

## Service components (logical)

- **Web app** — static or CDN-served frontend; depends on API availability.
- **API + Socket.IO** — NestJS; stateful connections for streaming.
- **MySQL** — authoritative persistence; backup/restore policy is operator-owned until productized.
- **Ollama (or compatible inference)** — generation + evaluator; often the **scaling bottleneck**.
- **FCM** — push delivery; depends on Firebase project config and client token lifecycle.
- **Optional vector / memory stack** — if enabled, extra failure domain and storage growth.

## SLO sketch (starting point)

| Area | Target (draft) | Notes |
|------|----------------|-------|
| API availability | 99.5% monthly (self-host) / higher if SaaS | Define error budget with user |
| Streaming | p95 first chunk &lt; X s | X depends on model/hardware |
| Push delivery | Best-effort + visible in-app fallback | FCM is not guaranteed delivery |

## Runbook themes

- **Model outage** — degrade to “reactive only” or queue proactive jobs? (Product + eng decision.)
- **Socket storms** — reconnect backoff; rate limits at gateway (see API docs).
- **DB migration** — Prisma migrations; coordinate with [../development/SCHEMA.md](../development/SCHEMA.md).

## Support model (hypothetical)

- **Community / OSS:** issues + discussions; no SLA.
- **Hosted:** tiered response times; status page if public SaaS.

## Open questions / to confirm

- Who owns **Firebase** project and key rotation for each environment?
- Data retention: how long are messages and embeddings kept by default?
- Incident comms: public postmortems or private only?
