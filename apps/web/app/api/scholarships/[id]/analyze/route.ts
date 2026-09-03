import { NextResponse } from "next/server";
import { prisma } from "@careerpilot/database";
import {
  calculatePriorityScore,
  evaluateEligibility,
  scholarshipRecommendation,
  scoreScholarshipMatch,
  weightedScore,
  type ProgrammeRequirements,
} from "@careerpilot/shared";
import { getApplicant } from "../../../_lib/scholarship";
import { getUserId } from "../../../_lib/jwt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const programme = await prisma.erasmusProgramme.findUnique({ where: { id: params.id } });
  if (!programme) return NextResponse.json({ error: "PROGRAMME_NOT_FOUND" }, { status: 404 });

  const userId = await getUserId(req);
  const result = await getApplicant(userId ?? undefined);
  if (!result) return NextResponse.json({ error: "MISSING_SCHOLARSHIP_PROFILE" }, { status: 400 });
  const { applicant } = result;

  let requirements: ProgrammeRequirements = { requiresBachelors: null, requiredField: programme.field, minCgpa: null, minIelts: null, minToefl: null, minYearsExperience: null };
  try {
    if (programme.eligibility) requirements = JSON.parse(programme.eligibility) as ProgrammeRequirements;
  } catch {
    /* keep defaults */
  }

  const eligibility = evaluateEligibility(applicant, requirements);
  const components = scoreScholarshipMatch(applicant, requirements, eligibility);
  const overall = weightedScore(components);
  const priority = calculatePriorityScore({
    match: overall,
    scholarshipAvailable: programme.scholarshipAvailable,
    eligibilityConfidence: eligibility.status === "ELIGIBLE" ? 100 : eligibility.status === "LIKELY_ELIGIBLE" ? 85 : eligibility.status === "UNCERTAIN" ? 60 : 0,
    careerAlignment: components.career,
    deadlineFeasibility: programme.applicationDeadline ? 90 : 50,
  });

  await prisma.scholarshipMatch.upsert({
    where: { programmeId: params.id },
    update: {
      overallScore: overall,
      breakdown: JSON.stringify(components),
      priorityScore: priority,
      eligibilityStatus: eligibility.status,
      recommendation: scholarshipRecommendation(overall),
      eligibilityGaps: JSON.stringify(eligibility.hardFailures),
    },
    create: {
      programmeId: params.id,
      overallScore: overall,
      breakdown: JSON.stringify(components),
      weights: JSON.stringify({ academic: 0.2, career: 0.2, subject: 0.2, experience: 0.15, eligibility: 0.1, language: 0.05, leadership: 0.05, mobility: 0.05 }),
      whyFits: JSON.stringify([]),
      eligibilityGaps: JSON.stringify(eligibility.hardFailures),
      documentGaps: JSON.stringify([]),
      priorityScore: priority,
      eligibilityStatus: eligibility.status,
      recommendation: scholarshipRecommendation(overall),
    },
  });

  return NextResponse.json({ programmeId: params.id, overallScore: overall, breakdown: components, eligibility, priorityScore: priority, recommendation: scholarshipRecommendation(overall) });
}
