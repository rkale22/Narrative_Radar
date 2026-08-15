import { z } from "zod";

export const radarWindowSchema = z.enum(["6h", "24h", "7d"]);

export const radarRequestSchema = z.object({
  topic: z.string().trim().min(2).max(160),
  window: radarWindowSchema.default("24h"),
  useSample: z.boolean().optional(),
});

export const radarTrajectorySchema = z.enum(["rising", "stable", "fading"]);

export const radarAmplifierSchema = z.object({
  handle: z.string().trim().min(1),
  why: z.string().trim().min(1).max(220),
});

export const radarReceiptSchema = z.object({
  url: z.string().url(),
  quote: z.string().trim().min(1).max(500),
  handle: z.string().trim().min(1).optional(),
  postedAt: z.string().trim().optional(),
});

export const radarNarrativeSchema = z.object({
  id: z.string().trim().min(1).max(60),
  label: z.string().trim().min(1).max(80),
  thesis: z.string().trim().min(1).max(280),
  sharePct: z.coerce.number().min(0).max(100),
  trajectory: radarTrajectorySchema,
  amplifiers: z.array(radarAmplifierSchema).min(0).max(5),
  receipts: z.array(radarReceiptSchema).min(0).max(3),
});

export const radarReportSchema = z.object({
  topic: z.string().trim().min(1).max(180),
  window: radarWindowSchema,
  pulse: z.string().trim().min(1).max(280),
  narratives: z.array(radarNarrativeSchema).min(1).max(5),
  collision: z.string().trim().min(1).max(360),
  watchFor: z.array(z.string().trim().min(1).max(140)).min(0).max(3),
  evidenceThin: z.boolean().default(false),
  generatedAt: z.string().datetime().optional(),
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
