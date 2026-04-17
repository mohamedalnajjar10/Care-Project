/*
  Warnings:

  - You are about to alter the column `hospitalName` on the `doctorprofile` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(191)`.

*/
-- DropForeignKey
ALTER TABLE `doctorprofile` DROP FOREIGN KEY `DoctorProfile_userId_fkey`;

-- DropForeignKey
ALTER TABLE `favoritedoctor` DROP FOREIGN KEY `FavoriteDoctor_doctorProfileId_fkey`;

-- DropForeignKey
ALTER TABLE `favoritedoctor` DROP FOREIGN KEY `FavoriteDoctor_userId_fkey`;

-- AlterTable
ALTER TABLE `doctorprofile` MODIFY `hospitalName` VARCHAR(191) NOT NULL,
    MODIFY `workingHours` VARCHAR(191) NOT NULL,
    MODIFY `experience` INTEGER NULL,
    MODIFY `about` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `FavoriteDoctor_userId_idx` ON `FavoriteDoctor`(`userId`);

-- AddForeignKey
ALTER TABLE `DoctorProfile` ADD CONSTRAINT `DoctorProfile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FavoriteDoctor` ADD CONSTRAINT `FavoriteDoctor_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FavoriteDoctor` ADD CONSTRAINT `FavoriteDoctor_doctorProfileId_fkey` FOREIGN KEY (`doctorProfileId`) REFERENCES `DoctorProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `favoritedoctor` RENAME INDEX `FavoriteDoctor_doctorProfileId_fkey` TO `FavoriteDoctor_doctorProfileId_idx`;
