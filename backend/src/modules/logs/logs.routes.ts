import { Router } from "express";
import { requireApiKey } from "../../middleware/requireApiKey";
import { ingestSchema } from "./logs.schemas";
import { ingestLogs } from "./logs.service";

export const logsRouter = Router();

logsRouter.post("/", requireApiKey, async (req, res) => {
  const parsed = ingestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid log data", details: parsed.error.flatten() });
  }

  try {
    const accepted = await ingestLogs(req.projectId!, parsed.data);
    res.status(201).json({ accepted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});