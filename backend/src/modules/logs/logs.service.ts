import { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma";
import { makeFingerprint } from "../../utils/fingerprint";
import { z } from "zod";
import { logItemSchema } from "./logs.schemas";

type LogItem = z.infer<typeof logItemSchema>;

export async function ingestLogs(projectId: string, items: LogItem[]) {
  const now = new Date();

  const result = await prisma.log.createMany({
    data: items.map((item) => ({
      projectId,
      level: item.level,
      service: item.service,
      message: item.message,
      timestamp: item.timestamp ?? now,
      metadata: (item.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      fingerprint: makeFingerprint(item.message),
    })),
  });

  return result.count;
}

//It saves all the logs in one database call, 
// which is much faster than saving them one by one. 
// Each log gets its project id and its “same error” label.