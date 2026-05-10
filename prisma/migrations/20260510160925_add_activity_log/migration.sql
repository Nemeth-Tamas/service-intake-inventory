-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "entityId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
