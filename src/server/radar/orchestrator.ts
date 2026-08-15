import { Agent, CursorAgentError } from "@cursor/sdk";
import type { EvidencePack, NarrativeCritique, RadarRequest, RadarReport } from "@/lib/radar/schema";
import { evidencePackSchema, narrativeCritiqueSchema, radarReportSchema } from "@/lib/radar/schema";
import { getRadarDateRange } from "@/lib/radar/time-window";
import { sampleRadarReport } from "@/lib/radar/sample-report";
import { RadarAgentError, RadarConfigError } from "./errors";
import { buildCriticPrompt, buildResearchPrompt, buildSynthesizerPrompt } from "./prompts";
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
  const searchResult = await searchXNarratives(request.topic, dateRange, {
    maxResults: 50,
  });
  const evidencePack = await runResearchAgent(request, dateRange, searchResult, cursorApiKey);
  const critique = await runCriticAgent(evidencePack, cursorApiKey);
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
    return normalizeReportShares(report);
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

  return parseJsonObject(String(result.result ?? ""));
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
  const trimmed = text.trim();
  if (!trimmed) {
    throw new RadarAgentError("Cursor agent returned an empty report.");
  }

  try {
    return JSON.parse(stripCodeFence(trimmed));
  } catch {
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      throw new RadarAgentError("Cursor agent did not return JSON.");
    }

    return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
  }
}

function stripCodeFence(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
}
