-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "baseUrl" TEXT NOT NULL DEFAULT 'http://localhost:3000'
);

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
    "archivedPdfPath" TEXT
);
INSERT INTO "new_WorkOrder" ("complaint", "condition", "createdAt", "customerContact", "customerName", "deviceType", "id", "serialNumber", "status", "updatedAt") SELECT "complaint", "condition", "createdAt", "customerContact", "customerName", "deviceType", "id", "serialNumber", "status", "updatedAt" FROM "WorkOrder";
DROP TABLE "WorkOrder";
ALTER TABLE "new_WorkOrder" RENAME TO "WorkOrder";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
