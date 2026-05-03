-- CreateTable
CREATE TABLE `memories` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `chatroom_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL,
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

-- AddForeignKey
ALTER TABLE `memories` ADD CONSTRAINT `memories_chatroom_id_fkey` FOREIGN KEY (`chatroom_id`) REFERENCES `chatrooms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
