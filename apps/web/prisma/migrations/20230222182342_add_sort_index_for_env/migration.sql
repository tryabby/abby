/*
  Warnings:

  - A unique constraint covering the columns `[projectId,sortIndex]` on the table `Environment` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `Environment` ADD COLUMN `sortIndex` INTEGER NOT NULL DEFAULT 0;