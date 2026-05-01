-- CreateTable
CREATE TABLE `memory_extraction_runs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `chatroom_id` BIGINT NOT NULL,
    `source_message_id` BIGINT NOT NULL,
    `source_sender` ENUM('user', 'ai') NOT NULL,
    `extractor_model` VARCHAR(255) NOT NULL,
    `raw_output` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `memory_extraction_runs_chatroom_id_created_at_idx`(`chatroom_id`, `created_at`),
    INDEX `memory_extraction_runs_source_message_id_idx`(`source_message_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `semantic_memory_records` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `chatroom_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL,
    `source_message_id` BIGINT NOT NULL,
    `extraction_run_id` BIGINT NOT NULL,
    `vector_point_id` VARCHAR(191) NOT NULL,
    `fact_key` VARCHAR(191) NULL,
    `content` TEXT NOT NULL,
    `confidence` DOUBLE NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `semantic_memory_records_chatroom_id_vector_point_id_key`(`chatroom_id`, `vector_point_id`),
    INDEX `semantic_memory_records_chatroom_id_created_at_idx`(`chatroom_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `episodic_memory_records` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `chatroom_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL,
    `source_message_id` BIGINT NOT NULL,
    `extraction_run_id` BIGINT NOT NULL,
    `vector_point_id` VARCHAR(191) NOT NULL,
    `event_type` VARCHAR(191) NOT NULL,
    `happened_at` DATETIME(3) NOT NULL,
    `content` TEXT NOT NULL,
    `confidence` DOUBLE NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `episodic_memory_records_chatroom_id_vector_point_id_key`(`chatroom_id`, `vector_point_id`),
    INDEX `episodic_memory_records_chatroom_id_happened_at_idx`(`chatroom_id`, `happened_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `core_state_memories` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `chatroom_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL,
    `state_key` VARCHAR(191) NOT NULL,
    `value` LONGTEXT NOT NULL,
    `value_type` ENUM('text', 'json', 'number', 'boolean') NOT NULL DEFAULT 'text',
    `source_message_id` BIGINT NULL,
    `expires_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `core_state_memories_chatroom_id_state_key_key`(`chatroom_id`, `state_key`),
    INDEX `core_state_memories_chatroom_id_expires_at_idx`(`chatroom_id`, `expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `core_state_mutations` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `core_state_id` BIGINT NULL,
    `extraction_run_id` BIGINT NULL,
    `chatroom_id` BIGINT NOT NULL,
    `source_message_id` BIGINT NOT NULL,
    `operation` ENUM('upsert', 'delete', 'expire') NOT NULL,
    `previous_value` LONGTEXT NULL,
    `next_value` LONGTEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `core_state_mutations_chatroom_id_created_at_idx`(`chatroom_id`, `created_at`),
    INDEX `core_state_mutations_source_message_id_idx`(`source_message_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `memory_selection_logs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `chatroom_id` BIGINT NOT NULL,
    `query` TEXT NOT NULL,
    `selected_ids` JSON NOT NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `memory_selection_logs_chatroom_id_created_at_idx`(`chatroom_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `memory_extraction_runs` ADD CONSTRAINT `memory_extraction_runs_chatroom_id_fkey` FOREIGN KEY (`chatroom_id`) REFERENCES `chatrooms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `memory_extraction_runs` ADD CONSTRAINT `memory_extraction_runs_source_message_id_fkey` FOREIGN KEY (`source_message_id`) REFERENCES `messages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `semantic_memory_records` ADD CONSTRAINT `semantic_memory_records_chatroom_id_fkey` FOREIGN KEY (`chatroom_id`) REFERENCES `chatrooms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `semantic_memory_records` ADD CONSTRAINT `semantic_memory_records_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `semantic_memory_records` ADD CONSTRAINT `semantic_memory_records_source_message_id_fkey` FOREIGN KEY (`source_message_id`) REFERENCES `messages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `semantic_memory_records` ADD CONSTRAINT `semantic_memory_records_extraction_run_id_fkey` FOREIGN KEY (`extraction_run_id`) REFERENCES `memory_extraction_runs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `episodic_memory_records` ADD CONSTRAINT `episodic_memory_records_chatroom_id_fkey` FOREIGN KEY (`chatroom_id`) REFERENCES `chatrooms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `episodic_memory_records` ADD CONSTRAINT `episodic_memory_records_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `episodic_memory_records` ADD CONSTRAINT `episodic_memory_records_source_message_id_fkey` FOREIGN KEY (`source_message_id`) REFERENCES `messages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `episodic_memory_records` ADD CONSTRAINT `episodic_memory_records_extraction_run_id_fkey` FOREIGN KEY (`extraction_run_id`) REFERENCES `memory_extraction_runs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `core_state_memories` ADD CONSTRAINT `core_state_memories_chatroom_id_fkey` FOREIGN KEY (`chatroom_id`) REFERENCES `chatrooms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `core_state_memories` ADD CONSTRAINT `core_state_memories_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `core_state_memories` ADD CONSTRAINT `core_state_memories_source_message_id_fkey` FOREIGN KEY (`source_message_id`) REFERENCES `messages`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `core_state_mutations` ADD CONSTRAINT `core_state_mutations_core_state_id_fkey` FOREIGN KEY (`core_state_id`) REFERENCES `core_state_memories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `core_state_mutations` ADD CONSTRAINT `core_state_mutations_extraction_run_id_fkey` FOREIGN KEY (`extraction_run_id`) REFERENCES `memory_extraction_runs`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `core_state_mutations` ADD CONSTRAINT `core_state_mutations_chatroom_id_fkey` FOREIGN KEY (`chatroom_id`) REFERENCES `chatrooms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `core_state_mutations` ADD CONSTRAINT `core_state_mutations_source_message_id_fkey` FOREIGN KEY (`source_message_id`) REFERENCES `messages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `memory_selection_logs` ADD CONSTRAINT `memory_selection_logs_chatroom_id_fkey` FOREIGN KEY (`chatroom_id`) REFERENCES `chatrooms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
