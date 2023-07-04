/*
  Warnings:

  - You are about to drop the column `value` on the `FlagValue` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `FlagValue`
    ADD COLUMN `isEnabled` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `offVariantId` VARCHAR(191) NULL,
    ADD COLUMN `onVariantId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `FeatureFlagVariant` (
    `id` VARCHAR(191) NOT NULL,
    `environmentFlagId` VARCHAR(191) NOT NULL,
    `value` LONGTEXT NOT NULL,
    `name` VARCHAR(191) NULL,
    `description` TEXT NULL,

    UNIQUE INDEX `FeatureFlagVariant_id_key`(`id`),
    INDEX `FeatureFlagVariant_environmentFlagId_idx`(`environmentFlagId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- get all flag values and set isEnabled to to true if value is set
UPDATE `FlagValue` SET `isEnabled` = true WHERE `value` IS NOT NULL;

-- create two FeatureFlagVariants with the value true and false for each flag value which value is true
INSERT INTO `FeatureFlagVariant` (`id`, `environmentFlagId`, `value`)
SELECT UUID(), `id`, true FROM `FlagValue` WHERE `isEnabled` = true;
INSERT INTO `FeatureFlagVariant` (`id`, `environmentFlagId`, `value`)
SELECT UUID(), `id`, false FROM `FlagValue` WHERE `isEnabled` = true;

