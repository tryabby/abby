/*
  Warnings:

  - You are about to drop the column `environmentId` on the `FeatureFlag` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `FeatureFlag_environmentId_idx` ON `FeatureFlag`;

-- AlterTable
ALTER TABLE `FeatureFlag` DROP COLUMN `environmentId`;
