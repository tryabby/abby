/*
  Warnings:

  - You are about to alter the column `role` on the `ProjectUser` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Enum(EnumId(0))`.

*/
-- AlterTable
ALTER TABLE `ProjectUser` MODIFY `role` ENUM('ADMIN', 'USER') NOT NULL DEFAULT 'USER';
