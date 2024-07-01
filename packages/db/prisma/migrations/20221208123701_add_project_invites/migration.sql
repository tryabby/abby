-- CreateTable
CREATE TABLE `ProjectInvite` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `usedAt` DATETIME(3) NULL,

    INDEX `ProjectInvite_projectId_idx`(`projectId`),
    INDEX `ProjectInvite_userId_idx`(`userId`),
    UNIQUE INDEX `ProjectInvite_projectId_email_key`(`projectId`, `email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
