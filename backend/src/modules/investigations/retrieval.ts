import { prisma } from "../../db/prisma";

export async function collectEvidence(incident: {
  projectId: string;
  service: string;
  startedAt: Date;
  resolvedAt: Date | null;
}) {
  // Look a little before the incident started, until it ended (or now)
  const from = new Date(incident.startedAt.getTime() - 10 * 60 * 1000);
  const to = incident.resolvedAt ?? new Date();

  const logs = await prisma.log.findMany({
    where: {
      projectId: incident.projectId,
      service: incident.service,
      level: { in: ["warn", "error", "fatal"] },
      timestamp: { gte: from, lte: to },
    },
    orderBy: { timestamp: "asc" },
    take: 2000,
  });

  // Group by fingerprint: same error = one group
  const groups = new Map<
    string,
    { count: number; level: string; message: string; firstSeen: Date; lastSeen: Date; logIds: bigint[] }
  >();

  for (const log of logs) {
    const g = groups.get(log.fingerprint);
    if (g) {
      g.count++;
      g.lastSeen = log.timestamp;
      if (g.logIds.length < 5) g.logIds.push(log.id);
    } else {
      groups.set(log.fingerprint, {
        count: 1,
        level: log.level,
        message: log.message,
        firstSeen: log.timestamp,
        lastSeen: log.timestamp,
        logIds: [log.id],
      });
    }
  }

  const sorted = [...groups.values()].sort((a, b) => b.count - a.count).slice(0, 15);
  return { from, to, totalLogs: logs.length, groups: sorted };
}