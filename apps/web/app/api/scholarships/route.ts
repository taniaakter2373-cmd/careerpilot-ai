import { NextResponse } from "next/server";
import { prisma } from "@careerpilot/database";
import { serializeProgramme } from "../_lib/scholarship";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const minScore = Number(url.searchParams.get("minScore") ?? 70);
  // Default: show scholarships that match your profile (>= 70%) with eligibility badges.
  const eligibleOnly = url.searchParams.get("eligible") === "true";
  const where = {
    matches: {
      some: {
        ...(eligibleOnly ? { eligibilityStatus: { in: ["ELIGIBLE", "LIKELY_ELIGIBLE"] }, recommendation: { notIn: ["LOW_PRIORITY", "NOT_RECOMMENDED"] } } : {}),
        overallScore: { gte: minScore },
      },
    },
  };
  const programmes = await prisma.erasmusProgramme.findMany({ where, include: { matches: true }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(programmes.map(serializeProgramme));
}

export async function POST() {
  const programmes = await prisma.erasmusProgramme.findMany({ include: { matches: true }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(programmes.map(serializeProgramme));
}
