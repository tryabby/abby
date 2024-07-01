-- CreateTable
CREATE TABLE `ProjectUser` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `role` INTEGER NOT NULL DEFAULT 0,

    INDEX `ProjectUser_userId_idx`(`userId`),
    INDEX `ProjectUser_projectId_idx`(`projectId`),
    UNIQUE INDEX `ProjectUser_userId_projectId_key`(`userId`, `projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
