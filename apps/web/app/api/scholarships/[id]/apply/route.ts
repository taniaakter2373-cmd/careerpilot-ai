import { NextResponse } from "next/server";
import { prisma } from "@careerpilot/database";
import { getApplicant, buildMotivationLetter, buildSop } from "../../../_lib/scholarship";
import { getUserId } from "../../../_lib/jwt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const programme = await prisma.erasmusProgramme.findUnique({ where: { id: params.id } });
  if (!programme) return NextResponse.json({ error: "PROGRAMME_NOT_FOUND" }, { status: 404 });

  const userId = await getUserId(req);
  const result = await getApplicant(userId ?? undefined);
  const profile = result?.profile ?? null;

  // Generate motivation letter + SOP (real, tailored, clearly-labeled drafts)
  const motivationLetter = profile ? buildMotivationLetter(programme, profile) : "";
  const sop = profile ? buildSop(programme, profile) : "";
  const notes = JSON.stringify({ motivationLetter, sop });

  const application = await prisma.scholarshipApplication.create({
    data: {
      programmeId: params.id,
      candidateId: profile?.id ?? null,
      status: "RESEARCHING",
      deadline: programme.applicationDeadline,
      scholarshipDeadline: programme.scholarshipDeadline,
      applicationUrl: programme.applicationUrl ?? programme.officialUrl,
      notes,
      nextAction: "Complete missing documents, review motivation letter & SOP",
    },
  });

  return NextResponse.json({
    id: application.id,
    programmeId: application.programmeId,
    status: application.status,
    applicationUrl: application.applicationUrl,
    motivationLetter,
    sop,
  });
}
