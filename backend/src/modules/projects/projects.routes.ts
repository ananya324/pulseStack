import { Router } from "express";
import { z } from "zod";
import { requireUser } from "../../middleware/requireUser";
import { createProject, listProjects } from "./projects.service";

export const projectsRouter = Router();

projectsRouter.use(requireUser);

const createSchema = z.object({
  name: z.string().trim().min(1).max(100),
});

projectsRouter.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
  }

  const { project, apiKey } = await createProject(req.userId!, parsed.data.name);
  res.status(201).json({
    project,
    apiKey,
    note: "Save this key now. You will not be able to see it again.",
  });
});

projectsRouter.get("/", async (req, res) => {
  const projects = await listProjects(req.userId!);
  res.json({ projects });
});