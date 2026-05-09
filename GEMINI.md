# GEMINI.md

## Project Overview
`serviceapp` (Szerviz-Beszállítás) is an internal service intake and inventory management system. It allows service staff to fill out intake forms in Hungarian, generate QR codes for devices, and track progress (notes, photos) via mobile.

## Project Type
**Code Project** (Next.js, SQLite, Docker)

## Building and Running
*   **Install Dependencies:** `npm install`
*   **Database Setup:** `npx prisma migrate dev`
*   **Run Development:** `npm run dev`
*   **Build Production:** `npm run build`
*   **Docker Start:** `docker-compose up -d`

## Development Conventions
*   **Language:** UI and PDF exports must be in **Hungarian**.
*   **Architecture:** Next.js App Router with Prisma ORM and SQLite.
*   **Mobile First:** Ensure the intake and detail pages are optimized for mobile scanning and photo uploads.
*   **PDF Exports:** Use `jspdf` or `react-pdf` for generating customer reports.

## Key Files
*   `ARCHITECTURE.md`: Comprehensive design document and requirements.
*   `prisma/schema.prisma`: Database schema definition.
*   `docker-compose.yml`: Container orchestration setup.
