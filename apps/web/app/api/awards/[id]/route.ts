import { NextResponse } from "next/server";
import { prisma } from "@careerpilot/database";
import { loadAwardProfile, scoreAwardsRows } from "../../_lib/awards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const award = await prisma.award.findUnique({ where: { id: params.id }, include: { applications: true } });
  if (!award) return NextResponse.json({ error: "AWARD_NOT_FOUND" }, { status: 404 });

  const profile = await loadAwardProfile();
  const scored = profile ? await scoreAwardsRows([award as any], profile) : [];
  const s = scored[0];

  return NextResponse.json({
    id: award.id,
    name: award.name,
    organization: award.organization,
    region: award.region,
    country: award.country,
    category: award.category,
    year: award.year,
    description: award.description,
    eligibility: award.eligibility,
    officialUrl: award.officialUrl,
    applicationUrl: award.applicationUrl,
    entryFeeUsd: award.entryFeeUsd,
    feeNote: award.feeNote,
    deadline: award.deadline,
    deadlineStatus: award.deadlineStatus,
    nominationType: award.nominationType,
    judgingCriteria: award.judgingCriteria,
    evidenceRequired: award.evidenceRequired,
    source: award.source,
    sourceLastChecked: award.sourceLastChecked,
    eligibilityScore: s?.eligibilityScore ?? award.eligibilityScore,
    profileFitScore: s?.profileFitScore ?? award.profileFitScore,
    evidenceStrength: s?.evidenceStrength ?? award.evidenceScore,
    competitive: s?.competitive ?? award.competitive,
    competitiveLabel: s?.competitiveLabel ?? award.competitive,
    awardPriority: s?.awardPriority ?? award.awardPriority,
    awardPriorityLabel: s?.awardPriorityLabel ?? award.awardPriority,
    recommendedAction: s?.recommendedAction ?? award.recommendedAction,
    missingEvidence: s?.missingEvidence ?? [],
    applications: award.applications.map((a) => ({
      id: a.id,
      status: a.status,
      submissionDate: a.submissionDate,
      result: a.result,
      confirmationNumber: a.confirmationNumber,
    })),
    disclaimer:
      "Award fit and competitive position are AI-generated assessments based on available criteria and documented achievements. They do not guarantee nomination, finalist status or winning.",
  });
}
