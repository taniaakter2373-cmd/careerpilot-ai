import { NextResponse } from "next/server";
import { prisma } from "@careerpilot/database";
import { getUserId } from "../_lib/jwt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const parseJson = (s: string | null) => (s ? (JSON.parse(s) as string[]) : []);

function serializeProfile(p: any) {
  const skills = p.skills?.map((s: any) => s.name) ?? [];
  return {
    id: p.id,
    name: p.name,
    email: p.email,
    phone: p.phone,
    location: p.location,
    country: p.country,
    currentTitle: p.currentTitle,
    yearsExperience: p.yearsExperience,
    education: p.education,
    summary: p.summary,
    noticePeriod: p.noticePeriod,
    linkedinUrl: p.linkedinUrl,
    portfolioUrl: p.portfolioUrl,
    salaryMin: p.salaryMin,
    salaryCurrency: p.salaryCurrency,
    remotePreference: p.remotePreference,
    employmentPreference: p.employmentPreference,
    certifications: parseJson(p.certifications),
    targetRoles: parseJson(p.targetRoles),
    preferredLocations: parseJson(p.preferredLocations),
    careerGoals: parseJson(p.careerGoals),
    skills,
  };
}

export async function GET(req: Request) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.candidateProfile.findUnique({ where: { userId }, include: { skills: true } });
  if (!profile) return NextResponse.json(null);
  return NextResponse.json(serializeProfile(profile));
}

export async function PUT(req: Request) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Record<string, any>;
  const profile = await prisma.candidateProfile.findUnique({ where: { userId } });
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const updated = await prisma.candidateProfile.update({
    where: { userId },
    data: {
      name: body.name,
      email: body.email,
      phone: body.phone,
      location: body.location,
      country: body.country,
      currentTitle: body.currentTitle,
      yearsExperience: body.yearsExperience,
      education: body.education,
      summary: body.summary,
      noticePeriod: body.noticePeriod,
      linkedinUrl: body.linkedinUrl,
      portfolioUrl: body.portfolioUrl,
      salaryMin: body.salaryMin,
      salaryCurrency: body.salaryCurrency,
      remotePreference: body.remotePreference,
      employmentPreference: body.employmentPreference,
      certifications: body.certifications ? JSON.stringify(body.certifications) : undefined,
      targetRoles: body.targetRoles ? JSON.stringify(body.targetRoles) : undefined,
      preferredLocations: body.preferredLocations ? JSON.stringify(body.preferredLocations) : undefined,
      careerGoals: body.careerGoals ? JSON.stringify(body.careerGoals) : undefined,
    },
    include: { skills: true },
  });

  if (body.skills) {
    await prisma.candidateSkill.deleteMany({ where: { profileId: profile.id } });
    await prisma.candidateSkill.createMany({ data: body.skills.map((n: string) => ({ profileId: profile.id, name: n })) });
  }

  return NextResponse.json(
    serializeProfile({ ...updated, skills: body.skills ? body.skills.map((n: string) => ({ name: n })) : updated.skills }),
  );
}
