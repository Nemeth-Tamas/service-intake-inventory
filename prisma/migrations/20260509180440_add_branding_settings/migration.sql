-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "baseUrl" TEXT NOT NULL DEFAULT 'http://localhost:3000',
    "logoPath" TEXT,
    "workshopName" TEXT NOT NULL DEFAULT 'Szerviz Központ',
    "technicianName" TEXT
);
INSERT INTO "new_Settings" ("baseUrl", "id", "logoPath") SELECT "baseUrl", "id", "logoPath" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
