/*
  Warnings:

  - You are about to alter the column `oldValue` on the `FeatureFlagHistory` table. The data in that column could be lost. The data in that column will be cast from `LongText` to `TinyInt`.
  - You are about to alter the column `newValue` on the `FeatureFlagHistory` table. The data in that column could be lost. The data in that column will be cast from `LongText` to `TinyInt`.
  - You are about to drop the column `value` on the `FlagValue` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `FeatureFlagHistory` MODIFY `oldValue` BOOLEAN NULL DEFAULT false,
    MODIFY `newValue` BOOLEAN NULL DEFAULT false;

-- AlterTable
ALTER TABLE `FlagValue` DROP COLUMN `value`;
