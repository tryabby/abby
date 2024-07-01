/*
  Warnings:

  - You are about to drop the column `environmentId` on the `FeatureFlagHistory` table. All the data in the column will be lost.
  - You are about to drop the column `flagId` on the `FeatureFlagHistory` table. All the data in the column will be lost.
  - Added the required column `flagValueId` to the `FeatureFlagHistory` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `FeatureFlagHistory_flagId_environmentId_idx` ON `FeatureFlagHistory`;

-- AlterTable
ALTER TABLE `FeatureFlagHistory` DROP COLUMN `environmentId`,
    DROP COLUMN `flagId`,
    ADD COLUMN `flagValueId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `FlagValue` ALTER COLUMN `id` DROP DEFAULT;

-- CreateIndex
CREATE INDEX `FeatureFlagHistory_flagValueId_idx` ON `FeatureFlagHistory`(`flagValueId`);
