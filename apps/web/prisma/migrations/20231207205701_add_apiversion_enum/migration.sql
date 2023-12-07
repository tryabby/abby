/*
  Warnings:

  - You are about to alter the column `apiVersion` on the `ApiRequest` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(3))`.

*/
-- AlterTable
ALTER TABLE `ApiRequest` MODIFY `apiVersion` ENUM('V0', 'V1') NOT NULL DEFAULT 'V0';
