/*
  Warnings:

  - You are about to alter the column `warrantyExpiry` on the `WorkOrder` table. The data in that column could be lost. The data in that column will be cast from `String` to `DateTime`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_WorkOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerName" TEXT,
    "customerContact" TEXT,
    "deviceType" TEXT,
    "serialNumber" TEXT,
    "condition" TEXT,
    "complaint" TEXT,
    "accessories" TEXT,
    "estimatedPrice" TEXT,
    "warranty" TEXT,
    "warrantyExpiry" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'Átvétel alatt',
    "priority" TEXT NOT NULL DEFAULT 'Normál',
    "estimatedDone" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "archivedPdfPath" TEXT,
    "isWaitingForSignature" BOOLEAN NOT NULL DEFAULT false,
    "signatureData" TEXT,
    "signedAt" DATETIME,
    "signedDeclarationText" TEXT
);
INSERT INTO "new_WorkOrder" ("accessories", "archivedPdfPath", "complaint", "condition", "createdAt", "customerContact", "customerName", "deviceType", "estimatedDone", "estimatedPrice", "id", "isWaitingForSignature", "priority", "serialNumber", "signatureData", "signedAt", "signedDeclarationText", "status", "updatedAt", "warranty", "warrantyExpiry") SELECT "accessories", "archivedPdfPath", "complaint", "condition", "createdAt", "customerContact", "customerName", "deviceType", "estimatedDone", "estimatedPrice", "id", "isWaitingForSignature", "priority", "serialNumber", "signatureData", "signedAt", "signedDeclarationText", "status", "updatedAt", "warranty", "warrantyExpiry" FROM "WorkOrder";
DROP TABLE "WorkOrder";
ALTER TABLE "new_WorkOrder" RENAME TO "WorkOrder";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
