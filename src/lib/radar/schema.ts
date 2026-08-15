import { z } from "zod";

export const radarWindowSchema = z.enum(["6h", "24h", "7d"]);

export const radarRequestSchema = z.object({
  topic: z.string().trim().min(2),
  window: radarWindowSchema.default("24h"),
  useSample: z.boolean().optional(),
});

export const radarTrajectorySchema = z.enum(["rising", "stable", "fading"]);

export const radarAmplifierSchema = z.object({
  handle: z.string().trim().min(1),
  why: z.string().trim().min(1),
});

export const radarMetricsSchema = z.object({
  replies: z.coerce.number().min(0).optional(),
  reposts: z.coerce.number().min(0).optional(),
  likes: z.coerce.number().min(0).optional(),
  views: z.coerce.number().min(0).optional(),
});

export const radarReceiptSchema = z.object({
  url: z.string().url().optional(),
  quote: z.string().trim().min(1),
  handle: z.string().trim().min(1).optional(),
  postedAt: z.string().trim().optional(),
  metrics: radarMetricsSchema.optional(),
});

export const radarNarrativeSchema = z.object({
  id: z.string().trim().min(1),
  label: z.string().trim().min(1),
  thesis: z.string().trim().min(1),
  sharePct: z.coerce.number().min(0).max(100),
  trajectory: radarTrajectorySchema,
  confidence: z.enum(["low", "medium", "high"]).default("medium"),
  amplifiers: z.array(radarAmplifierSchema).min(0),
  receipts: z.array(radarReceiptSchema).min(0),
});

export const radarSourceSchema = z.object({
  provider: z.literal("apify"),
  query: z.string().trim().min(1),
  sampledCount: z.coerce.number().min(0),
});

export const radarCollisionSchema = z.object({
  summary: z.string().trim().min(1),
  faultLine: z.string().trim().min(1),
  narrativeIds: z.array(z.string().trim().min(1)).min(1),
});

export const radarWatchForSchema = z.object({
  label: z.string().trim().min(1),
  why: z.string().trim().min(1),
});

export const radarDiagnosticsSchema = z.object({
  evidenceThin: z.boolean().default(false),
  warnings: z.array(z.string().trim().min(1)).default([]),
});

export const radarReportSchema = z.object({
  reportVersion: z.literal("1").default("1"),
  topic: z.string().trim().min(1),
  window: radarWindowSchema,
  generatedAt: z.string().datetime({ offset: true }),
  source: radarSourceSchema,
  pulse: z.string().trim().min(1),
  narratives: z.array(radarNarrativeSchema).min(1).max(5),
  collision: radarCollisionSchema,
  watchFor: z.array(radarWatchForSchema).min(0),
  diagnostics: radarDiagnosticsSchema.optional(),
});

export const xPostEvidenceSchema = z.object({
  id: z.string().trim().min(1),
  url: z.string().url().optional(),
  text: z.string().trim().min(1),
  handle: z.string().trim().min(1).optional(),
  authorName: z.string().trim().optional(),
  createdAt: z.string().trim().optional(),
  likeCount: z.coerce.number().min(0).optional(),
  repostCount: z.coerce.number().min(0).optional(),
  replyCount: z.coerce.number().min(0).optional(),
  viewCount: z.coerce.number().min(0).optional(),
});

export const candidateNarrativeSchema = z.object({
  id: z.string().trim().min(1),
  label: z.string().trim().min(1),
  thesis: z.string().trim().min(1),
  evidence: z.array(xPostEvidenceSchema).min(0),
  roughSharePct: z.coerce.number().min(0).max(100).optional(),
});

export const evidencePackSchema = z.object({
  topic: z.string().trim().min(1),
  window: radarWindowSchema,
  searchedRange: z.object({
    fromDate: z.string().trim().min(1),
    toDate: z.string().trim().min(1),
  }),
  posts: z.array(xPostEvidenceSchema).min(0),
  candidateNarratives: z.array(candidateNarrativeSchema).min(1),
  notableAmplifiers: z.array(radarAmplifierSchema).min(0),
  evidenceThin: z.boolean().default(false),
});

export const narrativeCritiqueSchema = z.object({
  decisions: z
    .array(
      z.object({
        narrativeId: z.string().trim().min(1),
        action: z.enum(["keep", "merge", "drop"]),
        reason: z.string().trim().min(1),
        mergeInto: z.preprocess(
          (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
          z.string().trim().min(1).optional(),
        ),
      }),
    )
    .min(1),
  collisionCandidate: z.string().trim().min(1),
  warnings: z.array(z.string().trim().min(1)).default([]),
});

export const radarSuccessResponseSchema = z.object({
  ok: z.literal(true),
  report: radarReportSchema,
});

export const radarErrorResponseSchema = z.object({
  ok: z.literal(false),
  error: z.object({
    code: z.enum(["bad_request", "config_error", "agent_error", "provider_error"]),
    message: z.string(),
  }),
});

export const radarResponseSchema = z.discriminatedUnion("ok", [
  radarSuccessResponseSchema,
  radarErrorResponseSchema,
]);

export type RadarWindow = z.infer<typeof radarWindowSchema>;
export type RadarRequest = z.infer<typeof radarRequestSchema>;
export type RadarNarrative = z.infer<typeof radarNarrativeSchema>;
export type RadarReport = z.infer<typeof radarReportSchema>;
export type RadarErrorResponse = z.infer<typeof radarErrorResponseSchema>;
export type RadarResponse = z.infer<typeof radarResponseSchema>;
export type XPostEvidence = z.infer<typeof xPostEvidenceSchema>;
export type CandidateNarrative = z.infer<typeof candidateNarrativeSchema>;
export type EvidencePack = z.infer<typeof evidencePackSchema>;
export type NarrativeCritique = z.infer<typeof narrativeCritiqueSchema>;
