# GEMINI.md (V2.0 Upgraded)

## Project Overview
`serviceapp` (Cellnet Kft. Szerviz) is a professional, self-hosted service management system. It enables technicians to manage device intakes, track repair progress with real-time updates, and provide customers with a secure status tracking portal.

## Core Features (V2.0)
*   **Real-Time Sync (SSE):** Uses Server-Sent Events over standard HTTPS for instant updates, ensuring high compatibility with Cloudflare and reverse proxies.
*   **Secure Access:** Protected by a single-technician account (NextAuth v5) defined via environment variables (`AUTH_USER`, `AUTH_PASS`).
*   **PWA & QR Scanner:** Installable mobile app with an integrated, full-screen QR scanner for instant work order navigation.
*   **Customer Portal:** Public, read-only status tracking at `/status/[id]` supporting both full CUIDs and 6-character short IDs.
*   **Professional Branding:** Custom workshop identity (Cellnet Kft. Szerviz) integrated into the UI and PDF reports.
*   **Activity Audit Log:** Persistent Rendszernapló (System Log) tracking every workshop action chronologically.
*   **Performance:** Automatic image optimization to WebP (using `sharp`) for reduced storage and faster loading.

## Architecture
*   **Frontend/Backend:** Next.js 16 (App Router)
*   **Database:** Prisma ORM with SQLite (Persistent volume in Docker)
*   **Real-time:** SSE stream (`/api/realtime`) + Redis (internal broker)
*   **Image Processing:** `sharp` for WebP optimization and resizing.

## Environment Variables (V2.0)
*   `AUTH_SECRET`: Random string for session encryption.
*   `AUTH_USER` / `AUTH_PASS`: Single account credentials.
*   `AUTH_URL`: Public HTTPS URL for correct redirects.
*   `DATABASE_URL`: `file:///app/prisma/data/dev.db`
*   `REDIS_URL`: `redis://redis:6379`

## Deployment & Proxy
*   **Rebuild:** `docker compose up -d --build` (uses `--legacy-peer-deps` in Dockerfile).
*   **Proxy Config:** Route standard traffic to port 3000. No special WebSocket configuration needed thanks to SSE.
*   **Permissions:** Crucial for Linux hosts: `sudo chown -R 1001:1001 ./prisma/data ./public/uploads ./public/archives`.
*   **Git Policy:** Database files and media uploads are ignored via `.gitignore` to prevent deployment conflicts.

## Key Files
*   `src/auth.ts`: Authentication configuration.
*   `src/middleware.ts`: Global route protection.
*   `src/app/api/realtime/route.ts`: SSE stream implementation.
*   `src/components/MobileQRScanner.tsx`: Full-screen camera scanner (using React Portal).
