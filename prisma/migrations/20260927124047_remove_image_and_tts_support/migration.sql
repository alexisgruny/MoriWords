/*
  Warnings:

  - You are about to drop the column `audioCacheId` on the `Card` table. All the data in the column will be lost.
  - You are about to drop the column `imageAttribution` on the `Card` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `Card` table. All the data in the column will be lost.
  - You are about to drop the `AudioCache` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ImageCache` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Card" DROP CONSTRAINT "Card_audioCacheId_fkey";

-- AlterTable
ALTER TABLE "Card" DROP COLUMN "audioCacheId",
DROP COLUMN "imageAttribution",
DROP COLUMN "imageUrl";

-- DropTable
DROP TABLE "AudioCache";

-- DropTable
DROP TABLE "ImageCache";
