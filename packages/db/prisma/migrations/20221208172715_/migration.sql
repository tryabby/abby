/*
  Warnings:

  - You are about to drop the column `userId` on the `Project` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `Project_userId_idx` ON `Project`;

-- AlterTable
ALTER TABLE `Project` DROP COLUMN `userId`;
