import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { radarRequestSchema, type RadarResponse } from "@/lib/radar/schema";
import { generateRadarReport } from "@/server/radar/orchestrator";
import { toRadarErrorResponse } from "@/server/radar/errors";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const startedAt = Date.now();

  try {
    const body = await request.json();
    const radarRequest = radarRequestSchema.parse(body);
    console.log(
      `[radar] request start topic="${radarRequest.topic}" window=${radarRequest.window} sample=${Boolean(radarRequest.useSample)}`,
    );
    const report = await generateRadarReport(radarRequest);
    console.log(
      `[radar] request success topic="${radarRequest.topic}" narratives=${report.narratives.length} durationMs=${Date.now() - startedAt}`,
    );

    return NextResponse.json<RadarResponse>({ ok: true, report });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json<RadarResponse>(
        {
          ok: false,
          error: {
            code: "bad_request",
            message: error.issues.map((issue) => issue.message).join("; "),
          },
        },
        { status: 400 },
      );
    }

    const response = toRadarErrorResponse(error);
    const status = response.error.code === "config_error" ? 500 : 502;
    console.error(
      `[radar] request failed code=${response.error.code} durationMs=${Date.now() - startedAt}: ${response.error.message}`,
    );

    return NextResponse.json<RadarResponse>(response, { status });
  }
}
