# GEMINI.md

## Project Overview
`serviceapp` (Szerviz-Beszállítás) is a professional, self-hosted service management system. It enables technicians to manage device intakes, track repair progress with real-time updates, document work with photos (including automatic iPhone HEIC conversion), and generate professional, branded PDF reports.

## Core Features
*   **Real-Time Sync:** Uses a self-hosted Redis + Socket.io stack for instant updates across devices.
*   **Mobile Optimized:** Floating camera shortcuts and high-scannability QR codes for workshop floor use.
*   **Branding:** Custom workshop logo, name, and technician name configurable in Settings.
*   **Financials:** Track parts and labor costs with automatic total calculation.
*   **Audit Log:** Automated system notes [RENDSZER] for every status, priority, or field change.
*   **Device History:** Automatic lookup of previous repairs based on Serial Number.
*   **Maintenance:** Automated image purging for closed jobs (>30 days) with PDF archiving.

## Architecture
*   **Frontend/Backend:** Next.js 16 (App Router)
*   **Database:** Prisma ORM with SQLite (Persistent volume in Docker)
*   **Real-time:** Socket.io server (port 3001) + Redis (internal broker)
*   **Image Processing:** `heic-convert` for iPhone compatibility, `sharp` for optimization.
*   **PDF Engine:** High-quality `html2canvas` + `jsPDF` slicing for zero-empty-page reports.

## Environment Variables (Docker)
*   `DATABASE_URL`: Standard format `file:///app/prisma/data/dev.db`
*   `REDIS_URL`: `redis://redis:6379`
*   `NODE_ENV`: `production`

## Deployment & Maintenance
*   **Start Stack:** `docker compose up -d --build`
*   **Backup:** One-click download of `dev.db` via `/api/backup`.
*   **Host Permissions:** Ensure `sudo chown -R 1001:1001 ./prisma/data ./public/uploads ./public/archives`.
*   **Language:** Full Hungarian UI and PDF support with character normalization (Ő/ű -> Ö/ü).

## Key Files
*   `prisma/schema.prisma`: Database definition (includes WorkOrder, Note, Photo, LineItem, StatusLog, Settings).
*   `socket-server.js`: Lightweight real-time broadcaster.
*   `src/lib/actions.ts`: Core business logic and system logging.
*   `docker-compose.yml`: Multi-container orchestration (App, Socket, Redis).
