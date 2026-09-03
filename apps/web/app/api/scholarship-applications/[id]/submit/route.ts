import { NextResponse } from "next/server";
import { prisma } from "@careerpilot/database";
import { getApplicant } from "../../../_lib/scholarship";
import { documentChecklist } from "../../../_lib/scholarship-documents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const app = await prisma.scholarshipApplication.findUnique({ where: { id: params.id } });
  if (!app) return NextResponse.json({ error: "SCHOLARSHIP_APPLICATION_NOT_FOUND" }, { status: 404 });
  if (app.status !== "APPROVED") {
    return NextResponse.json({ error: "APPROVAL_REQUIRED", message: "Application must be approved before submission" }, { status: 409 });
  }

  const programme = await prisma.erasmusProgramme.findUnique({ where: { id: app.programmeId } });
  const applicant = await getApplicant();
  const checklist = programme ? documentChecklist(programme, applicant?.profile ?? null) : [];
  const missingDocs = checklist.filter((d) => d.status === "MISSING");

  if (missingDocs.length > 0) {
    return NextResponse.json(
      {
        error: "MISSING_DOCUMENTS",
        message: "Application cannot be submitted until missing documents are resolved.",
        missingDocuments: missingDocs.map((d) => d.type),
      },
      { status: 409 },
    );
  }

  const confirmationNumber = `EMJM-${Date.now().toString(36).toUpperCase()}`;
  const updated = await prisma.scholarshipApplication.update({
    where: { id: params.id },
    data: { status: "SUBMITTED", confirmationNumber, applicationDate: new Date(), nextAction: "Track status on the official programme portal" },
  });
  return NextResponse.json({ id: updated.id, status: updated.status, confirmationNumber });
}
