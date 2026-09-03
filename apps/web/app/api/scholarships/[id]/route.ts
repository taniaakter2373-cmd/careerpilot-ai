import { NextResponse } from "next/server";
import { prisma } from "@careerpilot/database";
import { serializeProgramme } from "../../_lib/scholarship";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const programme = await prisma.erasmusProgramme.findUnique({ where: { id: params.id }, include: { matches: true } });
  if (!programme) return NextResponse.json({ error: "PROGRAMME_NOT_FOUND" }, { status: 404 });
  return NextResponse.json(serializeProgramme(programme));
}
