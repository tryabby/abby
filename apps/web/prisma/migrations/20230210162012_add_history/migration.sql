-- CreateTable
CREATE TABLE `FeatureFlagHistory` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `oldValue` BOOLEAN NULL,
    `newValue` BOOLEAN NULL,
    `featureFlagId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,

    INDEX `FeatureFlagHistory_featureFlagId_idx`(`featureFlagId`),
    INDEX `FeatureFlagHistory_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
