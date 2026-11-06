import { prisma } from "../../db/prisma";

const WINDOW_MINUTES = 5;
const ERROR_THRESHOLD = 5;

export async function runDetection() {
    const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000);

    // 1. Count recent errors for every project + service pair
    const counts = await prisma.log.groupBy({
        by: ["projectId", "service"],
        where: { timestamp: { gte: since }, level: { in: ["error", "fatal"] } },
        _count: { _all: true },
    });

    const noisy = new Set<string>();

    for (const row of counts) {
        if (row._count._all < ERROR_THRESHOLD) continue;
        noisy.add(`${row.projectId}|${row.service}`);

        // 2. Open an incident, unless one is already open for this service
        const existing = await prisma.incident.findFirst({
            where: { projectId: row.projectId, service: row.service, status: "open" },
            select: { id: true },
        });
        if (existing) continue;

        await prisma.incident.create({
            data: {
                projectId: row.projectId,
                service: row.service,
                startedAt: new Date(),
                summary: `${row._count._all} errors from ${row.service} in the last ${WINDOW_MINUTES} minutes`,
            },
        });
        console.log(`Incident opened: ${row.service} (${row._count._all} errors)`);
    }

    // 3. Close open incidents whose service is no longer noisy
    const openIncidents = await prisma.incident.findMany({ where: { status: "open" } });
    for (const inc of openIncidents) {
        if (noisy.has(`${inc.projectId}|${inc.service}`)) continue;
        await prisma.incident.update({
            where: { id: inc.id },
            data: { status: "resolved", resolvedAt: new Date() },
        });
        console.log(`Incident resolved: ${inc.service}`);
    }
}

export function startDetector() {
    const tick = () => runDetection().catch((err) => console.error("Detector failed:", err));
    setInterval(tick, 60 * 1000);
    console.log("Incident detector started (runs every minute)");
}