/*
  Warnings:

  - You are about to drop the column `type` on the `FlagValue` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `FeatureFlag` ADD COLUMN `type` ENUM('BOOLEAN', 'STRING', 'NUMBER') NOT NULL DEFAULT 'BOOLEAN';

-- AlterTable
ALTER TABLE `FlagValue` DROP COLUMN `type`;
