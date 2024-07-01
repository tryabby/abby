/*
  Warnings:

  - A unique constraint covering the columns `[stripeCustomerId]` on the table `Project` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripeSubscriptionId]` on the table `Project` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `Project` ADD COLUMN `stripeCurrentPeriodEnd` DATETIME(3) NULL,
    ADD COLUMN `stripeCustomerId` VARCHAR(191) NULL,
    ADD COLUMN `stripePriceId` VARCHAR(191) NULL,
    ADD COLUMN `stripeSubscriptionId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Project_stripeCustomerId_key` ON `Project`(`stripeCustomerId`);

-- CreateIndex
CREATE UNIQUE INDEX `Project_stripeSubscriptionId_key` ON `Project`(`stripeSubscriptionId`);
