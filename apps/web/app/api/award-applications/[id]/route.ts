import { NextResponse } from "next/server";
import { prisma } from "@careerpilot/database";
import { AWARD_APP_STATUS_FLOW } from "../../_lib/europe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = (await req.json().catch(() => ({}))) as { status?: string; notes?: string; result?: string };
  const app = await prisma.awardApplication.findUnique({ where: { id: params.id }, include: { award: true } });
  if (!app) return NextResponse.json({ error: "AWARD_APPLICATION_NOT_FOUND" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (body.status && body.status !== app.status) {
    const allowed = AWARD_APP_STATUS_FLOW[app.status] ?? [];
    if (!allowed.includes(body.status)) {
      return NextResponse.json({ error: "INVALID_STATE", message: `Cannot move from ${app.status} to ${body.status}` }, { status: 409 });
    }
    data.status = body.status;
  }
  if (body.notes !== undefined) data.notes = body.notes;
  if (body.result !== undefined) data.result = body.result;
  if (body.status === "SUBMITTED") data.submissionDate = new Date();

  const updated = await prisma.awardApplication.update({ where: { id: params.id }, data, include: { award: true } });
  return NextResponse.json({
    id: updated.id,
    status: updated.status,
    submissionDate: updated.submissionDate,
    result: updated.result,
    notes: updated.notes,
  });
}
