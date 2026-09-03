import { NextResponse } from "next/server";
import { prisma } from "@careerpilot/database";
import { costFit, curriculumFit, languageFit, schoolMatchScore, schoolRecommendation } from "@careerpilot/shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const country = url.searchParams.get("country");

  const where = country ? { country } : {};
  const schools = await prisma.school.findMany({ where, orderBy: { schoolName: "asc" } });

  const child = await prisma.childProfile.findFirst();
  const preferredCurriculum = child?.preferredCurriculum ?? "International";

  const feeLevel = (f: string | null): "FREE" | "LOW_COST" | "MODERATE" | "HIGH_COST" | "UNKNOWN" => {
    const s = (f ?? "").toLowerCase();
    if (s.includes("free")) return "FREE";
    if (s.includes("confirmation")) return "UNKNOWN";
    if (s.includes("moderate")) return "MODERATE";
    if (s.includes("high")) return "HIGH_COST";
    return "UNKNOWN";
  };

  const withMatch = schools.map((s) => {
    const components = {
      curriculum: curriculumFit(s.curriculum, preferredCurriculum),
      language: languageFit(s.language),
      ageGrade: s.ageRange ? 90 : 50,
      cost: costFit(feeLevel(s.tuitionFee)),
      location: 85,
      admission: 70,
    };
    const score = schoolMatchScore(components);
    return {
      id: s.id,
      schoolName: s.schoolName,
      country: s.country,
      city: s.city,
      curriculum: s.curriculum,
      language: s.language,
      ageRange: s.ageRange,
      tuitionFee: s.tuitionFee,
      admissionRequirement: s.admissionRequirement,
      website: s.website,
      matchScore: score,
      recommendation: schoolRecommendation(score),
    };
  });

  return NextResponse.json(withMatch.sort((a, b) => b.matchScore - a.matchScore));
}
