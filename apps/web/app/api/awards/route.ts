import { NextResponse } from "next/server";
import { prisma } from "@careerpilot/database";
import { loadAwardProfile, scoreAwardsRows, type ScoredAward } from "../_lib/awards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const region = url.searchParams.get("region");
  const priority = url.searchParams.get("priority");
  const category = url.searchParams.get("category");

  const where: Record<string, unknown> = {};
  if (region) where.region = region;
  if (priority) where.awardPriority = priority;
  if (category) where.category = category;

  const rows = await prisma.award.findMany({ where, orderBy: { awardPriority: "asc" } });
  const profile = await loadAwardProfile();
  if (!profile) return NextResponse.json([]);
  const scored = await scoreAwardsRows(rows as any, profile);
  // Persist computed scores back so list/filter stays stable.
  await Promise.all(
    scored.map((s: ScoredAward) =>
      prisma.award.update({
        where: { id: s.id },
        data: {
          eligibilityScore: s.eligibilityScore,
          profileFitScore: s.profileFitScore,
          evidenceScore: s.evidenceStrength,
          competitive: s.competitive,
          awardPriority: s.awardPriority,
          recommendedAction: s.recommendedAction,
        },
      }),
    ),
  );
  const sorted = sortByPriority(scored);
  return NextResponse.json(sorted);
}

export async function POST() {
  const profile = await loadAwardProfile();
  if (!profile) return NextResponse.json({ error: "MISSING_CANDIDATE" }, { status: 400 });
  const rows = await prisma.award.findMany();
  const scored = await scoreAwardsRows(rows as any, profile);
  await Promise.all(
    scored.map((s: ScoredAward) =>
      prisma.award.update({
        where: { id: s.id },
        data: {
          eligibilityScore: s.eligibilityScore,
          profileFitScore: s.profileFitScore,
          evidenceScore: s.evidenceStrength,
          competitive: s.competitive,
          awardPriority: s.awardPriority,
          recommendedAction: s.recommendedAction,
        },
      }),
    ),
  );
  return NextResponse.json({ analyzed: scored.length });
}

const order: Record<string, number> = { APPLY_NOW: 0, HIGH_PRIORITY: 1, PREPARE_FIRST: 2, NOT_RECOMMENDED: 3 };
function sortByPriority(awards: ScoredAward[]): ScoredAward[] {
  return [...awards].sort((a, b) => (order[a.awardPriority] ?? 9) - (order[b.awardPriority] ?? 9) || b.profileFitScore - a.profileFitScore);
}
