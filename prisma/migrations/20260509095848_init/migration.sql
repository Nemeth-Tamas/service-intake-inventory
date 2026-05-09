-- CreateTable
CREATE TABLE "WorkOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerName" TEXT,
    "customerContact" TEXT,
    "deviceType" TEXT,
    "serialNumber" TEXT,
    "condition" TEXT,
    "complaint" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Átvétel alatt',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workOrderId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Note_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workOrderId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Photo_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
