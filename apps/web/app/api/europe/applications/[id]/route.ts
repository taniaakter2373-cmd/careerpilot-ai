import { NextResponse } from "next/server";
import { prisma } from "@careerpilot/database";
import { EUROPE_APP_STATUS_FLOW, serializeEuropeApplication } from "../../../_lib/europe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = (await req.json().catch(() => ({}))) as {
    status?: string;
    nextAction?: string;
    notes?: string;
    recruiterName?: string;
    recruiterEmail?: string;
    interviewDate?: string | null;
    followUpDate?: string | null;
  };

  const app = await prisma.europeApplication.findUnique({ where: { id: params.id }, include: { europeJob: true } });
  if (!app) return NextResponse.json({ error: "APPLICATION_NOT_FOUND" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (body.status) {
    if (body.status !== app.status) {
      const allowed = EUROPE_APP_STATUS_FLOW[app.status] ?? [];
      if (!allowed.includes(body.status)) {
        return NextResponse.json({ error: "INVALID_STATE", message: `Cannot move from ${app.status} to ${body.status}` }, { status: 409 });
      }
    }
    data.status = body.status;
  }
  if (body.nextAction !== undefined) data.nextAction = body.nextAction;
  if (body.notes !== undefined) data.notes = body.notes;
  if (body.recruiterName !== undefined) data.recruiterName = body.recruiterName;
  if (body.recruiterEmail !== undefined) data.recruiterEmail = body.recruiterEmail;
  if (body.interviewDate !== undefined) data.interviewDate = body.interviewDate ? new Date(body.interviewDate) : null;
  if (body.followUpDate !== undefined) data.followUpDate = body.followUpDate ? new Date(body.followUpDate) : null;
  if (body.status === "APPLIED" && !data.applicationDate) data.applicationDate = new Date();

  const updated = await prisma.europeApplication.update({ where: { id: params.id }, data, include: { europeJob: true } });
  if (updated.status === "APPLIED") {
    await prisma.europeJob.update({ where: { id: updated.europeJobId }, data: { status: "APPLIED" } }).catch(() => {});
  }
  return NextResponse.json(serializeEuropeApplication(updated));
}
