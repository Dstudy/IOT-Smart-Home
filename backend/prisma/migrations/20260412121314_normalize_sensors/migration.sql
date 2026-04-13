/*
  Warnings:

  - You are about to drop the column `ambientLight` on the `sensordata` table. All the data in the column will be lost.
  - You are about to drop the column `humidity` on the `sensordata` table. All the data in the column will be lost.
  - You are about to drop the column `temperature` on the `sensordata` table. All the data in the column will be lost.
  - Added the required column `sensorId` to the `SensorData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `value` to the `SensorData` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `sensordata` DROP COLUMN `ambientLight`,
    DROP COLUMN `humidity`,
    DROP COLUMN `temperature`,
    ADD COLUMN `sensorId` INTEGER NOT NULL,
    ADD COLUMN `value` DOUBLE NOT NULL;

-- CreateTable
CREATE TABLE `Sensor` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Sensor_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
