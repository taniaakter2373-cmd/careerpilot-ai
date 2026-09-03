import { NextResponse } from "next/server";
import { prisma } from "@careerpilot/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const r = await prisma.recruiterInteraction.findUnique({ where: { id: params.id } });
  if (!r) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  if (typeof body.detectedStage === "string") data.detectedStage = body.detectedStage;
  if (typeof body.status === "string") data.status = body.status;
  if (typeof body.nextAction === "string") data.nextAction = body.nextAction;
  if (body.nextActionDate) data.nextActionDate = new Date(String(body.nextActionDate));
  if (typeof body.actionRequired === "boolean") data.actionRequired = body.actionRequired;
  if (typeof body.notes === "string") data.notes = body.notes;
  if (body.lastContactAt) data.lastContactAt = new Date(String(body.lastContactAt));

  const updated = await prisma.recruiterInteraction.update({ where: { id: params.id }, data });
  return NextResponse.json({ id: updated.id, detectedStage: updated.detectedStage, status: updated.status, actionRequired: updated.actionRequired });
}
