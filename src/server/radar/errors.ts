import type { RadarErrorResponse } from "@/lib/radar/schema";

export class RadarConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RadarConfigError";
  }
}

export class RadarProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RadarProviderError";
  }
}

export class RadarAgentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RadarAgentError";
  }
}

export function toRadarErrorResponse(error: unknown): RadarErrorResponse {
  if (error instanceof RadarConfigError) {
    return {
      ok: false,
      error: { code: "config_error", message: error.message },
    };
  }

  if (error instanceof RadarProviderError) {
    return {
      ok: false,
      error: { code: "provider_error", message: error.message },
    };
  }

  if (error instanceof RadarAgentError) {
    return {
      ok: false,
      error: { code: "agent_error", message: error.message },
    };
  }

  return {
    ok: false,
    error: {
      code: "agent_error",
      message: error instanceof Error ? error.message : "Unknown radar error",
    },
  };
}
