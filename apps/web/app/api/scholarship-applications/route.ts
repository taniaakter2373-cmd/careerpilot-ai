import { NextResponse } from "next/server";
import { prisma } from "@careerpilot/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const applications = await prisma.scholarshipApplication.findMany({ orderBy: { createdAt: "desc" } });
  const enriched = await Promise.all(
    applications.map(async (a) => {
      const programme = await prisma.erasmusProgramme.findUnique({ where: { id: a.programmeId } });
      return { ...a, programmeName: programme?.programmeName ?? a.programmeId, acronym: programme?.acronym ?? null };
    }),
  );
  return NextResponse.json(enriched);
}
