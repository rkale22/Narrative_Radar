import { radarReportSchema } from "@/lib/radar/schema";

type ValidateReportArgs = {
  reportJson?: string;
};

type NormalizeSharesArgs = {
  shares?: Array<{
    id?: string;
    sharePct?: number;
  }>;
};

export function createReportTools() {
  return {
    validate_radar_report: {
      description:
        "Validate a RadarReport JSON string against the product schema. Use before returning the final answer.",
      inputSchema: {
        type: "object",
        properties: {
          reportJson: {
            type: "string",
            description: "The complete RadarReport object serialized as JSON.",
          },
        },
        required: ["reportJson"],
        additionalProperties: false,
      },
      async execute(args: ValidateReportArgs) {
        return JSON.stringify(validateRadarReportJson(args.reportJson ?? ""));
      },
    },
    normalize_share_percentages: {
      description:
        "Normalize narrative share percentages so they are bounded and sum to 100.",
      inputSchema: {
        type: "object",
        properties: {
          shares: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                sharePct: { type: "number" },
              },
              required: ["id", "sharePct"],
              additionalProperties: false,
            },
          },
        },
        required: ["shares"],
        additionalProperties: false,
      },
      async execute(args: NormalizeSharesArgs) {
        return JSON.stringify(normalizeSharePercentages(args.shares ?? []));
      },
    },
  };
}

export function validateRadarReportJson(reportJson: string) {
  try {
    const parsed = JSON.parse(reportJson);
    const result = radarReportSchema.safeParse(parsed);

    if (result.success) {
      return { valid: true, errors: [] };
    }

    return {
      valid: false,
      errors: result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    };
  } catch (error) {
    return {
      valid: false,
      errors: [
        {
          path: "$",
          message: error instanceof Error ? error.message : "Invalid JSON",
        },
      ],
    };
  }
}

export function normalizeSharePercentages(
  shares: Array<{ id?: string; sharePct?: number }>,
) {
  const cleanShares = shares
    .filter((share): share is { id: string; sharePct: number } => {
      return Boolean(share.id) && typeof share.sharePct === "number";
    })
    .map((share) => ({
      id: share.id,
      sharePct: Math.max(0, share.sharePct),
    }));

  const total = cleanShares.reduce((sum, share) => sum + share.sharePct, 0);
  if (total <= 0) {
    return cleanShares.map((share) => ({ ...share, sharePct: 0 }));
  }

  const normalized = cleanShares.map((share) => ({
    id: share.id,
    sharePct: Math.round((share.sharePct / total) * 100),
  }));

  const drift = 100 - normalized.reduce((sum, share) => sum + share.sharePct, 0);
  if (normalized.length > 0 && drift !== 0) {
    normalized[0] = {
      ...normalized[0],
      sharePct: normalized[0].sharePct + drift,
    };
  }

  return normalized;
}
