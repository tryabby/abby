/*
  Warnings:

  - A unique constraint covering the columns `[projectId,name,environmentId]` on the table `FeatureFlag` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `FeatureFlag_projectId_name_key` ON `FeatureFlag`;

-- CreateIndex
CREATE UNIQUE INDEX `FeatureFlag_projectId_name_environmentId_key` ON `FeatureFlag`(`projectId`, `name`, `environmentId`);
