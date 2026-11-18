import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../db/prisma";
import { requireUser } from "../../middleware/requireUser";
import { requireProjectAccess } from "../../middleware/requireProjectAccess";
import { investigate } from "../investigations/investigations.service";

export const incidentsRouter = Router({ mergeParams: true });

incidentsRouter.use(requireUser, requireProjectAccess);

const listQuery = z.object({
  status: z.enum(["open", "resolved"]).optional(),
});

incidentsRouter.get("/incidents", async (req, res) => {
  const parsed = listQuery.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
  }

  const incidents = await prisma.incident.findMany({
    where: { projectId: req.projectId!, status: parsed.data.status },
    orderBy: { startedAt: "desc" },
    take: 50,
  });
  res.json({ incidents });
});
const askSchema = z.object({
  question: z.string().trim().min(3).max(500).default("Why is this service failing?"),
});

incidentsRouter.post("/incidents/:incidentId/investigate", async (req, res) => {
  const parsed = askSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
  }

  try {
    const result = await investigate(req.projectId!, String(req.params.incidentId), parsed.data.question);
    if (!result) return res.status(404).json({ error: "Incident not found" });
    if ("error" in result) return res.status(422).json(result);
    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Investigation failed" });
  }
});

incidentsRouter.get("/incidents/:incidentId/investigations", async (req, res) => {
  const incident = await prisma.incident.findFirst({
    where: { id: String(req.params.incidentId), projectId: req.projectId! },
    select: { id: true },
  });
  if (!incident) return res.status(404).json({ error: "Incident not found" });

  const rows = await prisma.investigation.findMany({
    where: { incidentId: incident.id },
    orderBy: { createdAt: "desc" },
  });
  res.json({
    investigations: rows.map((r) => ({ ...r, evidence: r.evidence.map(String) })),
  });
});