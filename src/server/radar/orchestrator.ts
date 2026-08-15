import { Agent, CursorAgentError } from "@cursor/sdk";
import type { EvidencePack, NarrativeCritique, RadarRequest, RadarReport } from "@/lib/radar/schema";
import { evidencePackSchema, narrativeCritiqueSchema, radarReportSchema } from "@/lib/radar/schema";
import { getRadarDateRange } from "@/lib/radar/time-window";
import { sampleRadarReport } from "@/lib/radar/sample-report";
import { RadarAgentError, RadarConfigError } from "./errors";
import {
  buildCriticPrompt,
  buildResearchPrompt,
  buildSingleAgentReportPrompt,
  buildSynthesizerPrompt,
} from "./prompts";
import { normalizeSharePercentages } from "./tools/report-tools";
import { searchXNarratives } from "./tools/x-search";

export async function generateRadarReport(
  request: RadarRequest,
): Promise<RadarReport> {
  if (request.useSample || process.env.RADAR_USE_SAMPLE === "true") {
    return {
      ...sampleRadarReport,
      topic: request.topic,
      window: request.window,
      generatedAt: new Date().toISOString(),
    };
  }

  const cursorApiKey = process.env.CURSOR_API_KEY;
  if (!cursorApiKey) {
    throw new RadarConfigError("Missing CURSOR_API_KEY for Cursor SDK orchestration.");
  }

  const dateRange = getRadarDateRange(request.window);
  console.log(`[radar] apify search start topic="${request.topic}"`);
  const searchResult = await searchXNarratives(request.topic, dateRange, {
    maxResults: 50,
  });
  console.log(
    `[radar] apify search done topic="${request.topic}" raw=${searchResult.rawItemCount} normalized=${searchResult.posts.length}`,
  );

  if (process.env.RADAR_USE_STAGED_AGENTS === "true") {
    return runStagedReportAgents(request, dateRange, searchResult, cursorApiKey);
  }

  console.log(`[radar] single report agent start topic="${request.topic}"`);
  const report = await runSingleReportAgent(request, dateRange, searchResult, cursorApiKey);
  console.log(
    `[radar] single report agent done topic="${request.topic}" narratives=${report.narratives.length}`,
  );
  return report;
}

async function runSingleReportAgent(
  request: RadarRequest,
  dateRange: ReturnType<typeof getRadarDateRange>,
  searchResult: Awaited<ReturnType<typeof searchXNarratives>>,
  cursorApiKey: string,
): Promise<RadarReport> {
  const parsed = await runCloudAgentForJson(
    buildSingleAgentReportPrompt(request, dateRange, searchResult),
    "single-report",
    cursorApiKey,
  );
  const report = radarReportSchema.parse(
    repairRadarReportCandidate(parsed, request, {
      topic: request.topic,
      window: request.window,
      searchedRange: dateRange,
      posts: searchResult.posts,
      candidateNarratives: [
        {
          id: "raw-evidence",
          label: "Raw evidence",
          thesis: "Raw Apify evidence used for report generation.",
          evidence: searchResult.posts,
        },
      ],
      notableAmplifiers: [],
      evidenceThin: searchResult.posts.length === 0,
    }),
  );
  return normalizeReportShares(report);
}

async function runStagedReportAgents(
  request: RadarRequest,
  dateRange: ReturnType<typeof getRadarDateRange>,
  searchResult: Awaited<ReturnType<typeof searchXNarratives>>,
  cursorApiKey: string,
): Promise<RadarReport> {
  console.log(`[radar] research agent start topic="${request.topic}"`);
  const evidencePack = await runResearchAgent(request, dateRange, searchResult, cursorApiKey);
  console.log(
    `[radar] research agent done topic="${request.topic}" candidates=${evidencePack.candidateNarratives.length} posts=${evidencePack.posts.length}`,
  );
  console.log(`[radar] critic agent start topic="${request.topic}"`);
  const critique = await runCriticAgent(evidencePack, cursorApiKey);
  console.log(
    `[radar] critic agent done topic="${request.topic}" decisions=${critique.decisions.length}`,
  );
  console.log(`[radar] synthesizer agent start topic="${request.topic}"`);
  return runSynthesizerAgent(request, evidencePack, critique, cursorApiKey);
}

async function runResearchAgent(
  request: RadarRequest,
  dateRange: ReturnType<typeof getRadarDateRange>,
  searchResult: Awaited<ReturnType<typeof searchXNarratives>>,
  cursorApiKey: string,
): Promise<EvidencePack> {
  try {
    const parsed = await runCloudAgentForJson(
      buildResearchPrompt(request, dateRange, searchResult),
      "research",
      cursorApiKey,
    );
    return evidencePackSchema.parse(parsed);
  } catch (error) {
    if (error instanceof CursorAgentError) {
      throw new RadarAgentError(error.message);
    }

    throw error;
  }
}

async function runCriticAgent(
  evidencePack: EvidencePack,
  cursorApiKey: string,
): Promise<NarrativeCritique> {
  try {
    const parsed = await runCloudAgentForJson(
      buildCriticPrompt(evidencePack),
      "critic",
      cursorApiKey,
    );
    return narrativeCritiqueSchema.parse(parsed);
  } catch (error) {
    if (error instanceof CursorAgentError) {
      throw new RadarAgentError(error.message);
    }

    throw error;
  }
}

async function runSynthesizerAgent(
  request: RadarRequest,
  evidencePack: EvidencePack,
  critique: NarrativeCritique,
  cursorApiKey: string,
): Promise<RadarReport> {
  try {
    const parsed = await runCloudAgentForJson(
      buildSynthesizerPrompt(request, evidencePack, critique),
      "synthesizer",
      cursorApiKey,
    );
    const report = radarReportSchema.parse(
      repairRadarReportCandidate(parsed, request, evidencePack),
    );
    const normalizedReport = normalizeReportShares(report);
    console.log(
      `[radar] synthesizer agent done topic="${request.topic}" narratives=${normalizedReport.narratives.length}`,
    );
    return normalizedReport;
  } catch (error) {
    if (error instanceof CursorAgentError) {
      throw new RadarAgentError(error.message);
    }

    throw error;
  }
}

async function runCloudAgentForJson(
  prompt: string,
  stage: string,
  cursorApiKey: string,
): Promise<unknown> {
  const result = await Agent.prompt(prompt, {
    apiKey: cursorApiKey,
    model: { id: "grok-4.6" },
    cloud: { repos: [] },
  });

  if (result.status !== "finished") {
    throw new RadarAgentError(`Cursor ${stage} agent ended with status: ${result.status}`);
  }

  const agentText = String(result.result ?? "");
  try {
    return parseJsonObject(agentText);
  } catch (error) {
    console.error(
      `[radar] ${stage} json parse failed len=${agentText.length} preview=${JSON.stringify(agentText.slice(0, 240))}`,
    );
    throw error;
  }
}

function repairRadarReportCandidate(
  candidate: unknown,
  request: RadarRequest,
  evidencePack: EvidencePack,
): unknown {
  if (!candidate || typeof candidate !== "object") {
    return candidate;
  }

  const report = { ...(candidate as Record<string, unknown>) };

  report.reportVersion = "1";
  report.topic ??= request.topic;
  report.window ??= request.window;
  report.generatedAt = firstString(report.generatedAt) ?? new Date().toISOString();
  report.source = repairSource(report.source, request, evidencePack);
  report.collision = repairCollision(report.collision, report.narratives);

  if (Array.isArray(report.watchFor)) {
    report.watchFor = report.watchFor.map(repairWatchFor);
  }

  if (Array.isArray(report.narratives)) {
    report.narratives = report.narratives.slice(0, 5).map((item) => {
      if (!item || typeof item !== "object") {
        return item;
      }

      const narrative = { ...(item as Record<string, unknown>) };

      narrative.confidence ??= "medium";

      if (Array.isArray(narrative.amplifiers)) {
        narrative.amplifiers = narrative.amplifiers.map((amplifier) => {
          if (!amplifier || typeof amplifier !== "object") {
            return amplifier;
          }

          return { ...(amplifier as Record<string, unknown>) };
        });
      }

      if (Array.isArray(narrative.receipts)) {
        narrative.receipts = narrative.receipts.map((receipt) => {
          if (!receipt || typeof receipt !== "object") {
            return receipt;
          }

          return repairReceipt(receipt as Record<string, unknown>);
        });
      }

      return narrative;
    });
  }

  return report;
}

function repairSource(
  source: unknown,
  request: RadarRequest,
  evidencePack: EvidencePack,
) {
  if (source && typeof source === "object") {
    return {
      provider: "apify",
      query: firstString((source as Record<string, unknown>).query) ?? request.topic,
      sampledCount:
        firstNumber((source as Record<string, unknown>).sampledCount) ??
        evidencePack.posts.length,
    };
  }

  return {
    provider: "apify",
    query: request.topic,
    sampledCount: evidencePack.posts.length,
  };
}

function repairCollision(collision: unknown, narratives: unknown) {
  const narrativeIds = Array.isArray(narratives)
    ? narratives
        .map((narrative) =>
          narrative && typeof narrative === "object"
            ? firstString((narrative as Record<string, unknown>).id)
            : undefined,
        )
        .filter((id): id is string => Boolean(id))
    : [];

  if (collision && typeof collision === "object") {
    const collisionRecord = collision as Record<string, unknown>;
    return {
      summary: firstString(collisionRecord.summary) ?? "The narratives disagree on what matters most.",
      faultLine: firstString(collisionRecord.faultLine) ?? firstString(collisionRecord.summary) ?? "Competing narrative frames",
      narrativeIds:
        Array.isArray(collisionRecord.narrativeIds) && collisionRecord.narrativeIds.length > 0
          ? collisionRecord.narrativeIds
          : narrativeIds,
    };
  }

  const summary = firstString(collision) ?? "The narratives disagree on what matters most.";
  return {
    summary,
    faultLine: summary,
    narrativeIds,
  };
}

function repairWatchFor(item: unknown) {
  if (item && typeof item === "object") {
    const record = item as Record<string, unknown>;
    const label = firstString(record.label) ?? firstString(record.title) ?? "Signal to watch";
    return {
      label,
      why: firstString(record.why) ?? firstString(record.description) ?? label,
    };
  }

  const label = firstString(item) ?? "Signal to watch";
  return { label, why: label };
}

function repairReceipt(receipt: Record<string, unknown>) {
  const existingMetrics = receipt.metrics;
  const metrics =
    existingMetrics && typeof existingMetrics === "object"
      ? existingMetrics
      : {
          replies: firstNumber(receipt.replies, receipt.replyCount),
          reposts: firstNumber(receipt.reposts, receipt.repostCount, receipt.retweetCount),
          likes: firstNumber(receipt.likes, receipt.likeCount),
          views: firstNumber(receipt.views, receipt.viewCount),
        };

  return {
    ...receipt,
    metrics,
  };
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

function firstNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value.replaceAll(",", ""));
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return undefined;
}

function normalizeReportShares(report: RadarReport): RadarReport {
  const normalizedShares = normalizeSharePercentages(
    report.narratives.map((narrative) => ({
      id: narrative.id,
      sharePct: narrative.sharePct,
    })),
  );
  const shareById = new Map(
    normalizedShares.map((share) => [share.id, share.sharePct]),
  );

  return {
    ...report,
    narratives: report.narratives.map((narrative) => ({
      ...narrative,
      sharePct: shareById.get(narrative.id) ?? narrative.sharePct,
    })),
  };
}

function parseJsonObject(text: string): unknown {
  const trimmed = stripCodeFence(text.trim());
  if (!trimmed) {
    throw new RadarAgentError("Cursor agent returned an empty report.");
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    const jsonSlice = extractFirstJsonObject(trimmed);
    if (!jsonSlice) {
      throw new RadarAgentError("Cursor agent did not return JSON.");
    }

    try {
      return JSON.parse(jsonSlice);
    } catch {
      throw new RadarAgentError("Cursor agent returned extra text after JSON.");
    }
  }
}

function extractFirstJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < text.length; index += 1) {
    const char = text[index];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === "\\") {
        escaped = true;
        continue;
      }
      if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "\"") {
      inString = true;
      continue;
    }

    if (char === "{") {
      depth += 1;
      continue;
    }

    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return text.slice(start, index + 1);
      }
    }
  }

  return null;
}

function stripCodeFence(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```[\s\S]*$/, "");
}
