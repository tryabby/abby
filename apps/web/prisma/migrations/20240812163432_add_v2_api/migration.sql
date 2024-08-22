-- AlterTable
ALTER TABLE `ApiRequest` MODIFY `apiVersion` ENUM('V0', 'V1', 'V2') NOT NULL DEFAULT 'V0';
