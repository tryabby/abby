-- AlterTable
ALTER TABLE `Event` ADD COLUMN `testGoalId` VARCHAR(191) NULL,
    ADD COLUMN `testVersion` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `Test` ADD COLUMN `version` INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE `TestGoal` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `testId` VARCHAR(191) NOT NULL,

    INDEX `TestGoal_testId_idx`(`testId`),
    UNIQUE INDEX `TestGoal_testId_name_key`(`testId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Event_testGoalId_idx` ON `Event`(`testGoalId`);
