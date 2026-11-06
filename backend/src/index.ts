import express, { Request, Response } from "express";
import { env } from "./config/env";
import { prisma } from "./db/prisma";
import cookieParser from "cookie-parser";
import { authRouter } from "./modules/auth/auth.routes";
import { projectsRouter } from "./modules/projects/projects.routes";
import { logsRouter } from "./modules/logs/logs.routes";
import { logsReadRouter } from "./modules/logs/logs.read.routes";
import { incidentsRouter } from "./modules/incidents/incidents.routes";
import { startDetector } from "./modules/incidents/detector";

const app = express();

app.use(express.json({ limit: "1mb" }));

app.use(cookieParser());
app.use("/auth", authRouter);
app.use("/projects", projectsRouter);
app.use("/v1/logs", logsRouter);
app.use("/projects/:projectId", logsReadRouter);
app.use("/projects/:projectId", incidentsRouter);

app.get("/health", async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: "ok",
      service: "tracepilot-api",
      database: "up",
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.status(503).json({
      status: "degraded",
      service: "tracepilot-api",
      database: "down",
      timestamp: new Date().toISOString(),
    });
  }
});

app.listen(env.PORT, () => {
  console.log(`TracePilot API listening on http://localhost:${env.PORT}`);
  startDetector();
});