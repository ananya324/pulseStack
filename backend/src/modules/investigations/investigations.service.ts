import { prisma } from "../../db/prisma";
import { collectEvidence } from "./retrieval";
import { askLlm } from "./llm";

export async function investigate(projectId: string, incidentId: string, question: string) {
  const incident = await prisma.incident.findFirst({ where: { id: incidentId, projectId } });
  if (!incident) return null;

  const evidence = await collectEvidence(incident);

  if (evidence.groups.length === 0) {
    return { error: "No warning or error logs found for this incident." } as const;
  }

  const evidenceText = evidence.groups
    .map(
      (g, i) =>
        `[G${i + 1}] level=${g.level}, happened ${g.count} times, ` +
        `from ${g.firstSeen.toISOString()} to ${g.lastSeen.toISOString()}\n` +
        `example message: ${g.message}`
    )
    .join("\n\n");

  const report = await askLlm(question, evidenceText);

  // Save example log ids as proof
  const evidenceIds = [...new Set(evidence.groups.flatMap((g) => g.logIds))];

  const saved = await prisma.investigation.create({
    data: { incidentId, question, report, evidence: evidenceIds },
  });

  return {
    investigation: {
      id: saved.id,
      question: saved.question,
      report: saved.report,
      evidence: evidenceIds.map(String),
      createdAt: saved.createdAt,
    },
  } as const;
}