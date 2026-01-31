/*
  Warnings:

  - You are about to drop the `GeneratedContent` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'GENERATING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "SceneType" AS ENUM ('INTRO', 'EXPLANATION', 'VISUALIZATION', 'COMPARISON', 'CTA');

-- CreateEnum
CREATE TYPE "VisualType" AS ENUM ('TWO_COLUMN', 'CENTERED', 'FLOW_DIAGRAM', 'SCATTER_PLOT', 'GRID', 'COMPARISON', 'DASHBOARD');

-- CreateEnum
CREATE TYPE "SlideType" AS ENUM ('HOOK', 'CONTENT', 'CTA');

-- DropForeignKey
ALTER TABLE "GeneratedContent" DROP CONSTRAINT "GeneratedContent_userId_fkey";

-- DropTable
DROP TABLE "GeneratedContent";

-- DropEnum
DROP TYPE "ContentType";

-- CreateTable
CREATE TABLE "Animation" (
    "id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "totalScenes" INTEGER NOT NULL,
    "colorAccent" TEXT NOT NULL,
    "secondaryAccent" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "sourceScript" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Animation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnimationScene" (
    "id" TEXT NOT NULL,
    "animationId" TEXT NOT NULL,
    "sceneNumber" INTEGER NOT NULL,
    "sceneType" "SceneType" NOT NULL,
    "mainText" TEXT NOT NULL,
    "subText" TEXT,
    "visualType" "VisualType" NOT NULL,
    "visualElements" TEXT NOT NULL,
    "emoji" TEXT,
    "label" TEXT,
    "generationPrompt" TEXT NOT NULL,
    "generatedHtml" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnimationScene_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Carousel" (
    "id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "totalSlides" INTEGER NOT NULL,
    "colorAccent" TEXT NOT NULL,
    "secondaryAccent" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "platform" TEXT,
    "canvas" TEXT,
    "ratio" TEXT,
    "sourceScript" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Carousel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarouselSlide" (
    "id" TEXT NOT NULL,
    "carouselId" TEXT NOT NULL,
    "slideNumber" INTEGER NOT NULL,
    "slideType" "SlideType" NOT NULL,
    "mainText" TEXT NOT NULL,
    "highlightText" TEXT,
    "subText" TEXT,
    "dataVisual" TEXT,
    "emoji" TEXT,
    "label" TEXT,
    "generationPrompt" TEXT NOT NULL,
    "generatedHtml" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarouselSlide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Preview" (
    "id" TEXT NOT NULL,
    "carouselId" TEXT,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "colorAccent" TEXT NOT NULL,
    "secondaryAccent" TEXT,
    "mainText" TEXT NOT NULL,
    "highlightText" TEXT,
    "subText" TEXT,
    "emoji" TEXT,
    "label" TEXT,
    "generationPrompt" TEXT NOT NULL,
    "generatedHtml" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Preview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Animation_userId_idx" ON "Animation"("userId");

-- CreateIndex
CREATE INDEX "Animation_status_idx" ON "Animation"("status");

-- CreateIndex
CREATE INDEX "AnimationScene_animationId_idx" ON "AnimationScene"("animationId");

-- CreateIndex
CREATE UNIQUE INDEX "AnimationScene_animationId_sceneNumber_key" ON "AnimationScene"("animationId", "sceneNumber");

-- CreateIndex
CREATE INDEX "Carousel_userId_idx" ON "Carousel"("userId");

-- CreateIndex
CREATE INDEX "Carousel_status_idx" ON "Carousel"("status");

-- CreateIndex
CREATE INDEX "CarouselSlide_carouselId_idx" ON "CarouselSlide"("carouselId");

-- CreateIndex
CREATE UNIQUE INDEX "CarouselSlide_carouselId_slideNumber_key" ON "CarouselSlide"("carouselId", "slideNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Preview_carouselId_key" ON "Preview"("carouselId");

-- CreateIndex
CREATE INDEX "Preview_status_idx" ON "Preview"("status");

-- AddForeignKey
ALTER TABLE "Animation" ADD CONSTRAINT "Animation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnimationScene" ADD CONSTRAINT "AnimationScene_animationId_fkey" FOREIGN KEY ("animationId") REFERENCES "Animation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Carousel" ADD CONSTRAINT "Carousel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarouselSlide" ADD CONSTRAINT "CarouselSlide_carouselId_fkey" FOREIGN KEY ("carouselId") REFERENCES "Carousel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Preview" ADD CONSTRAINT "Preview_carouselId_fkey" FOREIGN KEY ("carouselId") REFERENCES "Carousel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
