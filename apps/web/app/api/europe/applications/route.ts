import { NextResponse } from "next/server";
import { prisma } from "@careerpilot/database";
import { serializeEuropeApplication } from "../../_lib/europe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const apps = await prisma.europeApplication.findMany({
    orderBy: { createdAt: "desc" },
    include: { europeJob: true },
  });
  return NextResponse.json(apps.map(serializeEuropeApplication));
}

export async function POST(req: Request) {
  const { europeJobId } = (await req.json().catch(() => ({}))) as { europeJobId?: string };
  if (!europeJobId) return NextResponse.json({ error: "europeJobId is required" }, { status: 400 });

  const job = await prisma.europeJob.findUnique({ where: { id: europeJobId } });
  if (!job) return NextResponse.json({ error: "EUROPE_JOB_NOT_FOUND" }, { status: 404 });

  const existing = await prisma.europeApplication.findFirst({
    where: { europeJobId, status: { notIn: ["REJECTED", "WITHDRAWN"] } },
    include: { europeJob: true },
  });
  if (existing) return NextResponse.json(serializeEuropeApplication(existing));

  const app = await prisma.europeApplication.create({
    data: {
      europeJobId,
      status: "SAVED",
      company: job.company,
      country: job.country,
      notes: "Tracked from the Europe Opportunity Finder. Applying always requires explicit user confirmation — submissions are never automated.",
    },
    include: { europeJob: true },
  });
  return NextResponse.json(serializeEuropeApplication(app));
}
