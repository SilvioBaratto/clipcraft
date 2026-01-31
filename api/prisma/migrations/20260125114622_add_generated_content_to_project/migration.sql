-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "animationScenes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "carouselSlides" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "previewSlides" TEXT[] DEFAULT ARRAY[]::TEXT[];
