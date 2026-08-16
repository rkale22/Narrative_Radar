# Narrative Radar

Most tools tell you how people *feel* about a topic. Narrative Radar tells you the **competing stories** they are actually telling.

Type a topic, pick a window (`6h` / `24h` / `7d`), and the dashboard pulls live posts from X. [Grok 4.6](https://docs.x.ai/), run through the [Cursor Agent SDK](https://github.com/cursor/sdk), maps those posts into a few thesis-level narratives: who is saying what, how big each story is, and where they collide.

[Watch the demo](./Demo/Narrative-Radar-Demo.mp4)

## What you get

One search, one screen:

1. **Pulse** — one sentence for what X is arguing about right now
2. **Narrative cards** — 1–5 stories, each with share, trajectory, amplifiers, and post receipts
3. **Collision** — the fault line between those stories
4. **Watch for** — signals that could flip the conversation next

Not sentiment buckets. Not a news recap.

## How it works

```text
Topic + window  →  Apify X search  →  Cursor Cloud Agent (grok-4.6)  →  RadarReport JSON  →  dashboard
```

- **Next.js** serves the UI and `POST /api/radar`
- **Apify** fetches recent X posts for the topic and time window
- **Cursor SDK** (`Agent.prompt`) runs a single **Grok 4.6** Cloud Agent
- Grok returns structured JSON: pulse, narratives, collision, watch-for
- The backend validates that payload and the frontend renders it

## Quick start

Needs **Node 22.13+**.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Variable | Purpose |
| --- | --- |
| `CURSOR_API_KEY` | Cursor Agent SDK / Cloud Agent |
| `APIFY_TOKEN` | Live X search |
| `RADAR_USE_SAMPLE=true` | Skip live calls and render the sample report |

```bash
npm run build
npm start
```

## Project layout

| Path | Owner |
| --- | --- |
| `src/app/page.tsx`, `src/components/radar/*`, `src/app/globals.css` | Frontend |
| `src/app/api/radar/route.ts`, `src/server/radar/*` | Orchestration |
| `src/lib/radar/*` | Shared `RadarReport` contract |

Frontend imports `RadarReport` from `src/lib/radar`. Backend validates every generated report with the same Zod schema.
