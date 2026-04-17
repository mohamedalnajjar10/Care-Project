-- CreateTable
CREATE TABLE `UserAddress` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `label` ENUM('HOME', 'WORK', 'OTHER') NOT NULL DEFAULT 'HOME',
    `title` VARCHAR(100) NULL,
    `formattedAddress` VARCHAR(500) NOT NULL,
    `placeId` VARCHAR(255) NULL,
    `latitude` DECIMAL(10, 7) NOT NULL,
    `longitude` DECIMAL(10, 7) NOT NULL,
    `street` VARCHAR(255) NULL,
    `area` VARCHAR(255) NULL,
    `city` VARCHAR(100) NULL,
    `state` VARCHAR(100) NULL,
    `country` VARCHAR(100) NULL,
    `postalCode` VARCHAR(30) NULL,
    `buildingNumber` VARCHAR(50) NULL,
    `floor` VARCHAR(50) NULL,
    `apartmentNumber` VARCHAR(50) NULL,
    `landmark` VARCHAR(255) NULL,
    `notes` VARCHAR(500) NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `UserAddress_userId_idx`(`userId`),
    INDEX `UserAddress_userId_isDefault_idx`(`userId`, `isDefault`),
    INDEX `UserAddress_city_idx`(`city`),
    INDEX `UserAddress_country_idx`(`country`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserAddress` ADD CONSTRAINT `UserAddress_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
