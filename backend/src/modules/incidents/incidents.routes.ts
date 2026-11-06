import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../db/prisma";
import { requireUser } from "../../middleware/requireUser";
import { requireProjectAccess } from "../../middleware/requireProjectAccess";

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