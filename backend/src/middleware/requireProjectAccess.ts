import { Request, Response, NextFunction } from "express";
import { prisma } from "../db/prisma";

export async function requireProjectAccess(req: Request, res: Response, next: NextFunction) {
  const projectId = String(req.params.projectId);

  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId: req.userId },
    select: { id: true },
  });

  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }

  req.projectId = project.id;
  next();
}
//It checks that the project really belongs to the logged-in user.
//  Without it, one user could read another user’s logs by guessing a project id. 
// If the project is not theirs, they get “not found”, the same answer as for a project that doesn’t exist.