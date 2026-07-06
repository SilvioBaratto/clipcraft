-- DropForeignKey
ALTER TABLE "Carousel" DROP CONSTRAINT "Carousel_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Carousel" DROP CONSTRAINT "Carousel_userId_fkey";

-- DropForeignKey
ALTER TABLE "CarouselSlide" DROP CONSTRAINT "CarouselSlide_carouselId_fkey";

-- DropForeignKey
ALTER TABLE "Preview" DROP CONSTRAINT "Preview_projectId_fkey";

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "hasCarousel",
DROP COLUMN "hasPreview";

-- DropTable
DROP TABLE "Carousel";

-- DropTable
DROP TABLE "CarouselSlide";

-- DropTable
DROP TABLE "Preview";

-- DropEnum
DROP TYPE "SlideType";
