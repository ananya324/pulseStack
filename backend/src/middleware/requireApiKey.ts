import { Request, Response, NextFunction } from "express";
import { prisma } from "../db/prisma";
import { hashApiKey } from "../modules/projects/apiKey";

declare global {
  namespace Express {
    interface Request {
      projectId?: string;
    }
  }
}

export async function requireApiKey(req: Request, res: Response, next: NextFunction) {
  const header = req.header("x-api-key") ?? req.header("authorization")?.replace(/^Bearer\s+/i, "");
  if (!header) {
    return res.status(401).json({ error: "Missing API key" });
  }

  try {
    const key = await prisma.apiKey.findUnique({
      where: { keyHash: hashApiKey(header) },
    });

    if (!key || key.revokedAt) {
      return res.status(401).json({ error: "Invalid API key" });
    }

    req.projectId = key.projectId;

    // Note when the key was last used. We don't wait for this to finish.
    prisma.apiKey
      .update({ where: { id: key.id }, data: { lastUsedAt: new Date() } })
      .catch(() => {});

    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
}