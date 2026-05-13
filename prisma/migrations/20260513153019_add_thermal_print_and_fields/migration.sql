-- AlterTable
ALTER TABLE "Settings" ADD COLUMN "address" TEXT;
ALTER TABLE "Settings" ADD COLUMN "email" TEXT;
ALTER TABLE "Settings" ADD COLUMN "phone" TEXT;
ALTER TABLE "Settings" ADD COLUMN "website" TEXT;

-- AlterTable
ALTER TABLE "WorkOrder" ADD COLUMN "accessories" TEXT;
ALTER TABLE "WorkOrder" ADD COLUMN "estimatedPrice" TEXT;
ALTER TABLE "WorkOrder" ADD COLUMN "warranty" TEXT;
