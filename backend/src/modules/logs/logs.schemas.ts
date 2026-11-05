import { z } from "zod";

export const logItemSchema = z.object({
  level: z.enum(["debug", "info", "warn", "error", "fatal"]),
  service: z.string().trim().min(1).max(100),
  message: z.string().min(1).max(10000),
  timestamp: z.coerce.date().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const ingestSchema = z.union([
  logItemSchema.transform((item) => [item]),
  z.object({ logs: z.array(logItemSchema).min(1).max(500) }).transform((b) => b.logs),
]);