-- AlterTable: allow FCM tokens for guest sessions (XOR user_id / guest_session_id enforced in app)
ALTER TABLE `user_devices` DROP FOREIGN KEY `user_devices_user_id_fkey`;

ALTER TABLE `user_devices` MODIFY `user_id` BIGINT NULL;

ALTER TABLE `user_devices` ADD COLUMN `guest_session_id` CHAR(36) NULL;

CREATE INDEX `user_devices_guest_session_id_idx` ON `user_devices`(`guest_session_id`);

ALTER TABLE `user_devices` ADD CONSTRAINT `user_devices_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `user_devices` ADD CONSTRAINT `user_devices_guest_session_id_fkey` FOREIGN KEY (`guest_session_id`) REFERENCES `guest_sessions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
