/*
  Warnings:

  - You are about to drop the column `stripeCurrentPeriodEnd` on the `Project` table. All the data in the column will be lost.

*/
-- AlterTable
SET SQL_MODE='ALLOW_INVALID_DATES';

ALTER TABLE `Project` ADD COLUMN `currentPeriodEnd` DATETIME(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3) + INTERVAL 30 DAY);

UPDATE `Project` SET `currentPeriodEnd` = `stripeCurrentPeriodEnd` WHERE `stripeCurrentPeriodEnd` IS NOT NULL;
UPDATE `Project` SET `currentPeriodEnd` = (CURRENT_TIMESTAMP(3) + INTERVAL 30 DAY) WHERE `stripeCurrentPeriodEnd` IS NULL;

ALTER TABLE `Project` DROP COLUMN `stripeCurrentPeriodEnd`;
