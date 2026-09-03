import { NextResponse } from "next/server";
import { prisma } from "@careerpilot/database";
import { classifyUmrah, coveragePercent, isFullyFree, UMRAH_CLASS_EMOJI, UMRAH_CLASS_LABEL, umrahRiskLevel, umrahRecommendable, type UmrahRiskFlags, type UmrahStatus } from "@careerpilot/shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function serialize(o: any) {
  const insurance: boolean | "NOT_REQUIRED" = o.insuranceCovered === "YES" ? true : o.insuranceCovered === "NOT_REQUIRED" ? "NOT_REQUIRED" : false;
  const coverage: {
    visa: boolean;
    roundTripFlight: boolean;
    makkahHotel: boolean;
    madinahHotel: boolean;
    food: boolean;
    transport: boolean;
    insurance: boolean | "NOT_REQUIRED";
    mandatoryFees: boolean;
  } = {
    visa: o.visaCovered,
    roundTripFlight: o.flightCovered,
    makkahHotel: o.makkahHotelCovered,
    madinahHotel: o.madinahHotelCovered,
    food: o.foodCovered,
    transport: o.transportCovered,
    insurance,
    mandatoryFees: o.mandatoryFeesCovered,
  };
  const classification = classifyUmrah(coverage, o.childCovered, (o.status ?? "OPEN") as UmrahStatus);
  const fullyFree = isFullyFree(coverage);
  const risk = umrahRiskLevel(o.riskFlags ? JSON.parse(o.riskFlags) : {});
  return {
    id: o.id,
    title: o.title,
    sponsor: o.sponsor,
    officialUrl: o.officialUrl,
    announcementUrl: o.announcementUrl,
    applicationDeadline: o.applicationDeadline,
    travelPeriod: o.travelPeriod,
    eligibility: o.eligibility,
    coverage,
    childCovered: o.childCovered,
    isFullyFree: fullyFree && classification !== "EXPIRED",
    coveragePercent: Math.round(coveragePercent(coverage) * 100),
    classification,
    classificationLabel: UMRAH_CLASS_LABEL[classification],
    classificationEmoji: UMRAH_CLASS_EMOJI[classification],
    confidence: o.confidence,
    verificationDate: o.verificationDate,
    status: o.status,
    bangladeshEligible: o.bangladeshEligible,
    riskLevel: risk,
    recommendable: umrahRecommendable(risk),
    coveredExpenses: o.coveredExpenses ? JSON.parse(o.coveredExpenses) : [],
    excludedExpenses: o.excludedExpenses ? JSON.parse(o.excludedExpenses) : [],
    notes: o.notes,
    verified: fullyFree && o.confidence === "HIGH" && o.status === "OPEN" && o.riskLevel === "LOW",
  };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const strict = url.searchParams.get("strict") === "1";
  const all = await prisma.umrahOpportunity.findMany({ orderBy: { createdAt: "desc" } });
  let list = all.map(serialize);

  if (strict) {
    // Only verified fully-free opportunities (all mandatory coverage, HIGH confidence)
    list = list.filter((o) => o.isFullyFree && o.verified && o.childCovered);
  }

  return NextResponse.json(list);
}

// Add an opportunity with evidence (strictly classified — never assumed free).
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, any>;
  const c = body.coverage ?? {};

  const created = await prisma.umrahOpportunity.create({
    data: {
      title: body.title ?? "Untitled opportunity",
      sponsor: body.sponsor ?? null,
      officialUrl: body.officialUrl ?? null,
      announcementUrl: body.announcementUrl ?? null,
      applicationDeadline: body.applicationDeadline ? new Date(body.applicationDeadline) : null,
      travelPeriod: body.travelPeriod ?? null,
      eligibility: body.eligibility ?? null,
      visaCovered: c.visa === true,
      flightCovered: c.roundTripFlight === true,
      makkahHotelCovered: c.makkahHotel === true,
      madinahHotelCovered: c.madinahHotel === true,
      foodCovered: c.food === true,
      transportCovered: c.transport === true,
      insuranceCovered: c.insurance === true ? "YES" : c.insurance === "NOT_REQUIRED" ? "NOT_REQUIRED" : "NO",
      mandatoryFeesCovered: c.mandatoryFees === true,
      childCovered: body.childCovered === true,
      coveredExpenses: body.coveredExpenses ? JSON.stringify(body.coveredExpenses) : null,
      excludedExpenses: body.excludedExpenses ? JSON.stringify(body.excludedExpenses) : null,
      confidence: body.confidence ?? "LOW",
      verificationDate: new Date(),
      status: body.status ?? "OPEN",
      bangladeshEligible: body.bangladeshEligible ?? "NOT_CONFIRMED",
      riskFlags: body.riskFlags ? JSON.stringify(body.riskFlags) : null,
      notes: body.notes ?? null,
    },
  });

  return NextResponse.json(serialize(created));
}
