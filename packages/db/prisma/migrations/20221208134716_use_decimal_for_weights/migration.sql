/*
  Warnings:

  - You are about to alter the column `chance` on the `Option` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Decimal(65,30)`.

*/
-- AlterTable
ALTER TABLE `Option` MODIFY `chance` DECIMAL(65, 30) NOT NULL;
