-- CreateEnum
CREATE TYPE "PlannerSection" AS ENUM ('WEEKEND_PREP', 'IDEAS');

-- CreateTable
CREATE TABLE "PlannerEntry" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "theme" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlannerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlannerTask" (
    "id" TEXT NOT NULL,
    "section" "PlannerSection" NOT NULL,
    "label" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlannerTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlannerEntry_date_key" ON "PlannerEntry"("date");

-- CreateIndex
CREATE INDEX "PlannerEntry_date_idx" ON "PlannerEntry"("date");

-- CreateIndex
CREATE INDEX "PlannerTask_section_idx" ON "PlannerTask"("section");
