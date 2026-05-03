# Database Schema: Chatty

**Source of truth:** [`backend/prisma/schema.prisma`](../backend/prisma/schema.prisma) and SQL migrations under [`backend/prisma/migrations/`](../backend/prisma/migrations/).

This document summarizes the MySQL layout for agents and readers. Prisma maps JavaScript `Date`/`BigInt` to MySQL `DATETIME(3)` and `BIGINT` as generated in migrations. API serialization details live in [`API_DOCUMENTATION.md`](API_DOCUMENTATION.md).

## 1. Entity-Relationship Diagram

```mermaid
erDiagram
    users ||--o{ user_devices : "has"
    users ||--o{ chatrooms : "owns"
    chatrooms ||--o{ messages : "contains"
    messages ||--o| ai_message_metadata : "optional metadata"

    users {
        bigint id PK
        varchar username UK
        datetime created_at
        datetime updated_at
    }

    user_devices {
        bigint id PK
        bigint user_id FK
        varchar device_token UK
        datetime registered_at
    }

    chatrooms {
        bigint id PK
        bigint user_id FK
        varchar name
        text base_prompt
        varchar profile_image_url
        int current_delay_seconds
        datetime next_evaluation_time
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

The snippets below mirror the checked-in migrations (`20260408000000_init`, `20260408120000_widen_user_device_token`, `20260424000100_add_ai_message_metadata`). Prefer running Prisma migrations or inspecting [`backend/prisma/schema.prisma`](../backend/prisma/schema.prisma) for greenfield setups.

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
    `user_id` BIGINT NOT NULL,
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
-- chatrooms.user_id -> users.id ON DELETE CASCADE
-- messages.chatroom_id -> chatrooms.id ON DELETE CASCADE
-- ai_message_metadata.message_id -> messages.id ON DELETE CASCADE
```

---

## 3. Implementation notes

- **Primary keys:** Auto-increment `BIGINT`, matching Prisma `BigInt` and JSON string serialization for IDs in API responses.
- **Proactive scheduling:** `chatrooms.current_delay_seconds` defaults to **60** in the database; application flow resets toward **4 seconds** after user activity and applies doubling on evaluator "no send" (see [`PROJECT_PROPOSAL.md`](PROJECT_PROPOSAL.md), `backend/src/tasks/`, and `backend/src/messages/chatroom-state.repository.ts`).
- **AI metadata invariant:** `ai_message_metadata` rows should exist only for `messages.sender = 'ai'`; Prisma models this as an optional 1:1 from `Message` to `AiMessageMetadata`.
- **Known AI metadata values:** application code currently writes `delivery_mode = 'reply'` with `trigger_reason = 'user_request'` for HTTP-triggered replies, and `delivery_mode = 'proactive'` with `trigger_reason = 'scheduler_evaluation_yes'` plus `trigger_context = {"source":"scheduler"}` for scheduled sends.
- **Branching:** branch creation copies message rows into a new chatroom, preserving `sender`, `content`, and `created_at`; AI metadata is not copied in the current implementation.
- **Profile images:** `profile_image_url` stores the public URL after upload handling in the backend (see storage/infrastructure modules).
