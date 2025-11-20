-- AlterTable
ALTER TABLE "settings" ADD COLUMN     "closeTime" TEXT NOT NULL DEFAULT '17:00',
ADD COLUMN     "daysOpen" TEXT NOT NULL DEFAULT '1,2,3,4,5',
ADD COLUMN     "openTime" TEXT NOT NULL DEFAULT '09:00';

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 60,
    "price" DOUBLE PRECISION,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);
