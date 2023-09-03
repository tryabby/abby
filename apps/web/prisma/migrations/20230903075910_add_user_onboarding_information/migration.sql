-- AlterTable
ALTER TABLE `User` ADD COLUMN `experienceLevelFlags` INTEGER NULL,
    ADD COLUMN `experienceLevelTests` INTEGER NULL,
    ADD COLUMN `hasCompletedOnboarding` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `profession` VARCHAR(191) NULL,
    ADD COLUMN `technologies` JSON NULL;


UPDATE `User` SET `hasCompletedOnboarding` = true;