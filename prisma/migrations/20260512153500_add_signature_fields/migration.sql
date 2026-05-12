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
    "status" TEXT NOT NULL DEFAULT 'Átvétel alatt',
    "priority" TEXT NOT NULL DEFAULT 'Normál',
    "estimatedDone" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "archivedPdfPath" TEXT,
    "isWaitingForSignature" BOOLEAN NOT NULL DEFAULT false,
    "signatureData" TEXT,
    "signedAt" DATETIME
);
INSERT INTO "new_WorkOrder" ("archivedPdfPath", "complaint", "condition", "createdAt", "customerContact", "customerName", "deviceType", "estimatedDone", "id", "priority", "serialNumber", "status", "updatedAt") SELECT "archivedPdfPath", "complaint", "condition", "createdAt", "customerContact", "customerName", "deviceType", "estimatedDone", "id", "priority", "serialNumber", "status", "updatedAt" FROM "WorkOrder";
DROP TABLE "WorkOrder";
ALTER TABLE "new_WorkOrder" RENAME TO "WorkOrder";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
