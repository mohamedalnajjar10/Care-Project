/*
  Warnings:

  - You are about to alter the column `workingHours` on the `doctorprofile` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(100)`.
  - Made the column `experience` on table `doctorprofile` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `doctorprofile` DROP FOREIGN KEY `DoctorProfile_userId_fkey`;

-- DropForeignKey
ALTER TABLE `favoritedoctor` DROP FOREIGN KEY `FavoriteDoctor_doctorProfileId_fkey`;

-- DropForeignKey
ALTER TABLE `favoritedoctor` DROP FOREIGN KEY `FavoriteDoctor_userId_fkey`;

-- DropIndex
DROP INDEX `FavoriteDoctor_doctorProfileId_idx` ON `favoritedoctor`;

-- DropIndex
DROP INDEX `FavoriteDoctor_userId_idx` ON `favoritedoctor`;

-- AlterTable
ALTER TABLE `doctorprofile` MODIFY `hospitalName` VARCHAR(255) NOT NULL,
    MODIFY `workingHours` VARCHAR(100) NOT NULL,
    MODIFY `experience` INTEGER NOT NULL DEFAULT 0,
    MODIFY `about` TEXT NULL;

-- AddForeignKey
ALTER TABLE `DoctorProfile` ADD CONSTRAINT `DoctorProfile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FavoriteDoctor` ADD CONSTRAINT `FavoriteDoctor_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FavoriteDoctor` ADD CONSTRAINT `FavoriteDoctor_doctorProfileId_fkey` FOREIGN KEY (`doctorProfileId`) REFERENCES `DoctorProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
