-- CreateTable
CREATE TABLE `chatroom_facts` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `chatroom_id` BIGINT NOT NULL,
    `key` VARCHAR(128) NOT NULL,
    `value` JSON NOT NULL,
    `value_type` VARCHAR(32) NOT NULL,
    `confidence` DOUBLE NOT NULL,
    `source_message_id` BIGINT NULL,
    `extracted_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `chatroom_facts_chatroom_id_key_key`(`chatroom_id`, `key`),
    INDEX `chatroom_facts_chatroom_id_idx`(`chatroom_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `chatroom_facts` ADD CONSTRAINT `chatroom_facts_chatroom_id_fkey` FOREIGN KEY (`chatroom_id`) REFERENCES `chatrooms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chatroom_facts` ADD CONSTRAINT `chatroom_facts_source_message_id_fkey` FOREIGN KEY (`source_message_id`) REFERENCES `messages`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
