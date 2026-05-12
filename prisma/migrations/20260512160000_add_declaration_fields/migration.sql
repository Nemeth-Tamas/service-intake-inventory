-- AlterTable
ALTER TABLE "WorkOrder" ADD COLUMN "signedDeclarationText" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "baseUrl" TEXT NOT NULL DEFAULT 'http://localhost:3000',
    "logoPath" TEXT,
    "workshopName" TEXT NOT NULL DEFAULT 'Szerviz Központ',
    "technicianName" TEXT,
    "declarationTemplate" TEXT NOT NULL DEFAULT 'Alulírott ügyfél kijelentem, hogy a szolgáltatás megkezdése előtt tájékoztatást kaptam arról, hogy személyes adataimról biztonsági mentést kell készítenem. Az üzlet minden ésszerű lépést megtesz az adatok védelme érdekében, de nem garantálja a teljes körű helyreállítást, és nem vállal felelősséget az adatvesztésért. Hozzájárulok a készülék állapotának fotózásához és a mentett fájlok vírusellenőrzéséhez.'
);
INSERT INTO "new_Settings" ("baseUrl", "id", "logoPath", "technicianName", "workshopName") SELECT "baseUrl", "id", "logoPath", "technicianName", "workshopName" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
