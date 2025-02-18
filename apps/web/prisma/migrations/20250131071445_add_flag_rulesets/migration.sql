-- CreateTable
CREATE TABLE `UserSegment` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `schema` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `UserSegment_projectId_idx`(`projectId`),
    UNIQUE INDEX `UserSegment_projectId_name_key`(`projectId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FlagRuleSet` (
    `id` VARCHAR(191) NOT NULL,
    `flagValueId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `rules` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `FlagRuleSet_flagValueId_idx`(`flagValueId`),
    UNIQUE INDEX `FlagRuleSet_flagValueId_name_key`(`flagValueId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
