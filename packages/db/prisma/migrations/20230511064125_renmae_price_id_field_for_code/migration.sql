/*
  Warnings:

  - You are about to drop the column `planId` on the `CouponCodes` table. All the data in the column will be lost.
  - Added the required column `stripePriceId` to the `CouponCodes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `CouponCodes` DROP COLUMN `planId`,
    ADD COLUMN `stripePriceId` VARCHAR(191) NOT NULL;
