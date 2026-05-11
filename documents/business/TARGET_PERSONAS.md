# Target personas (Chatty)

Personas describe **who** we optimize for when prioritizing UX, defaults, and ops burden. They are hypotheses—refine with interviews or usage data.

## Persona A — “Solo companion user” (primary candidate)

**Profile:** Uses Chatty for journaling, reflection, light planning, or low-stakes companionship. Wants continuity across days and **gentle check-ins** from the AI.

**Jobs to be done**

- Capture thoughts in a dedicated room without mixing contexts.
- Get **streamed** answers that feel responsive, not batchy.
- Tolerate or welcome **occasional proactive** messages when context suggests it—not constant pings.

**Pain with generic chat UIs**

- Forgetting which thread held which topic; single-thread clutter.
- Models that only respond when nudged; misses “ambient” continuity.

**Implications for Chatty**

- Multi-room sidebar and clear **room identity** (name, prompt, avatar).
- Push and proactive defaults must feel **respectful** (gesture-based permission, easy mute per room—if/when product adds mute).
- Metadata (`delivery_mode`, triggers) helps power users trust the system.

## Persona B — “Prompt tinkerer / builder” (secondary)

**Profile:** Self-hoster or developer running Ollama locally; treats Chatty as a **reference app** or personal lab for scheduler + streaming + FCM.

**Jobs to be done**

- Swap models, tune evaluator vs generator, observe scheduler behavior.
- Validate API + Socket contracts against a real UI.

**Pain**

- Opaque “magic” in scheduling or streaming; needs docs and observability.

**Implications**

- Strong contract docs ([../development/API_DOCUMENTATION.md](../development/API_DOCUMENTATION.md)), schema ([../development/SCHEMA.md](../development/SCHEMA.md)), and runbooks ([../development/ci-cd.md](../development/ci-cd.md)).
- Clear separation of **operator config** (env, models) vs product UX.

## Persona C — “Small team shared instance” (future / optional)

**Profile:** Tiny org or family sharing one deployment; cares about **cost** and **privacy**, not enterprise SSO (yet).

**Jobs to be done**

- One deployment, multiple logical users or accounts (if product goes there).

**Implications**

- Not assumed in v0; affects auth model, billing, and data isolation—track as follow-up.

## Open questions / to confirm

- Order personas: A-first vs B-first for GTM and copy tone?
- Any regulated vertical (health, legal) in scope for messaging—would tighten safety and disclaimers?
