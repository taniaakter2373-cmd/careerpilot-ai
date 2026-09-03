import { NextResponse } from "next/server";
import { prisma } from "@careerpilot/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const apps = await prisma.schoolApplication.findMany({ orderBy: { createdAt: "desc" }, include: { school: true } });
  return NextResponse.json(
    apps.map((a) => ({
      id: a.id,
      schoolId: a.schoolId,
      schoolName: a.school?.schoolName ?? null,
      country: a.school?.country ?? null,
      city: a.school?.city ?? null,
      status: a.status,
      applicationDate: a.applicationDate,
      deadline: a.deadline,
      confirmationNumber: a.confirmationNumber,
      createdAt: a.createdAt,
    })),
  );
}

// Create a school application (RESEARCHING) for the child
export async function POST(req: Request) {
  const { schoolId } = (await req.json().catch(() => ({}))) as { schoolId?: string };
  if (!schoolId) return NextResponse.json({ error: "schoolId is required" }, { status: 400 });

  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  if (!school) return NextResponse.json({ error: "SCHOOL_NOT_FOUND" }, { status: 404 });

  const child = await prisma.childProfile.findFirst();

  const app = await prisma.schoolApplication.create({
    data: {
      schoolId,
      childId: child?.id ?? null,
      status: "RESEARCHING",
      notes: "Verify admission requirements and fees with the school",
    },
  });

  return NextResponse.json({
    id: app.id,
    schoolId: app.schoolId,
    status: app.status,
    schoolName: school.schoolName,
    website: school.website,
  });
}
