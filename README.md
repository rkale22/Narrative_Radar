# Narrative Radar

Narrative Radar maps competing stories around a topic using Grok 4.6 and Cursor
Agent SDK orchestration.

## Repo Boundaries

Frontend-owned files:

- `src/app/page.tsx`
- `src/components/radar/*`
- `src/app/globals.css`

Backend/orchestration-owned files:

- `src/app/api/radar/route.ts`
- `src/lib/radar/*`
- `src/server/radar/*`
- `.env.example`

Shared contract:

- Frontend imports `RadarReport` and `sampleRadarReport` from `src/lib/radar`.
- Backend validates every generated report with the same Zod schema.

## Environment

Copy `.env.example` to `.env.local` and fill:

- `CURSOR_API_KEY` for Cursor Agent SDK orchestration
- `XAI_API_KEY` for Grok's X search tool path
- `RADAR_USE_SAMPLE=true` to bypass live agent calls during frontend work