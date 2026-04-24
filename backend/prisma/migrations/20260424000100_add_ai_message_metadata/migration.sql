-- CreateTable
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

-- AddForeignKey
ALTER TABLE `ai_message_metadata` ADD CONSTRAINT `ai_message_metadata_message_id_fkey` FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
