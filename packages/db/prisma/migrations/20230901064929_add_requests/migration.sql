-- CreateTable
CREATE TABLE `ApiRequest` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `type` ENUM('GET_CONFIG', 'TRACK_VIEW') NOT NULL,
    `hashedIp` VARCHAR(191) NOT NULL,
    `durationInMs` INTEGER NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,

    INDEX `ApiRequest_projectId_idx`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
