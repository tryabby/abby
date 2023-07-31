/*
  Warnings:

  - You are about to drop the column `isEnabled` on the `FlagValue` table. All the data in the column will be lost.
  - Added the required column `value` to the `FlagValue` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `FlagValue`
    ADD COLUMN `type` ENUM('BOOLEAN', 'STRING', 'NUMBER', 'JSON') NOT NULL DEFAULT 'BOOLEAN',
    ADD COLUMN `value` LONGTEXT NOT NULL;

UPDATE `FlagValue` SET `value` = IF(`isEnabled`, 'true', 'false') WHERE `type` = 'BOOLEAN';

-- DropColumn
ALTER TABLE `FlagValue`
    DROP COLUMN `isEnabled`;
