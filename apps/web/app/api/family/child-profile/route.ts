import { NextResponse } from "next/server";
import { prisma } from "@careerpilot/database";
import { computeChildAge } from "@careerpilot/shared";
import { getUserId } from "../../_lib/jwt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function serialize(c: any) {
  return {
    id: c.id,
    fullName: c.fullName,
    dateOfBirth: c.dateOfBirth,
    age: computeChildAge(c.dateOfBirth ? c.dateOfBirth.toISOString() : null),
    nationality: c.nationality,
    passportStatus: c.passportStatus,
    currentSchool: c.currentSchool,
    currentGrade: c.currentGrade,
    language: c.language,
    specialSchoolingRequirements: c.specialSchoolingRequirements,
    preferredSchoolingLanguage: c.preferredSchoolingLanguage,
    preferredCurriculum: c.preferredCurriculum,
    preferredCountry: c.preferredCountry,
    preferredCity: c.preferredCity,
  };
}

export async function GET(req: Request) {
  const userId = await getUserId(req);
  const child = await prisma.childProfile.findFirst({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(child ? serialize(child) : null);
}

export async function PUT(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, any>;
  const child = await prisma.childProfile.findFirst();
  if (!child) {
    const created = await prisma.childProfile.create({
      data: {
        fullName: body.fullName ?? "Child",
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
        nationality: body.nationality ?? null,
        passportStatus: body.passportStatus ?? null,
        currentSchool: body.currentSchool ?? null,
        currentGrade: body.currentGrade ?? null,
        language: body.language ?? null,
        specialSchoolingRequirements: body.specialSchoolingRequirements ?? null,
        preferredSchoolingLanguage: body.preferredSchoolingLanguage ?? null,
        preferredCurriculum: body.preferredCurriculum ?? null,
        preferredCountry: body.preferredCountry ?? null,
        preferredCity: body.preferredCity ?? null,
      },
    });
    return NextResponse.json(serialize(created));
  }
  const updated = await prisma.childProfile.update({
    where: { id: child.id },
    data: {
      fullName: body.fullName,
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
      nationality: body.nationality,
      passportStatus: body.passportStatus,
      currentSchool: body.currentSchool,
      currentGrade: body.currentGrade,
      language: body.language,
      specialSchoolingRequirements: body.specialSchoolingRequirements,
      preferredSchoolingLanguage: body.preferredSchoolingLanguage,
      preferredCurriculum: body.preferredCurriculum,
      preferredCountry: body.preferredCountry,
      preferredCity: body.preferredCity,
    },
  });
  return NextResponse.json(serialize(updated));
}
