import { NextResponse } from "next/server";
import { prisma } from "@careerpilot/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function serialize(a: any) {
  return {
    id: a.id,
    certificationId: a.certificationId,
    certificationName: a.certification?.name ?? null,
    provider: a.certification?.provider ?? null,
    category: a.certification?.category ?? null,
    url: a.certification?.url ?? null,
    finalCostUsd: a.certification?.finalCostUsd ?? null,
    costClass: a.certification?.costClass ?? null,
    status: a.status,
    applicationDate: a.applicationDate,
    deadline: a.deadline,
    notes: a.notes,
    confirmationNumber: a.confirmationNumber,
  };
}

export async function GET() {
  const apps = await prisma.certificationApplication.findMany({ orderBy: { createdAt: "desc" }, include: { certification: true } });
  return NextResponse.json(apps.map(serialize));
}

// Prepare a certification application (idempotent — reuse if pending)
export async function POST(req: Request) {
  const { certificationId } = (await req.json().catch(() => ({}))) as { certificationId?: string };
  if (!certificationId) return NextResponse.json({ error: "certificationId is required" }, { status: 400 });
  const cert = await prisma.certification.findUnique({ where: { id: certificationId } });
  if (!cert) return NextResponse.json({ error: "CERTIFICATION_NOT_FOUND" }, { status: 404 });

  const existing = await prisma.certificationApplication.findFirst({ where: { certificationId, status: { in: ["RESEARCHING", "PREPARING", "READY_FOR_REVIEW", "APPROVED"] } } });
  if (existing) return NextResponse.json(serialize(existing));

  const app = await prisma.certificationApplication.create({
    data: { certificationId, status: "PREPARING", deadline: cert.applicationDeadline, notes: "Application prepared. Final enrolment/payment requires USER_APPROVAL — never automated." },
    include: { certification: true },
  });
  return NextResponse.json(serialize(app));
}
