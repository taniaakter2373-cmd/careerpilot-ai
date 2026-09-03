import { NextResponse } from "next/server";
import { prisma } from "@careerpilot/database";
import { getApplicant } from "../../_lib/scholarship";
import { documentChecklist } from "../../_lib/scholarship-documents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const app = await prisma.scholarshipApplication.findUnique({ where: { id: params.id } });
  if (!app) return NextResponse.json({ error: "SCHOLARSHIP_APPLICATION_NOT_FOUND" }, { status: 404 });

  const programme = await prisma.erasmusProgramme.findUnique({ where: { id: app.programmeId } });
  const applicant = await getApplicant();
  const profile = applicant?.profile ?? null;

  let motivationLetter = "";
  let sop = "";
  try {
    const notes = app.notes ? JSON.parse(app.notes) : {};
    motivationLetter = notes.motivationLetter ?? "";
    sop = notes.sop ?? "";
  } catch {
    /* ignore */
  }

  const checklist = programme ? documentChecklist(programme, profile) : [];
  const missingDocs = checklist.filter((d) => d.status === "MISSING");

  return NextResponse.json({
    id: app.id,
    programmeId: app.programmeId,
    status: app.status,
    deadline: app.deadline,
    scholarshipDeadline: app.scholarshipDeadline,
    applicationUrl: app.applicationUrl,
    confirmationNumber: app.confirmationNumber,
    nextAction: app.nextAction,
    programme: programme
      ? {
          name: programme.programmeName,
          acronym: programme.acronym,
          field: programme.field,
          website: programme.officialUrl,
          scholarshipAvailable: programme.scholarshipAvailable,
          deadlineStatus: programme.deadlineStatus,
        }
      : null,
    motivationLetter,
    sop,
    documents: checklist,
    missingDocuments: missingDocs.map((d: { type: string }) => d.type),
  });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const app = await prisma.scholarshipApplication.findUnique({ where: { id: params.id } });
  if (!app) return NextResponse.json({ error: "SCHOLARSHIP_APPLICATION_NOT_FOUND" }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const allowed = ["status", "notes", "nextAction", "confirmationNumber"];
  const data: Record<string, unknown> = {};
  for (const k of allowed) if (k in body) data[k] = body[k];

  const updated = await prisma.scholarshipApplication.update({ where: { id: params.id }, data });
  return NextResponse.json({ id: updated.id, status: updated.status, nextAction: updated.nextAction });
}
