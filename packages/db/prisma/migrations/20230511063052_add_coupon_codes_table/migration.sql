-- CreateTable
CREATE TABLE `CouponCodes` (
    `id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `code` VARCHAR(191) NOT NULL,
    `planId` VARCHAR(191) NOT NULL,
    `redeemedAt` DATETIME(3) NULL,
    `redeemedById` VARCHAR(191) NULL,

    UNIQUE INDEX `CouponCodes_code_key`(`code`),
    INDEX `CouponCodes_redeemedById_idx`(`redeemedById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
