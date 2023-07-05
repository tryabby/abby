/*
  Warnings:

  - The values [JSON] on the enum `FlagValue_type` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `FlagValue` MODIFY `type` ENUM('BOOLEAN', 'STRING', 'NUMBER') NOT NULL DEFAULT 'BOOLEAN';
