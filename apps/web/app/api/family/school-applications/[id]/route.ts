import { NextResponse } from "next/server";
import { prisma } from "@careerpilot/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const app = await prisma.schoolApplication.findUnique({ where: { id: params.id }, include: { school: true } });
  if (!app) return NextResponse.json({ error: "SCHOOL_APPLICATION_NOT_FOUND" }, { status: 404 });
  return NextResponse.json({
    id: app.id,
    schoolId: app.schoolId,
    schoolName: app.school?.schoolName ?? null,
    country: app.school?.country ?? null,
    city: app.school?.city ?? null,
    curriculum: app.school?.curriculum ?? null,
    website: app.school?.website ?? null,
    tuitionFee: app.school?.tuitionFee ?? null,
    status: app.status,
    applicationDate: app.applicationDate,
    deadline: app.deadline,
    notes: app.notes,
    confirmationNumber: app.confirmationNumber,
  });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const app = await prisma.schoolApplication.findUnique({ where: { id: params.id } });
  if (!app) return NextResponse.json({ error: "SCHOOL_APPLICATION_NOT_FOUND" }, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const updated = await prisma.schoolApplication.update({
    where: { id: params.id },
    data: { status: typeof body.status === "string" ? body.status : undefined, notes: typeof body.notes === "string" ? body.notes : undefined },
  });
  return NextResponse.json({ id: updated.id, status: updated.status });
}
