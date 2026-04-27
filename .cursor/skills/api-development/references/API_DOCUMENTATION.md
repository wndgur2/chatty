# RESTful API Documentation: Chatty

This document outlines the RESTful API endpoints for the "Chatty" application based on the given core features and system overview.

---

## 0. Authentication

All `/api/**` endpoints require a bearer token except:

- `GET /`
- `POST /api/auth/login`

WebSocket events are handled separately from `/api/**` routes. Current gateway behavior does not enforce JWT at join/leave event level.

### 0.1 Login (Issue JWT)

- **Method:** `POST`
- **URL:** `/api/auth/login`
- **Parameters:** None
- **Request Body:**
  ```json
  {
    "username": "my-username"
  }
  ```
- **Response:** `201 Created`
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

### 0.2 Public Root Endpoint

- **Method:** `GET`
- **URL:** `/`
- **Response:** `200 OK`
- **Example:** `"Hello World!"`

---

## 1. Chatroom Management

### 1.1 Retrieve All Chatrooms

Retrieve a list of chatrooms for the authenticated user.

- **Method:** `GET`
- **URL:** `/api/chatrooms`
- **Headers:** `Authorization: Bearer <accessToken>`
- **Parameters:** None
- **Request Body:** None
- **Response:** `200 OK`
- **Example:**
  ```json
  [
    {
      "id": "1",
      "userId": "1",
      "name": "General Chat",
      "basePrompt": "You are a helpful assistant.",
      "profileImageUrl": "https://example.com/ai-1.png",
      "createdAt": "2026-04-05T10:00:00Z"
    }
  ]
  ```

### 1.2 Create Chatroom

Create a new chatroom.

- **Method:** `POST`
- **URL:** `/api/chatrooms`
- **Headers:** `Authorization: Bearer <accessToken>`
- **Parameters:** None
- **Request Body:** `multipart/form-data`
  - `name` (string): The name of the chatroom.
  - `basePrompt` (string): The base prompt for the AI.
  - `profileImage` (file/blob, optional): The profile image file for the AI.
- **Response:** `201 Created`
- **Example:**
  ```json
  {
    "id": "2",
    "userId": "1",
    "name": "Project Discussion",
    "basePrompt": "You are a strict project manager AI.",
    "profileImageUrl": "https://example.com/manager.png",
    "createdAt": "2026-04-05T10:05:00Z"
  }
  ```

### 1.3 Retrieve a Specific Chatroom

Retrieve details of a specific chatroom by ID.

- **Method:** `GET`
- **URL:** `/api/chatrooms/{chatroomId}`
- **Headers:** `Authorization: Bearer <accessToken>`
- **Parameters:**
  - `chatroomId` (path parameter): The ID of the chatroom.
- **Request Body:** None
- **Response:** `200 OK`
- **Example:**
  ```json
  {
    "id": "2",
    "userId": "1",
    "name": "Project Discussion",
    "basePrompt": "You are a strict project manager AI.",
    "profileImageUrl": "https://example.com/manager.png",
    "createdAt": "2026-04-05T10:05:00Z"
  }
  ```

### 1.4 Update Chatroom (AI Customization)

Update a chatroom's configuration such as its base prompt or AI profile image.

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
- **Example:**
  ```json
  {
    "id": "2",
    "userId": "1",
    "name": "Project Discussion",
    "basePrompt": "You are a friendly project manager AI.",
    "profileImageUrl": "https://example.com/friendly-manager.png",
    "updatedAt": "2026-04-05T10:10:00Z"
  }
  ```

### 1.5 Delete Chatroom

Delete an existing chatroom.

- **Method:** `DELETE`
- **URL:** `/api/chatrooms/{chatroomId}`
- **Headers:** `Authorization: Bearer <accessToken>`
- **Parameters:**
  - `chatroomId` (path parameter): The ID of the chatroom.
- **Request Body:** None
- **Response:** `200 OK`
- **Example:** _(Empty Response)_

---

## 2. Cloning & Branching Chatrooms

### 2.1 Clone Chatroom

Create a new chatroom from an existing one, copying ONLY the configuration (prompt, profile image).

- **Method:** `POST`
- **URL:** `/api/chatrooms/{chatroomId}/clone`
- **Headers:** `Authorization: Bearer <accessToken>`
- **Parameters:**
  - `chatroomId` (path parameter): The ID of the source chatroom.
- **Request Body:** None
- **Response:** `201 Created`
- **Example:**
  ```json
  {
    "id": "3",
    "userId": "1",
    "name": "General Chat (Clone)",
    "basePrompt": "You are a helpful assistant.",
    "profileImageUrl": "https://example.com/ai-1.png",
    "createdAt": "2026-04-05T10:15:00Z"
  }
  ```

### 2.2 Branch Chatroom

Create a new chatroom from an existing one, copying BOTH the configuration and the chat history.

- **Method:** `POST`
- **URL:** `/api/chatrooms/{chatroomId}/branch`
- **Headers:** `Authorization: Bearer <accessToken>`
- **Parameters:**
  - `chatroomId` (path parameter): The ID of the source chatroom.
- **Request Body:** None
- **Response:** `201 Created`
- **Example:**
  ```json
  {
    "id": "4",
    "userId": "1",
    "name": "General Chat (Branch)",
    "basePrompt": "You are a helpful assistant.",
    "profileImageUrl": "https://example.com/ai-1.png",
    "createdAt": "2026-04-05T10:20:00Z"
  }
  ```

---

## 3. Messaging

### 3.0 Backend Storage Note (No Contract Change)

- AI-authored messages are persisted with an internal 1:1 metadata record in `ai_message_metadata`.
- This metadata currently includes `read_at`, `delivery_mode` (`reply` or `proactive`), `trigger_reason`, and optional `trigger_context`.
- This is internal persistence only for now: REST and Socket.IO payload schemas in this document remain unchanged.

### 3.1 Retrieve Message History

Retrieve the message history for a specific chatroom.

- **Method:** `GET`
- **URL:** `/api/chatrooms/{chatroomId}/messages`
- **Headers:** `Authorization: Bearer <accessToken>`
- **Parameters:**
  - `chatroomId` (path parameter): The ID of the chatroom.
  - `limit` (query parameter, optional): Number of messages to retrieve.
  - `offset` (query parameter, optional): Offset for pagination.
- **Request Body:** None
- **Response:** `200 OK`
- **Example:**
  ```json
  [
    {
      "id": "101",
      "chatroomId": "2",
      "sender": "user",
      "content": "Hello, AI!",
      "createdAt": "2026-04-05T10:25:00Z"
    },
    {
      "id": "102",
      "chatroomId": "2",
      "sender": "ai",
      "content": "Hello! How can I help you today?",
      "createdAt": "2026-04-05T10:25:05Z"
    }
  ]
  ```

### 3.2 Send Message to AI (HTTP Fallback/Initial Trigger)

Send a message from the user to the AI. _(Note: Responses are streamed via WebSocket, but sending can be initiated via HTTP POST)._

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
- **Response:** `202 Accepted` (Indicates message received, response will stream elsewhere)
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
      "createdAt": "2026-04-05T10:30:00Z"
    }
  }
  ```

---

## 4. Notifications

### 4.1 Register FCM Device Token

Register a user's device for receiving FCM push notifications (for proactive AI messages).

- **Method:** `POST`
- **URL:** `/api/notifications/register`
- **Headers:** `Authorization: Bearer <accessToken>`
- **Parameters:** None
- **Request Body:**
  ```json
  {
    "deviceToken": "dpXm_..._example_token_from_fcm"
  }
  ```
- **Response:** `200 OK`
- **Example:**
  ```json
  {
    "status": "success",
    "message": "FCM token registered successfully."
  }
  ```

---

## 5. WebSocket Events (Socket.IO)

### 5.1 Connection

- **Transport:** Socket.IO
- **Gateway:** backend `MessagesGateway`
- **Auth:** Currently no JWT guard enforced at gateway event level.

### 5.2 Client -> Server Events

#### `joinRoom`

- **Payload:**
  ```json
  { "chatroomId": 2 }
  ```
- **Ack/Event Response:**
  ```json
  { "event": "joined", "data": { "room": 2 } }
  ```

#### `leaveRoom`

- **Payload:**
  ```json
  { "chatroomId": 2 }
  ```
- **Ack/Event Response:**
  ```json
  { "event": "left", "data": { "room": 2 } }
  ```

### 5.3 Server -> Client Events

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
- **Streaming Semantics:** `chunk` is cumulative, not delta.  
  Example sequence: `"a"` -> `"ab"` -> `"abc"` (not `"a"` -> `"b"` -> `"c"`).

#### `ai_message_complete`

- **Payload:**
  ```json
  { "chatroomId": 2, "content": "final message", "messageId": 123 }
  ```
