/*
  Warnings:

  - You are about to drop the column `containerId` on the `Carousel` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Carousel" DROP COLUMN "containerId";

-- CreateTable
CREATE TABLE "CarouselOrder" (
    "id" SERIAL NOT NULL,
    "orderCarousel" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CarouselOrder_pkey" PRIMARY KEY ("id")
);
