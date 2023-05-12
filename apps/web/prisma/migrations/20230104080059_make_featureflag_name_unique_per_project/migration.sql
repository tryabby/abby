/*
  Warnings:

  - A unique constraint covering the columns `[projectId,name]` on the table `FeatureFlag` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `FeatureFlag_projectId_name_key` ON `FeatureFlag`(`projectId`, `name`);
