import "server-only";

import { Agent, CursorAgentError } from "@cursor/sdk";
import type { RadarRequest, RadarReport } from "@/lib/radar/schema";
import { radarReportSchema } from "@/lib/radar/schema";
import { getRadarDateRange } from "@/lib/radar/time-window";
import { sampleRadarReport } from "@/lib/radar/sample-report";
import { RadarAgentError, RadarConfigError } from "./errors";
import { buildRadarPrompt } from "./prompts";
import { createXSearchTools } from "./tools/x-search";

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
  const agent = await Agent.create({
    apiKey: cursorApiKey,
    model: { id: "grok-4.6" },
    tools: ["mcp"],
    local: {
      cwd: process.cwd(),
      customTools: createXSearchTools(dateRange),
    },
  });

  try {
    const run = await agent.send(buildRadarPrompt(request, dateRange));
    const result = await run.wait();

    if (result.status !== "finished") {
      throw new RadarAgentError(`Cursor agent run ended with status: ${result.status}`);
    }

    const parsed = parseJsonObject(String(result.result ?? ""));
    return radarReportSchema.parse(parsed);
  } catch (error) {
    if (error instanceof CursorAgentError) {
      throw new RadarAgentError(error.message);
    }

    throw error;
  } finally {
    agent.close();
  }
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
