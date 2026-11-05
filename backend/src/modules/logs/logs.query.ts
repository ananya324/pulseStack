import { LogLevel } from "@prisma/client";
import { prisma } from "../../db/prisma";

export async function listLogs(
  projectId: string,
  opts: { level?: LogLevel; service?: string; limit: number }
) {
  const rows = await prisma.log.findMany({
    where: { projectId, level: opts.level, service: opts.service },
    orderBy: { timestamp: "desc" },
    take: opts.limit,
  });

  // The log id is a BigInt, and JSON can't send BigInt, so we turn it into text.
  return rows.map((row) => ({ ...row, id: row.id.toString() }));
}

export async function getStats(projectId: string, hours: number) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  const inWindow = { projectId, timestamp: { gte: since } };

  const [total, byLevel, errorsByService, trend] = await Promise.all([
    prisma.log.count({ where: inWindow }),

    prisma.log.groupBy({
      by: ["level"],
      where: inWindow,
      _count: { _all: true },
    }),

    prisma.log.groupBy({
      by: ["service"],
      where: { ...inWindow, level: { in: ["error", "fatal"] } },
      _count: { _all: true },
      orderBy: { _count: { service: "desc" } },
    }),

    prisma.$queryRaw<{ hour: Date; count: bigint }[]>`
      SELECT date_trunc('hour', "timestamp") AS hour, COUNT(*) AS count
      FROM logs
      WHERE project_id = ${projectId}
        AND "timestamp" >= ${since}
        AND level IN ('error', 'fatal')
      GROUP BY 1
      ORDER BY 1`,
  ]);

  return {
    hours,
    total,
    byLevel: byLevel.map((r) => ({ level: r.level, count: r._count._all })),
    errorsByService: errorsByService.map((r) => ({ service: r.service, count: r._count._all })),
    errorTrend: trend.map((r) => ({ hour: r.hour, count: Number(r.count) })),
  };
}