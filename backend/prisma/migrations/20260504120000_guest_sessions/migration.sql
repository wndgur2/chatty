-- CreateTable
CREATE TABLE `guest_sessions` (
    `id` CHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `merged_at` DATETIME(3) NULL,
    `merged_into_user_id` BIGINT NULL,

    INDEX `guest_sessions_merged_into_user_id_idx`(`merged_into_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `guest_sessions` ADD CONSTRAINT `guest_sessions_merged_into_user_id_fkey` FOREIGN KEY (`merged_into_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE `chatrooms` ADD COLUMN `guest_session_id` CHAR(36) NULL;

-- AlterTable
ALTER TABLE `chatrooms` DROP FOREIGN KEY `chatrooms_user_id_fkey`;

-- AlterTable
ALTER TABLE `chatrooms` MODIFY `user_id` BIGINT NULL;

-- AddForeignKey
ALTER TABLE `chatrooms` ADD CONSTRAINT `chatrooms_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chatrooms` ADD CONSTRAINT `chatrooms_guest_session_id_fkey` FOREIGN KEY (`guest_session_id`) REFERENCES `guest_sessions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE `memories` ADD COLUMN `guest_session_id` CHAR(36) NULL;

-- AlterTable
ALTER TABLE `memories` MODIFY `user_id` BIGINT NULL;

-- AddForeignKey
ALTER TABLE `memories` ADD CONSTRAINT `memories_guest_session_id_fkey` FOREIGN KEY (`guest_session_id`) REFERENCES `guest_sessions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- XOR (user vs guest_session) is enforced in application code. MySQL rejects CHECK on
-- columns that participate in FK referential actions (error 3823) for these FKs.
