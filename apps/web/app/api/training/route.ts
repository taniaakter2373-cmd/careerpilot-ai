import { NextResponse } from "next/server";
import { prisma } from "@careerpilot/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FUNDING_LABEL: Record<string, string> = {
  FULLY: "🟢 Fully funded",
  MOSTLY: "🟢 Mostly funded",
  PARTIALLY: "🟡 Partially funded",
  TUITION_ONLY: "🟠 Tuition only",
  FREE_NOT_FUNDED: "⚪ Free training — not funded",
  SELF: "🔴 Self-funded",
  UNVERIFIED: "⚪ Funding not confirmed",
};

const PRIORITY_LABEL: Record<string, string> = {
  APPLY_NOW: "🔥 Apply now",
  HIGH: "🟢 High",
  WATCHLIST: "🟡 Watchlist",
  NOT_SUITABLE: "🔴 Not suitable",
};

const ASSESS_LABEL: Record<string, string> = {
  HIGH_MATCH: "🟢 HIGH MATCH",
  MEDIUM_MATCH: "🟡 MEDIUM MATCH",
  LOW_MATCH: "🔴 LOW MATCH",
  NOT_ELIGIBLE: "❌ NOT ELIGIBLE",
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const mode = url.searchParams.get("mode");
  const funding = url.searchParams.get("funding");
  const priority = url.searchParams.get("priority");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (mode) where.mode = mode;
  if (funding) where.fundingLevel = funding;
  if (priority) where.priority = priority;

  const rows = await prisma.trainingProgram.findMany({
    where,
    orderBy: [{ matchScore: "desc" }],
  });

  const list = rows.map((r) => ({
    id: r.id,
    name: r.name,
    organization: r.organization,
    country: r.country,
    city: r.city,
    mode: r.mode,
    hrRelevance: r.hrRelevance,
    rewardRelevance: r.rewardRelevance,
    durationText: r.durationText,
    nextCycleNote: r.nextCycleNote,
    deadline: r.deadline,
    fundingLevel: r.fundingLevel,
    fundingLabel: FUNDING_LABEL[r.fundingLevel] ?? r.fundingLevel,
    fundingScore: r.fundingScore,
    coversAirfare: r.coversAirfare,
    coversAccommodation: r.coversAccommodation,
    coversMeals: r.coversMeals,
    coversVisa: r.coversVisa,
    stipendNote: r.stipendNote,
    fundingTerms: r.fundingTerms,
    ieltsRequired: r.ieltsRequired,
    englishEvidenceNote: r.englishEvidenceNote,
    privateSectorEligible: r.privateSectorEligible,
    govtNominationRequired: r.govtNominationRequired,
    experienceRequired: r.experienceRequired,
    nationalityNote: r.nationalityNote,
    officialUrl: r.officialUrl,
    applicationUrl: r.applicationUrl,
    status: r.status,
    matchScore: r.matchScore,
    priority: r.priority,
    priorityLabel: PRIORITY_LABEL[r.priority] ?? r.priority,
    assessment: r.assessment,
    assessmentLabel: ASSESS_LABEL[r.assessment] ?? r.assessment,
    source: r.source,
    sourceLastChecked: r.sourceLastChecked,
    notes: r.notes,
  }));

  return NextResponse.json(list);
}
