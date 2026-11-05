import { Router } from "express";
import { z } from "zod";
import { requireUser } from "../../middleware/requireUser";
import { requireProjectAccess } from "../../middleware/requireProjectAccess";
import { listLogs, getStats } from "./logs.query";

export const logsReadRouter = Router({ mergeParams: true });

logsReadRouter.use(requireUser, requireProjectAccess);

const listQuery = z.object({
  level: z.enum(["debug", "info", "warn", "error", "fatal"]).optional(),
  service: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

const statsQuery = z.object({
  hours: z.coerce.number().int().min(1).max(168).default(24),
});

logsReadRouter.get("/logs", async (req, res) => {
  const parsed = listQuery.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
  }
  const logs = await listLogs(req.projectId!, parsed.data);
  res.json({ logs });
});

logsReadRouter.get("/stats", async (req, res) => {
  const parsed = statsQuery.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
  }
  const stats = await getStats(req.projectId!, parsed.data.hours);
  res.json(stats);
});