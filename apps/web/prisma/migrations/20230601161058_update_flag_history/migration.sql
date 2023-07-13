/*
  Warnings:

  - You are about to alter the column `oldValue` on the `FeatureFlagHistory` table. The data in that column could be lost. The data in that column will be cast from `TinyInt` to `LongText`.
  - You are about to alter the column `newValue` on the `FeatureFlagHistory` table. The data in that column could be lost. The data in that column will be cast from `TinyInt` to `LongText`.

*/
-- AlterTable
ALTER TABLE `FeatureFlagHistory` MODIFY `oldValue` LONGTEXT NULL,
    MODIFY `newValue` LONGTEXT NULL;
