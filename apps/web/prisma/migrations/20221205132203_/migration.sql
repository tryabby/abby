/*
  Warnings:

  - You are about to drop the `ProjectMemeber` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `userId` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Project` ADD COLUMN `userId` VARCHAR(191) NOT NULL;

-- DropTable
DROP TABLE `ProjectMemeber`;
