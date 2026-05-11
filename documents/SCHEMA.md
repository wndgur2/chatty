# Database Schema: Chatty

**Source of truth:** [`backend/prisma/schema.prisma`](../backend/prisma/schema.prisma) and SQL migrations under [`backend/prisma/migrations/`](../backend/prisma/migrations/).

This document summarizes the MySQL layout for agents and readers. Prisma maps JavaScript `Date`/`BigInt` to MySQL `DATETIME(3)` and `BIGINT` as generated in migrations.

## 1. Entity-Relationship Diagram

```mermaid
erDiagram
    users ||--o{ user_devices : "has"
    users ||--o{ chatrooms : "owns (member)"
    guest_sessions ||--o{ chatrooms : "owns (guest)"
    users ||--o{ guest_sessions : "absorbs on merge"
    chatrooms ||--o{ messages : "contains"
    chatrooms ||--o{ memories : "has"
    guest_sessions ||--o{ memories : "owns (guest)"
    messages ||--o| ai_message_metadata : "optional metadata"

    users {
        bigint id PK
        varchar username UK
        datetime created_at
        datetime updated_at
    }

    guest_sessions {
        char(36) id PK
        datetime created_at
        datetime merged_at
        bigint merged_into_user_id FK
    }

    user_devices {
        bigint id PK
        bigint user_id FK
        varchar device_token UK
        datetime registered_at
    }

    chatrooms {
        bigint id PK
        bigint user_id FK "nullable; XOR with guest_session_id"
        char(36) guest_session_id FK "nullable; XOR with user_id"
        varchar name
        text base_prompt
        varchar profile_image_url
        int current_delay_seconds
        datetime next_evaluation_time
        datetime created_at
        datetime updated_at
    }

    memories {
        bigint id PK
        bigint chatroom_id FK
        bigint user_id "nullable; XOR with guest_session_id"
        char(36) guest_session_id FK "nullable; XOR with user_id"
        enum kind "'fact', 'preference', 'task', 'project_state', 'relationship', 'other'"
        varchar key
        text value
        double confidence
        bigint source_message_id
        datetime superseded_at
        datetime created_at
        datetime updated_at
    }

    messages {
        bigint id PK
        bigint chatroom_id FK
        enum sender "'user', 'ai'"
        longtext content
        datetime created_at
    }

    ai_message_metadata {
        bigint message_id PK FK
        datetime read_at
        enum delivery_mode "'reply', 'proactive'"
        varchar trigger_reason
        json trigger_context
        datetime created_at
        datetime updated_at
    }
```

---

## 2. MySQL DDL (aligned with Prisma migrations)

The snippets below mirror the checked-in migrations (`20260408000000_init`, `20260408120000_widen_user_device_token`, `20260424000100_add_ai_message_metadata`, `20260503000000_add_memories`, `20260504120000_guest_sessions`). Prefer re-running migrations or introspecting Prisma for greenfield setups.

```sql
-- -----------------------------------------------------
-- Table `users`
-- -----------------------------------------------------
CREATE TABLE `users` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `guest_sessions` (anonymous principals, optionally merged into a user)
-- -----------------------------------------------------
CREATE TABLE `guest_sessions` (
    `id` CHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `merged_at` DATETIME(3) NULL,
    `merged_into_user_id` BIGINT NULL,

    INDEX `guest_sessions_merged_into_user_id_idx`(`merged_into_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `user_devices` (FCM device tokens)
-- -----------------------------------------------------
CREATE TABLE `user_devices` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `device_token` VARCHAR(512) NOT NULL,
    `registered_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `user_devices_device_token_key`(`device_token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `chatrooms`
-- -----------------------------------------------------
CREATE TABLE `chatrooms` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NULL,
    `guest_session_id` CHAR(36) NULL,
    `name` VARCHAR(255) NOT NULL,
    `base_prompt` TEXT NULL,
    `profile_image_url` VARCHAR(255) NULL,
    `current_delay_seconds` INTEGER NOT NULL DEFAULT 60,
    `next_evaluation_time` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `memories` (per-chatroom durable facts/preferences, etc.)
-- -----------------------------------------------------
CREATE TABLE `memories` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `chatroom_id` BIGINT NOT NULL,
    `user_id` BIGINT NULL,
    `guest_session_id` CHAR(36) NULL,
    `kind` ENUM('fact', 'preference', 'task', 'project_state', 'relationship', 'other') NOT NULL,
    `key` VARCHAR(255) NOT NULL,
    `value` TEXT NOT NULL,
    `confidence` DOUBLE NOT NULL DEFAULT 0.8,
    `source_message_id` BIGINT NULL,
    `superseded_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `memories_chatroom_id_user_id_idx`(`chatroom_id`, `user_id`),
    INDEX `memories_source_message_id_idx`(`source_message_id`),
    UNIQUE INDEX `memories_chatroom_id_kind_key_key`(`chatroom_id`, `kind`, `key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `messages`
-- -----------------------------------------------------
CREATE TABLE `messages` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `chatroom_id` BIGINT NOT NULL,
    `sender` ENUM('user', 'ai') NOT NULL,
    `content` LONGTEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `ai_message_metadata`
-- 1:1 with AI-authored messages only (enforced in application logic).
-- -----------------------------------------------------
CREATE TABLE `ai_message_metadata` (
    `message_id` BIGINT NOT NULL,
    `read_at` DATETIME(3) NULL,
    `delivery_mode` ENUM('reply', 'proactive') NOT NULL,
    `trigger_reason` VARCHAR(255) NOT NULL,
    `trigger_context` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`message_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Foreign keys (see migration files for exact constraint names)
-- user_devices.user_id -> users.id ON DELETE CASCADE
-- chatrooms.user_id -> users.id ON DELETE CASCADE (nullable column)
-- chatrooms.guest_session_id -> guest_sessions.id ON DELETE RESTRICT (nullable column)
-- messages.chatroom_id -> chatrooms.id ON DELETE CASCADE
-- memories.chatroom_id -> chatrooms.id ON DELETE CASCADE
-- memories.guest_session_id -> guest_sessions.id ON DELETE RESTRICT (nullable column)
-- ai_message_metadata.message_id -> messages.id ON DELETE CASCADE
-- guest_sessions.merged_into_user_id -> users.id ON DELETE SET NULL
```

---

## 3. Implementation notes

- **Primary keys:** Auto-increment `BIGINT`, matching Prisma `BigInt` and JSON string serialization for IDs in API responses.
- **Ownership XOR (chatrooms, memories):** Exactly one of `user_id` / `guest_session_id` is populated per row; the other is `NULL`. The invariant is enforced in application code (`OwnerScope` + `ownerScopeFromPrincipal`), not via a MySQL `CHECK` (rejected as MySQL error 3823 because both columns participate in FK referential actions—see the migration comment).
- **Guest sessions:** `guest_sessions.id` is a server-issued `CHAR(36)` UUID. A guest session is **single-use**: once `merged_at` is set, the JWT strategy rejects further guest authentication for that `id` and `merged_into_user_id` records the target member.
- **Guest-to-member merge:** `mergeGuestIntoUser` reassigns `chatrooms` and `memories` from `guest_session_id` to the merging `user_id` inside a single transaction, then stamps `merged_at`/`merged_into_user_id` on the guest session.
- **Proactive scheduling:** `chatrooms.current_delay_seconds` defaults to **60** in the database; application flow resets toward **4 seconds** after user activity and applies doubling on evaluator “no send” (see `documents/PROJECT_PROPOSAL.md` and `backend/src/tasks/`).
- **AI metadata invariant:** `ai_message_metadata` rows should exist only for `messages.sender = 'ai'`; Prisma models this as an optional 1:1 from `Message` to `AiMessageMetadata`.
- **Memories:** One row per `(chatroom_id, kind, key)` (unique constraint). `MemoryKind` in Prisma maps to the MySQL `kind` enum. `confidence` defaults to **0.8**. `source_message_id` is optional and indexed but has **no** Prisma relation to `messages` (application-level linkage only). `user_id` is indexed with `chatroom_id` but has **no** foreign key to `users`—use it for ownership scoping in app logic. `guest_session_id` **does** have an FK to `guest_sessions` so guest data can be tracked through the merge flow. `superseded_at` marks soft-invalidated rows without deleting history.
- **Profile images:** `profile_image_url` stores the public URL after upload handling in the backend (see storage/infrastructure modules).
