import { NextResponse } from "next/server";
import { prisma } from "@careerpilot/database";
import { getApplicant, buildMotivationLetter } from "../../../_lib/scholarship";
import { getUserId } from "../../../_lib/jwt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const programme = await prisma.erasmusProgramme.findUnique({ where: { id: params.id } });
  if (!programme) return NextResponse.json({ error: "PROGRAMME_NOT_FOUND" }, { status: 404 });

  const userId = await getUserId(req);
  const result = await getApplicant(userId ?? undefined);
  if (!result) return NextResponse.json({ error: "MISSING_SCHOLARSHIP_PROFILE" }, { status: 400 });

  return NextResponse.json({ draft: true, content: buildMotivationLetter(programme, result.profile) });
}
