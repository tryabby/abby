/*
  Warnings:

  - You are about to drop the column `hashedIp` on the `ApiRequest` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `ApiRequest` DROP COLUMN `hashedIp`;
