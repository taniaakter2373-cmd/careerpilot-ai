import { NextResponse } from "next/server";
import { prisma } from "@careerpilot/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const app = await prisma.certificationApplication.findUnique({ where: { id: params.id } });
  if (!app) return NextResponse.json({ error: "CERT_APPLICATION_NOT_FOUND" }, { status: 404 });
  if (!["RESEARCHING", "PREPARING", "READY_FOR_REVIEW"].includes(app.status)) {
    return NextResponse.json({ error: "INVALID_STATE", message: `Cannot approve from ${app.status}` }, { status: 409 });
  }
  const updated = await prisma.certificationApplication.update({
    where: { id: params.id },
    data: { status: "APPROVED", notes: "APPROVED. Final enrolment/payment is manual-only (USER_APPROVAL)." },
  });
  return NextResponse.json({ id: updated.id, status: updated.status });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const app = await prisma.certificationApplication.findUnique({ where: { id: params.id } });
  if (!app) return NextResponse.json({ error: "CERT_APPLICATION_NOT_FOUND" }, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  if (typeof body.status === "string") data.status = body.status;
  if (typeof body.notes === "string") data.notes = body.notes;
  const updated = await prisma.certificationApplication.update({ where: { id: params.id }, data });
  return NextResponse.json({ id: updated.id, status: updated.status });
}
