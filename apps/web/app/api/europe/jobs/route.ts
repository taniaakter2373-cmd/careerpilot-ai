import { NextResponse } from "next/server";
import { prisma } from "@careerpilot/database";
import { runEuropeScan } from "../../_lib/europe-scan";
import { serializeEuropeJob } from "../../_lib/europe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const country = url.searchParams.get("country");
  const priority = url.searchParams.get("priority");
  const ielts = url.searchParams.get("ielts"); // not_required | unknown | required
  const q = url.searchParams.get("q");

  const where: Record<string, unknown> = { status: { not: "HIDDEN" } };
  if (country) where.country = country;
  if (priority) where.jobPriority = priority;
  if (ielts === "not_required") where.ieltsStatus = "NOT_REQUIRED";
  if (ielts === "unknown") where.ieltsStatus = "UNKNOWN";
  if (ielts === "required") where.ieltsStatus = { in: ["REQUIRED_BY_EMPLOYER", "REQUIRED_FOR_VISA"] };
  if (q) where.OR = [{ title: { contains: q } }, { company: { contains: q } }];

  const jobs = await prisma.europeJob.findMany({ where, orderBy: { careerMatchScore: "desc" } });
  return NextResponse.json(jobs.map(serializeEuropeJob));
}

export async function POST() {
  const result = await runEuropeScan();
  return NextResponse.json(result);
}
