# ARCHITECTURE.md - Szerviz-Beszállítás (Service Intake System)

## Projekt Célja (Project Goal)
Egy belső használatú webalkalmazás létrehozása szerviztevékenységek adminisztrációjára. A cél a papírmentes, gyors beszállítási folyamat: az eszköz beérkezésekor egy magyar nyelvű űrlap kitöltése, QR kód generálása, majd az eszköz nyomon követése (fotók, jegyzetek) mobilról.

## Technológiai Stack (Tech Stack)
- **Framework:** Next.js (App Router) + TypeScript
- **Adatbázis:** SQLite (egyszerűség és hordozhatóság miatt)
- **ORM:** Prisma
- **Konténerizáció:** Docker (persistent volumes az adatbázisnak és a fotóknak)
- **PDF Generálás:** `jspdf` vagy `react-pdf` a szervizlapokhoz
- **Stílus:** Vanilla CSS vagy egyszerű CSS modulok (mobilbarát fókusz)

## Funkcionális Követelmények (Functional Requirements)
1.  **Beszállítási Űrlap (Intake Form):**
    - Ügyfél adatai (Név, Telefonszám, Email - opcionális).
    - Eszköz adatai (Típus, Sorozatszám, Állapot leírása).
    - Hibajelenség leírása.
    - Opcionális mezők (nincs kötelező kitöltés a rugalmasság érdekében).
2.  **QR Kód & Link:**
    - Mentés után egyedi azonosító generálása.
    - Link formátuma: `${BASE_URL}/t/{id}`.
    - QR kód megjelenítése nyomtatáshoz.
3.  **Adatlap (Device Detail Page):**
    - A QR kód beolvasása után ide jut a felhasználó.
    - Fotók feltöltése (közvetlenül mobilról).
    - Jegyzetek (Notes) hozzáadása időbélyeggel.
    - Aktuális státusz állítása (Pl.: Átvétel alatt, Javítás folyamatban, Kész).
4.  **PDF Generálás:**
    - Egy gombnyomásra letölthető magyar nyelvű jegyzőkönyv az összes adattal és fotóval.
5.  **Docker:**
    - `Dockerfile` és `docker-compose.yml` a könnyű indításhoz.
    - Adatbázis és feltöltött képek mappáinak mountolása a host gépre.

## Adatmodell (Data Model)
- **WorkOrder (Munkalap):** id, customerName, customerContact, deviceType, serialNumber, condition, complaint, status, createdAt, updatedAt.
- **Note (Jegyzet):** id, workOrderId, text, createdAt.
- **Photo (Fotó):** id, workOrderId, filePath, createdAt.

## Fejlesztési Irányelvek (Development Guidelines)
- A felület legyen egyszerű, nagy gombokkal a mobilról való könnyű kezelés érdekében.
- Minden felhasználói szöveg **Magyar** legyen.
- Hibatűrés: Ha nincs internet vagy a BASE_URL nincs beállítva, figyelmeztesse a felhasználót.
