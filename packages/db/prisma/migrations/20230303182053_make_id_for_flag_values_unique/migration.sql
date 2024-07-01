/*
  Warnings:

  - A unique constraint covering the columns `[id]` on the table `FlagValue` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `FlagValue_flagId_environmentId_key` ON `FlagValue`;

-- CreateIndex
CREATE UNIQUE INDEX `FlagValue_id_key` ON `FlagValue`(`id`);
