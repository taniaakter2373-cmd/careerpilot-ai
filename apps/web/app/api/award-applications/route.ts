import { NextResponse } from "next/server";
import { prisma } from "@careerpilot/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const parseJson = <T = unknown[]>(s: string | null, fb: T): T => (s ? (JSON.parse(s) as T) : fb);

function serialize(a: any) {
  return {
    id: a.id,
    awardId: a.awardId,
    awardName: a.award?.name ?? null,
    organization: a.award?.organization ?? null,
    category: a.award?.category ?? null,
    officialUrl: a.award?.officialUrl ?? a.award?.applicationUrl ?? null,
    region: a.award?.region ?? null,
    profileFit: a.award?.profileFitScore ?? null,
    status: a.status,
    deadline: a.deadline,
    feeUsd: a.feeUsd,
    submissionDate: a.submissionDate,
    result: a.result,
    confirmationNumber: a.confirmationNumber,
    notes: a.notes,
  };
}

export async function GET() {
  const apps = await prisma.awardApplication.findMany({ orderBy: { createdAt: "desc" }, include: { award: true } });
  return NextResponse.json(apps.map(serialize));
}

export async function POST(req: Request) {
  const { awardId } = (await req.json().catch(() => ({}))) as { awardId?: string };
  if (!awardId) return NextResponse.json({ error: "awardId is required" }, { status: 400 });

  const award = await prisma.award.findUnique({ where: { id: awardId } });
  if (!award) return NextResponse.json({ error: "AWARD_NOT_FOUND" }, { status: 404 });

  const existing = await prisma.awardApplication.findFirst({
    where: { awardId, status: { notIn: ["NOT_SELECTED"] } },
    include: { award: true },
  });
  if (existing) return NextResponse.json(serialize(existing));

  const app = await prisma.awardApplication.create({
    data: {
      awardId,
      status: "SHORTLISTED",
      deadline: award.deadline,
      feeUsd: award.entryFeeUsd,
      notes: "Shortlisted from the Global Award Finder. Nomination drafts never fabricate achievements — [Evidence Required] placeholders are inserted where data is missing.",
    },
    include: { award: true },
  });
  return NextResponse.json(serialize(app));
}
