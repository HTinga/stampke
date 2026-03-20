<div align="center">
<img width="1200" height="475" alt="Tomo Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Tomo — Digital Authority Workspace

Tomo is a professional digital stamp and document signing platform built for Kenyan businesses and enterprises.

## Features
- **Stamp Designer** — Professional digital stamp builder with live SVG preview
- **Toho Sign** — Full e-signature platform (upload, signers, field placement, signing, audit trail)
- **PDF Editor** — Full-featured PDF tools
- **QR Tracker** — Employee and document QR code tracking
- **AI Stamp Digitizer** — Photograph old rubber stamps, AI reconstructs them

## Run Locally

**Prerequisites:** Node.js 18+

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set the `GEMINI_API_KEY` in `.env.local`
3. (Optional) Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `APP_URL` for Google OAuth
4. Run the app:
   ```bash
   npm run dev
   ```

## Tech Stack
React 19 · TypeScript · Vite · Tailwind CSS v4 · Zustand · TipTap · pdf-lib · Konva
