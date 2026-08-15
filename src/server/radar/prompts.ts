import type { RadarRequest } from "@/lib/radar/schema";
import type { EvidencePack, NarrativeCritique } from "@/lib/radar/schema";
import type { RadarDateRange } from "@/lib/radar/time-window";
import type { searchXNarratives } from "./tools/x-search";

export function buildResearchPrompt(
  request: RadarRequest,
  dateRange: RadarDateRange,
  searchResult: Awaited<ReturnType<typeof searchXNarratives>>,
): string {
  return `You are the Narrative Radar research agent.

Goal:
Gather live X evidence and propose candidate narratives. This is not sentiment analysis and not a generic news summary.

Topic: ${request.topic}
Window: ${request.window}
Date range: ${dateRange.fromDate} through ${dateRange.toDate}

Apify search result:
${JSON.stringify(searchResult, null, 2)}

Required workflow:
1. Use the Apify posts above as evidence.
2. Propose 1-8 candidate narratives.
3. Copy the strongest posts into the EvidencePack posts field.
4. Prefer thesis-level labels, not sentiment labels.
5. If the topic is quiet, return one candidate and set evidenceThin=true.
6. Do not invent factions to fill the UI.

Return JSON only. No markdown, no code fences, no commentary.

JSON shape:
{
  "topic": string,
  "window": "6h" | "24h" | "7d",
  "searchedRange": { "fromDate": string, "toDate": string },
  "posts": [
    {
      "id": string,
      "url": string,
      "text": string,
      "handle": string,
      "authorName": string,
      "createdAt": string,
      "likeCount": number,
      "repostCount": number,
      "replyCount": number,
      "viewCount": number
    }
  ],
  "candidateNarratives": [
    {
      "id": string,
      "label": string,
      "thesis": string,
      "evidence": [{ "id": string, "url": string, "text": string, "handle": string }],
      "roughSharePct": number
    }
  ],
  "notableAmplifiers": [{ "handle": string, "why": string }],
  "evidenceThin": boolean
}`;
}

export function buildCriticPrompt(evidencePack: EvidencePack): string {
  return `You are the Narrative Radar critic agent.

Job:
Attack the candidate narratives before users see them.

EvidencePack:
${JSON.stringify(evidencePack, null, 2)}

Rules:
1. Drop Positive / Negative / Neutral buckets.
2. Merge candidates that share the same thesis with different wording.
3. Drop candidates with weak evidence unless the entire topic is evidence-thin.
4. Allow N=1 when disagreement is thin.
5. Identify the underlying collision that matters.

Return JSON only. No markdown, no code fences, no commentary.

JSON shape:
{
  "decisions": [
    {
      "narrativeId": string,
      "action": "keep" | "merge" | "drop",
      "reason": string,
      "mergeInto": string
    }
  ],
  "collisionCandidate": string,
  "warnings": string[]
}`;
}

export function buildSynthesizerPrompt(
  request: RadarRequest,
  evidencePack: EvidencePack,
  critique: NarrativeCritique,
): string {
  return `You are the Narrative Radar synthesizer agent.

Job:
Produce the final RadarReport JSON for the UI.

Topic: ${request.topic}
Window: ${request.window}

EvidencePack:
${JSON.stringify(evidencePack, null, 2)}

Critique:
${JSON.stringify(critique, null, 2)}

Required workflow:
1. Keep only narratives that survived critique, applying merge decisions.
2. Return 1-5 narratives.
3. Make sharePct values roughly sum to 100.
4. Do not optimize for a specific UI layout. Return complete product data; the frontend will truncate visually.
5. Final answer must be valid RadarReport JSON only.

JSON shape:
{
  "reportVersion": "1",
  "topic": string,
  "window": "6h" | "24h" | "7d",
  "generatedAt": string,
  "source": {
    "provider": "apify",
    "query": string,
    "sampledCount": number
  },
  "pulse": string,
  "narratives": [
    {
      "id": string,
      "label": string,
      "thesis": string,
      "sharePct": number,
      "trajectory": "rising" | "stable" | "fading",
      "confidence": "low" | "medium" | "high",
      "amplifiers": [{ "handle": string, "why": string }],
      "receipts": [
        {
          "url": string,
          "quote": string,
          "handle": string,
          "metrics": {
            "replies": number,
            "reposts": number,
            "likes": number,
            "views": number
          }
        }
      ]
    }
  ],
  "collision": {
    "summary": string,
    "faultLine": string,
    "narrativeIds": string[]
  },
  "watchFor": [{ "label": string, "why": string }],
  "diagnostics": {
    "evidenceThin": boolean,
    "warnings": string[]
  }
}`;
}
