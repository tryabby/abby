/*
  Warnings:

  - A unique constraint covering the columns `[projectId,name]` on the table `Test` will be added. If there are existing duplicate values, this will fail.
  - Made the column `projectId` on table `Test` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `Test` MODIFY `projectId` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Test_projectId_name_key` ON `Test`(`projectId`, `name`);
