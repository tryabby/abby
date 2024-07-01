/*
  Warnings:

  - You are about to drop the column `isRevoked` on the `ApiKey` table. All the data in the column will be lost.
  - You are about to drop the column `validDays` on the `ApiKey` table. All the data in the column will be lost.
  - Added the required column `validUntil` to the `ApiKey` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `ApiKey` DROP COLUMN `isRevoked`,
    DROP COLUMN `validDays`,
    ADD COLUMN `revokedAt` DATETIME(3) NULL,
    ADD COLUMN `validUntil` DATETIME(3) NOT NULL;
