/*
  Warnings:

  - You are about to drop the column `carouselId` on the `Preview` table. All the data in the column will be lost.
  - You are about to drop the column `animationScenes` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `carouselSlides` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `previewSlides` on the `Project` table. All the data in the column will be lost.
  - Added the required column `platform` to the `Preview` table without a default value. This is not possible if the table is not empty.
  - Added the required column `projectId` to the `Preview` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Preview" DROP CONSTRAINT "Preview_carouselId_fkey";

-- DropIndex
DROP INDEX "Preview_carouselId_key";

-- AlterTable
ALTER TABLE "Animation" ADD COLUMN     "projectId" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Carousel" ADD COLUMN     "projectId" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Preview" DROP COLUMN "carouselId",
ADD COLUMN     "platform" TEXT NOT NULL,
ADD COLUMN     "projectId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "animationScenes",
DROP COLUMN "carouselSlides",
DROP COLUMN "previewSlides";

-- CreateIndex
CREATE INDEX "Animation_projectId_idx" ON "Animation"("projectId");

-- CreateIndex
CREATE INDEX "Carousel_projectId_idx" ON "Carousel"("projectId");

-- CreateIndex
CREATE INDEX "Preview_projectId_idx" ON "Preview"("projectId");

-- AddForeignKey
ALTER TABLE "Animation" ADD CONSTRAINT "Animation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Carousel" ADD CONSTRAINT "Carousel_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Preview" ADD CONSTRAINT "Preview_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
