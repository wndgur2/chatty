# Risks (Chatty)

Product, legal, and reputational risks to track alongside technical debt. Mitigations are starter ideas—not commitments.

## Product / UX

| Risk | Why it matters | Mitigation ideas |
|------|----------------|------------------|
| **Notification fatigue** | Proactive + push can feel spammy | Conservative defaults; doubling backoff; per-room mute (product); clear value in first proactive messages |
| **Uncanny or clingy AI** | Damages trust and brand | Tone guidelines in system prompts; evaluator prompts reviewed; easy delete/reset |
| **Streaming confusion** | Users think responses “stutter” or duplicate | UI matches cumulative chunk contract; see design ADRs |

## Safety and abuse

| Risk | Why it matters | Mitigation ideas |
|------|----------------|------------------|
| **Harmful model output** | User harm, moderation incidents | Content policies; model choice; logging for operator review (privacy trade-off) |
| **Self-host abuse (spam)** | If SMTP/push/API ever opened | Rate limits; auth; abuse monitoring for hosted tiers |

## Privacy and compliance

| Risk | Why it matters | Mitigation ideas |
|------|----------------|------------------|
| **Sensitive chat storage** | Legal and user expectations | Encryption at rest (ops); clear privacy policy; minimize retention |
| **GDPR / similar** | If EU users or SaaS | Lawful basis, DPA, export/delete story |
| **COPPA / minors** | High bar if youth audience | Age gate or “not for under 13” positioning until compliant |

## Technical / operational

| Risk | Why it matters | Mitigation ideas |
|------|----------------|------------------|
| **Ollama / GPU availability** | Proactive + stream load | Backpressure, caps, health checks; document minimum hardware |
| **Push token leakage** | Account linkage if mishandled | Treat tokens as secrets; rotate on logout |

## Open questions / to confirm

- Target jurisdictions for **first** public release?
- Will Chatty ever offer **team** or **shared** rooms without strong ACL audit?
- Minimum viable **privacy policy** and **terms** before any public hosted URL?
