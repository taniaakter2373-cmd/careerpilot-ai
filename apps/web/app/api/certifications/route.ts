import { NextResponse } from "next/server";
import { prisma } from "@careerpilot/database";
import { CERT_COST_EMOJI, CERT_COST_LABEL, certMatchScore, certCost, profileFitFromSkills, roadmapBucket } from "@careerpilot/shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const parseJson = (s: string | null) => (s ? JSON.parse(s) : []);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const freeOnly = url.searchParams.get("free") === "1";
  const costClass = url.searchParams.get("cost"); // FREE | FULL_SCHOLARSHIP | LOW_COST | DISCOUNTED | EXPENSIVE

  const where: Record<string, unknown> = {};
  if (costClass) where.costClass = costClass;
  if (freeOnly) where.costClass = { in: ["FREE", "FULL_SCHOLARSHIP", "LOW_COST"] };

  const certs = await prisma.certification.findMany({ where, orderBy: { matchScore: "desc" } });
  const list = certs.map((c) => ({
    id: c.id,
    name: c.name,
    provider: c.provider,
    category: c.category,
    url: c.url,
    originalCostUsd: c.originalCostUsd,
    scholarshipPct: c.scholarshipPct,
    finalCostUsd: c.finalCostUsd,
    durationWeeks: c.durationWeeks,
    mode: c.mode,
    recognition: c.recognition,
    matchScore: c.matchScore,
    costClass: c.costClass,
    costLabel: CERT_COST_LABEL[c.costClass as keyof typeof CERT_COST_LABEL],
    costEmoji: CERT_COST_EMOJI[c.costClass as keyof typeof CERT_COST_EMOJI],
    skills: parseJson(c.skills),
    roadmap: roadmapBucket(c.matchScore, ["FREE", "FULL_SCHOLARSHIP", "LOW_COST"].includes(c.costClass)),
    notes: c.notes,
    source: c.source,
  }));
  return NextResponse.json(list);
}
