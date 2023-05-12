DROP INDEX `FeatureFlagHistory_featureFlagId_idx` ON `FeatureFlagHistory`;

-- AlterTable
ALTER TABLE `FeatureFlagHistory` DROP COLUMN `featureFlagId`,
    ADD COLUMN `environmentId` VARCHAR(191) NULL,
    ADD COLUMN `flagId` VARCHAR(191) NULL;

-- DropIndex

CREATE TABLE `FlagValue` (
    `id` VARCHAR(191) NOT NULL DEFAULT (uuid()),
    `flagId` VARCHAR(191) NOT NULL,
    `environmentId` VARCHAR(191) NOT NULL,
    `isEnabled` BOOLEAN NOT NULL DEFAULT false,
  	`name` VARCHAR(191),

    INDEX `FlagValue_flagId_idx`(`flagId`),
    INDEX `FlagValue_environmentId_idx`(`environmentId`),
    UNIQUE INDEX `FlagValue_flagId_environmentId_key`(`flagId`, `environmentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


CREATE TABLE `_tempFlag` (
  `id` VARCHAR(191) NOT NULL DEFAULT (uuid()),
  `name` VARCHAR(191),
  `projectId` VARCHAR(191),
  `environmentId` VARCHAR(191),
  `description` TEXT,
  `createdAt` DATETIME(3),
	`updatedAt` DATETIME(3),

	UNIQUE INDEX `_tempFlag_key`(`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO _tempFlag (name, projectId, environmentId, description, createdAt, updatedAt) SELECT name, projectId, MAX(environmentId), MAX(description), MAX(createdAt), MAX(updatedAt) FROM FeatureFlag GROUP BY name, projectId;

INSERT INTO FlagValue (id, flagId, environmentId, isEnabled) SELECT uuid() as id, _tempFlag.id, FeatureFlag.environmentId, enabled FROM FeatureFlag INNER JOIN _tempFlag ON _tempFlag.name = FeatureFlag.name;

DELETE FROM FeatureFlagHistory;

DELETE FROM FeatureFlag;

INSERT INTO FeatureFlag (id, name, projectId, environmentId, description, createdAt, updatedAt) SELECT id, name, projectId, environmentId, description, createdAt, updatedAt FROM _tempFlag;

-- DropIndex
DROP INDEX `FeatureFlag_projectId_name_environmentId_key` ON `FeatureFlag`;

-- AlterTable
ALTER TABLE `FeatureFlag` DROP COLUMN `enabled`;

-- CreateIndex
CREATE UNIQUE INDEX `FeatureFlag_projectId_name_key` ON `FeatureFlag`(`projectId`, `name`);

-- CreateIndex
CREATE INDEX `FeatureFlagHistory_flagId_environmentId_idx` ON `FeatureFlagHistory`(`flagId`, `environmentId`);

DROP TABLE _tempFlag;