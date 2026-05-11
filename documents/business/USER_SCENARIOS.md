# User scenarios (Chatty)

End-to-end stories anchored to screens in [../design/SCREENS.md](../design/SCREENS.md). Use them for acceptance-test themes and onboarding copy.

## Scenario 1 — First session: create a room and chat

**Actor:** Persona A (solo companion user).

**Flow**

1. Lands on app; if unauthenticated, resolves **Login / guest** (`#screen-login-guest`).
2. From **SideBar** (`#app-shell`), opens **Create chatroom** (`#screen-create-edit-chatroom`).
3. Enters room name and optional system prompt; saves.
4. **Chatroom** (`#screen-chatroom`) opens: user types in **Composer**, sees user bubble, then **InferIndicator** / streaming as AI responds via Socket.IO cumulative chunks.
5. Optionally enables push later (**Notifications** `#screen-notifications`) after a deliberate gesture—not on first paint.

**Success criteria**

- No duplicate “pending” AI rows during stream (per UX principles).
- User understands which room is active (selection state in sidebar).

## Scenario 2 — Returning user: proactive message + push

**Actor:** Persona A, notifications allowed.

**Flow**

1. User was last active in Room “Work ideas”; last message some time ago.
2. Scheduler fires; evaluator approves; backend emits proactive flow and may send **FCM** for background delivery.
3. User taps notification or opens app: sees new AI message in correct room with **metadata** (proactive vs reply) understandable at a glance if product surfaces it.

**Success criteria**

- Proactive frequency feels bounded (slow-start doubling per proposal).
- Foreground path shows **ForegroundNotificationPopup** when appropriate (`#screen-notifications`).

## Scenario 3 — Branch vs clone for experimentation

**Actor:** Persona B (tinkerer) or A trying a new tone.

**Flow**

1. In **Edit** or room actions (`#screen-create-edit-chatroom`), user chooses **Clone** (config only) or **Branch** (history + config) per [../PROJECT_PROPOSAL.md](../PROJECT_PROPOSAL.md).
2. New room appears in list; user continues conversation in branched room without corrupting original.

**Success criteria**

- UI labels match product semantics (“clone” vs “branch”) so users do not lose history unexpectedly.

## Open questions / to confirm

- Should proactive pushes deep-link into the **exact room** always (recommended)?
- Do we expose trigger metadata in the UI for end users or hide behind “details”?
