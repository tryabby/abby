-- CreateTable
CREATE TABLE `Integration` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `type` ENUM('GITHUB') NOT NULL,
    `settings` JSON NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,

    INDEX `Integration_projectId_idx`(`projectId`),
    UNIQUE INDEX `Integration_projectId_type_key`(`projectId`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
