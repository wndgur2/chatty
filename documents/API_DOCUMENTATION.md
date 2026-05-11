# RESTful API Documentation: Chatty

Contracts below match the NestJS backend (`backend/src`). **Numeric identifiers** (`id`, `userId`, `chatroomId`, `messageId`, etc.) are serialized as **strings** in JSON because responses pass through a BigInt-safe serializer.

---

## 0. Authentication

Protected routes use `Authorization: Bearer <accessToken>`. The token may be either a **user** token (`typ: "user"`) or a **guest** token (`typ: "guest"`). The Passport strategy resolves the bearer into an `AuthPrincipal`:

- `{ mode: "user", userId }` — member account.
- `{ mode: "guest", guestSessionId }` — anonymous session backed by a `guest_sessions` row that has not been merged.

Most ownership-scoped routes (chatrooms, messages) accept either principal and scope results by owner. A few routes require a member token explicitly (marked **Member-only** below) and respond `403 Forbidden` for guests.

**Public (no JWT):**

- `GET /api/health-check`
- `POST /api/auth/login`
- `POST /api/auth/guest-session`

All other `/api/**` routes require a valid JWT unless explicitly marked public elsewhere.

WebSocket `joinRoom` / `leaveRoom` handlers do **not** enforce JWT at the gateway today; treat the socket surface accordingly for your threat model.

### 0.1 Login (Issue User JWT)

Idempotent: creates the user on first use, otherwise returns a token for the existing record.

- **Method:** `POST`
- **URL:** `/api/auth/login`
- **Parameters:** None
- **Request Body:**
  ```json
  {
    "username": "my-username"
  }
  ```
- **Response:** `201 Created` (NestJS default for `POST`)
- **Example:**
  ```json
  {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "1",
      "username": "my-username"
    }
  }
  ```

### 0.2 Create Guest Session (Issue Guest JWT)

Issues a single-use guest token bound to a fresh `guest_sessions` row. Use the token in `Authorization: Bearer …` to access chatroom/messaging routes anonymously.

- **Method:** `POST`
- **URL:** `/api/auth/guest-session`
- **Parameters:** None
- **Request Body:** None
- **Response:** `201 Created`
- **Example:**
  ```json
  {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "guestSessionId": "0d7f5b1c-3f4c-4ad8-9c34-5d3e8b3e1234"
  }
  ```

A guest token is rejected after the underlying session has been merged (see §0.3).

### 0.3 Merge Guest Session into Member (Member-only)

Atomically reassigns the chatrooms and memories owned by a guest session to the authenticated member, then marks the guest session as merged. Subsequent guest authentications with that token return `401 Unauthorized`.

- **Method:** `POST`
- **URL:** `/api/auth/merge-guest`
- **Headers:**
  - `Authorization: Bearer <member accessToken>`
  - `X-Guest-Token: <guest accessToken>`
- **Parameters:** None
- **Request Body:** None
- **Response:** `201 Created`
- **Example:**
  ```json
  { "success": true }
  ```
- **Errors:**
  - `400 Bad Request` — `X-Guest-Token` missing, malformed, not of `typ: "guest"`, or the referenced session is unknown / already merged.
  - `403 Forbidden` — the caller is a guest principal.

### 0.4 Health Check

- **Method:** `GET`
- **URL:** `/api/health-check`
- **Response:** `200 OK`
- **Example:** `"Hello World!"`

---

## 1. Chatroom Management

Chatroom JSON includes scheduling fields used by proactive AI (`currentDelaySeconds`, `nextEvaluationTime`). Shapes are produced by `serializeChatroom` from Prisma rows.

**Ownership:** exactly one of `userId` (member-owned) or `guestSessionId` (guest-owned) is non-null on every chatroom; the other is `null`. List/CRUD endpoints scope results to the calling principal — guest principals only see guest-owned rows, members only see their own.

### 1.1 Retrieve All Chatrooms

- **Method:** `GET`
- **URL:** `/api/chatrooms`
- **Headers:** `Authorization: Bearer <accessToken>` (user or guest)
- **Parameters:** None
- **Request Body:** None
- **Response:** `200 OK`
- **Example:**
  ```json
  [
    {
      "id": "1",
      "userId": "1",
      "guestSessionId": null,
      "name": "General Chat",
      "basePrompt": "You are a helpful assistant.",
      "profileImageUrl": "https://example.com/ai-1.png",
      "currentDelaySeconds": 60,
      "nextEvaluationTime": "2026-04-05T10:02:00.000Z",
      "createdAt": "2026-04-05T10:00:00.000Z",
      "updatedAt": "2026-04-05T10:01:00.000Z"
    }
  ]
  ```

### 1.2 Create Chatroom

- **Method:** `POST`
- **URL:** `/api/chatrooms`
- **Headers:** `Authorization: Bearer <accessToken>` (user or guest)
- **Parameters:** None
- **Request Body:** `multipart/form-data`
  - `name` (string, **required**): The name of the chatroom.
  - `basePrompt` (string, **required**): The base prompt for the AI (`@IsNotEmpty()` on `CreateChatroomDto`).
  - `profileImage` (file/blob, optional): The profile image file for the AI.
- **Response:** `201 Created`
- **Example (guest-owned):**
  ```json
  {
    "id": "2",
    "userId": null,
    "guestSessionId": "0d7f5b1c-3f4c-4ad8-9c34-5d3e8b3e1234",
    "name": "Project Discussion",
    "basePrompt": "You are a strict project manager AI.",
    "profileImageUrl": "https://example.com/manager.png",
    "currentDelaySeconds": 60,
    "nextEvaluationTime": null,
    "createdAt": "2026-04-05T10:05:00.000Z",
    "updatedAt": "2026-04-05T10:05:00.000Z"
  }
  ```

### 1.3 Retrieve a Specific Chatroom

- **Method:** `GET`
- **URL:** `/api/chatrooms/{chatroomId}`
- **Headers:** `Authorization: Bearer <accessToken>`
- **Parameters:**
  - `chatroomId` (path parameter): The ID of the chatroom.
- **Request Body:** None
- **Response:** `200 OK`
- **Example:** Same shape as create response for a single object.

### 1.4 Update Chatroom (AI Customization)

- **Method:** `PATCH`
- **URL:** `/api/chatrooms/{chatroomId}`
- **Headers:** `Authorization: Bearer <accessToken>`
- **Parameters:**
  - `chatroomId` (path parameter): The ID of the chatroom.
- **Request Body:** `multipart/form-data`
  - `name` (string, optional): The update name for the AI.
  - `basePrompt` (string, optional): The updated base prompt for the AI.
  - `profileImage` (file/blob, optional): The updated profile image file for the AI.
- **Response:** `200 OK`
- **Example:** Same chatroom object shape as above (including `updatedAt`).

### 1.5 Delete Chatroom

- **Method:** `DELETE`
- **URL:** `/api/chatrooms/{chatroomId}`
- **Headers:** `Authorization: Bearer <accessToken>`
- **Parameters:**
  - `chatroomId` (path parameter): The ID of the chatroom.
- **Request Body:** None
- **Response:** `200 OK` with empty body

---

## 2. Cloning & Branching Chatrooms

### 2.1 Clone Chatroom

Create a new chatroom from an existing one, copying **only** configuration (name suffix `(Clone)`, prompt, profile image URL).

- **Method:** `POST`
- **URL:** `/api/chatrooms/{chatroomId}/clone`
- **Headers:** `Authorization: Bearer <accessToken>`
- **Parameters:**
  - `chatroomId` (path parameter): The ID of the source chatroom.
- **Request Body:** None
- **Response:** `201 Created`
- **Example:** Chatroom object (same fields as §1.2).

### 2.2 Branch Chatroom

Create a new chatroom from an existing one, copying **both** configuration (name suffix `(Branch)`) and message history.

- **Method:** `POST`
- **URL:** `/api/chatrooms/{chatroomId}/branch`
- **Headers:** `Authorization: Bearer <accessToken>`
- **Parameters:**
  - `chatroomId` (path parameter): The ID of the source chatroom.
- **Request Body:** None
- **Response:** `201 Created`
- **Example:** Chatroom object (same fields as §1.2).

---

## 3. Messaging

### 3.0 Backend storage note

AI-authored messages may have a 1:1 row in `ai_message_metadata` (`read_at`, `delivery_mode`, `trigger_reason`, optional `trigger_context`). That persistence is **not** expanded into the REST list/send payloads in this contract; message bodies remain `id`, `chatroomId`, `sender`, `content`, `createdAt`.

### 3.1 Retrieve Message History

- **Method:** `GET`
- **URL:** `/api/chatrooms/{chatroomId}/messages`
- **Headers:** `Authorization: Bearer <accessToken>`
- **Parameters:**
  - `chatroomId` (path parameter): The ID of the chatroom.
  - `limit` (query, optional): Page size. Valid range **1–100** when provided. Default **50** when omitted.
  - `offset` (query, optional): Offset for pagination. Minimum **0**. Default **0** when omitted.
- **Request Body:** None
- **Response:** `200 OK` — array ordered **oldest → newest** within the window.
- **Example:**
  ```json
  [
    {
      "id": "101",
      "chatroomId": "2",
      "sender": "user",
      "content": "Hello, AI!",
      "createdAt": "2026-04-05T10:25:00.000Z"
    },
    {
      "id": "102",
      "chatroomId": "2",
      "sender": "ai",
      "content": "Hello! How can I help you today?",
      "createdAt": "2026-04-05T10:25:05.000Z"
    }
  ]
  ```

`sender` is one of `user` | `ai` (JSON string).

### 3.2 Send Message to AI (HTTP trigger)

Send a message from the user to the AI. The assistant reply is **streamed over Socket.IO**, not returned in this HTTP body.

- **Method:** `POST`
- **URL:** `/api/chatrooms/{chatroomId}/messages`
- **Headers:** `Authorization: Bearer <accessToken>`
- **Parameters:**
  - `chatroomId` (path parameter): The ID of the chatroom.
- **Request Body:**
  ```json
  {
    "content": "Tell me a joke."
  }
  ```
- **Response:** `202 Accepted`
- **Example:**
  ```json
  {
    "messageId": "103",
    "status": "processing",
    "message": {
      "id": "103",
      "chatroomId": "2",
      "sender": "user",
      "content": "Tell me a joke.",
      "createdAt": "2026-04-05T10:30:00.000Z"
    }
  }
  ```

---

## 4. Notifications

### 4.1 Register FCM Device Token (Member-only)

Push tokens are tied to member accounts so deliveries survive guest-session boundaries. Guest principals receive `403 Forbidden` (`UserOnlyGuard`).

- **Method:** `POST`
- **URL:** `/api/notifications/register`
- **Headers:** `Authorization: Bearer <member accessToken>`
- **Parameters:** None
- **Request Body:**
  ```json
  {
    "deviceToken": "dpXm_..._example_token_from_fcm"
  }
  ```
- **Response:** `201 Created` (NestJS default for `POST`)
- **Example:**
  ```json
  {
    "status": "success",
    "message": "FCM token registered successfully."
  }
  ```
- **Errors:**
  - `403 Forbidden` — caller is a guest principal.

### 4.2 Send test notification (by chatroom)

Triggers a test push for the **member owner** of the given chatroom (used for integration checks when FCM is configured). Guest-owned chatrooms cannot receive pushes and return `404 Not Found`.

- **Method:** `POST`
- **URL:** `/api/notifications/test`
- **Headers:** `Authorization: Bearer <accessToken>`
- **Request Body:**
  ```json
  {
    "chatroomId": "2"
  }
  ```
- **Response:** `201 Created` (Nest default)
- **Example:**
  ```json
  {
    "status": "success",
    "message": "Test notification sent."
  }
  ```
- **Errors:**
  - `404 Not Found` — chatroom does not exist, or has no member owner (e.g. guest-owned).

---

## 5. WebSocket Events (Socket.IO)

### 5.1 Connection

- **Transport:** Socket.IO (CORS origin controlled by `CORS_ORIGIN` env var — same as the HTTP API; defaults to `*` when unset).
- **Gateway:** `MessagesGateway` (`backend/src/messages/gateways/messages.gateway.ts`)
- **Auth:** No JWT guard on `joinRoom` / `leaveRoom` (see §0).

### 5.2 Client → Server Events

#### `joinRoom`

- **Payload:**
  ```json
  { "chatroomId": 2 }
  ```
- **Ack response:**
  ```json
  { "event": "joined", "data": { "room": 2 } }
  ```

#### `leaveRoom`

- **Payload:**
  ```json
  { "chatroomId": 2 }
  ```
- **Ack response:**
  ```json
  { "event": "left", "data": { "room": 2 } }
  ```

### 5.3 Server → Client Events

#### `ai_typing_state`

- **Payload:**
  ```json
  { "chatroomId": 2, "isTyping": true }
  ```

#### `ai_message_chunk`

- **Payload:**
  ```json
  { "chatroomId": 2, "chunk": "current full content so far" }
  ```
- **Streaming semantics:** `chunk` is **cumulative**, not delta. Example sequence: `"a"` → `"ab"` → `"abc"` (not per-token deltas).

#### `ai_message_complete`

- **Payload:**
  ```json
  { "chatroomId": 2, "content": "final message", "messageId": 123 }
  ```

`messageId` is emitted as a **number** from the gateway (see `messages.gateway.ts`).
