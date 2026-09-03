import { NextResponse } from "next/server";
import { prisma } from "@careerpilot/database";
import { logAudit } from "../../../_lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const app = await prisma.application.findUnique({ where: { id: params.id } });
  if (!app) return NextResponse.json({ error: "APPLICATION_NOT_FOUND" }, { status: 404 });
  if (app.status !== "PREPARED") return NextResponse.json({ error: "INVALID_STATE", message: `Cannot approve from ${app.status}` }, { status: 409 });

  const updated = await prisma.application.update({ where: { id: params.id }, data: { status: "APPROVED" } });
  await logAudit({ jobId: app.jobId, action: "USER_APPROVED", oldStatus: "PREPARED", newStatus: "APPROVED", result: "OK" });
  return NextResponse.json({ id: updated.id, status: updated.status });
}
