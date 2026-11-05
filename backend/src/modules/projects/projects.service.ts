import { prisma } from "../../db/prisma";
import { generateApiKey } from "./apiKey";

export async function createProject(ownerId: string, name: string) {
  const { raw, keyHash, keyPrefix } = generateApiKey();

  const project = await prisma.project.create({
    data: {
      ownerId,
      name,
      apiKeys: { create: { keyHash, keyPrefix } },
    },
    select: { id: true, name: true, createdAt: true },
  });

  return { project, apiKey: raw };
}

export async function listProjects(ownerId: string) {
  return prisma.project.findMany({
    where: { ownerId },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, createdAt: true },
  });
}