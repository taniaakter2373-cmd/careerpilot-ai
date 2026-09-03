import { NextResponse } from "next/server";
import { prisma } from "@careerpilot/database";
import {
  childCanAccompanyScore,
  familyRecommendation,
  getCountryFamily,
  parentJobStatus,
  hrCareerOpportunity,
  isFreePathway,
  finalFamilyFeasibility,
  familyFeasibilityScore,
  familyVerdict,
  type FamilyAssessmentInput,
  type FinalFamilyComponent,
} from "@careerpilot/shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function serialize(a: any) {
  return {
    id: a.id,
    programmeId: a.programmeId,
    country: a.country,
    studyScore: a.studyScore,
    fundingScore: a.fundingScore,
    childScore: a.childScore,
    schoolingScore: a.schoolingScore,
    costScore: a.costScore,
    visaScore: a.visaScore,
    safetyScore: a.safetyScore,
    longTermScore: a.longTermScore,
    parentWorkScore: a.parentWorkScore,
    parentJobsScore: a.parentJobsScore,
    overallScore: a.overallScore,
    recommendation: a.recommendation,
    childStatus: a.childStatus,
    workRightsNote: a.workRightsNote,
    source: a.source,
    createdAt: a.createdAt,
  };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const freeOnly = url.searchParams.get("free") === "true";

  const assessments = await prisma.familyAssessment.findMany({ orderBy: { overallScore: "desc" } });
  const enriched = await Promise.all(
    assessments.map(async (a) => {
      const programme = await prisma.erasmusProgramme.findUnique({ where: { id: a.programmeId } });
      const cf = getCountryFamily(a.country);
      const parentWork = parentJobStatus(cf, true);
      const hrCareer = hrCareerOpportunity(a.country);
      const schoolingFreeOrLowCost = cf?.schooling.feeLevel === "FREE" || cf?.schooling.feeLevel === "LOW_COST";
      const childCanAccompany = ["CONFIRMED", "LIKELY"].includes(a.childStatus ?? "");
      const studyFunded = a.fundingScore >= 85;
      const freePathway = isFreePathway({
        studyFunded,
        schoolingFreeOrLowCost,
        childCanAccompany,
        parentCanWork: parentWork === "LEGALLY_AVAILABLE",
      });
      return {
        ...serialize(a),
        programmeName: programme?.programmeName ?? null,
        acronym: programme?.acronym ?? null,
        hrCareerScore: hrCareer,
        freePathway,
      };
    }),
  );
  const results = freeOnly ? enriched.filter((e) => e.freePathway) : enriched;
  return NextResponse.json(results);
}

// Compute family + parent-work feasibility for every eligible/strong scholarship programme
export async function POST() {
  const programmes = await prisma.erasmusProgramme.findMany({ include: { matches: true } });
  const child = await prisma.childProfile.findFirst();

  const results = [];
  for (const p of programmes) {
    const match = p.matches?.[0];
    if (!match) continue;

    const countries = p.countries ? (JSON.parse(p.countries) as string[]) : [];
    const country = countries[0] ?? null;
    const cf = getCountryFamily(country);

    const studyScore = match.overallScore;
    const fundingScore = p.scholarshipAvailable ? 90 : 40;
    const childScore = childCanAccompanyScore(cf?.childAccompany ?? "UNCERTAIN");
    const schoolingScore =
      cf?.schooling.englishMedium === false
        ? 55
        : cf?.schooling.feeLevel === "FREE"
          ? 95
          : cf?.schooling.feeLevel === "LOW_COST"
            ? 85
            : cf?.schooling.feeLevel === "MODERATE"
              ? 70
              : cf?.schooling.feeLevel === "HIGH_COST"
                ? 45
                : 50;
    const costScore = cf?.costOfLiving ?? 50;
    const visaScore = childCanAccompanyScore(cf?.childAccompany ?? "UNCERTAIN");
    const safetyScore = cf?.safety ?? 70;
    const longTermScore = cf?.work.postStudy.jobSearchPeriod && !cf?.work.postStudy.jobSearchPeriod.toLowerCase().includes("limited") ? 85 : 60;

    const familyInput: FamilyAssessmentInput = {
      studyOpportunity: studyScore,
      funding: fundingScore,
      childAccompaniment: childScore,
      schoolingFeasibility: schoolingScore,
      totalFamilyCost: costScore,
      visaFeasibility: visaScore,
      safetyStability: safetyScore,
      longTermOpportunity: longTermScore,
    };
    const overall = familyFeasibilityScore(familyInput);
    const verdict = familyVerdict(overall);

    // Parent work + jobs
    const jobStatus = parentJobStatus(cf, true); // parent is the student
    const parentWorkScore = jobStatus === "NOT_LEGALLY_AVAILABLE" ? 0 : jobStatus === "LEGALLY_AVAILABLE" ? 85 : 50;
    const parentJobsScore = jobStatus === "NOT_LEGALLY_AVAILABLE" ? 0 : 75;

    const finalComponents: Record<FinalFamilyComponent, number> = {
      study: studyScore,
      funding: fundingScore,
      parentWork: parentWorkScore,
      parentJobs: parentJobsScore,
      childVisa: childScore,
      childSchooling: schoolingScore,
      familyCost: costScore,
      language: cf?.schooling.englishMedium ? 80 : 50,
      longTermCareer: longTermScore,
    };
    const finalScore = finalFamilyFeasibility(finalComponents);
    const recommendation = familyRecommendation(finalScore);

    await prisma.familyAssessment.upsert({
      where: { id: `${p.id}-family` },
      update: {
        country,
        studyScore,
        fundingScore,
        childScore,
        schoolingScore,
        costScore,
        visaScore,
        safetyScore,
        longTermScore,
        parentWorkScore,
        parentJobsScore,
        overallScore: finalScore,
        recommendation,
        childStatus: cf?.childAccompany ?? "UNCERTAIN",
        workRightsNote: cf ? `${cf.work.studentWork} · up to ${cf.work.hoursPerWeek ?? "n/a"} hrs/week · ${cf.work.source}` : null,
        source: cf?.source ?? null,
      },
      create: {
        id: `${p.id}-family`,
        programmeId: p.id,
        childId: child?.id ?? null,
        country,
        studyScore,
        fundingScore,
        childScore,
        schoolingScore,
        costScore,
        visaScore,
        safetyScore,
        longTermScore,
        parentWorkScore,
        parentJobsScore,
        overallScore: finalScore,
        recommendation,
        childStatus: cf?.childAccompany ?? "UNCERTAIN",
        workRightsNote: cf ? `${cf.work.studentWork} · up to ${cf.work.hoursPerWeek ?? "n/a"} hrs/week · ${cf.work.source}` : null,
        source: cf?.source ?? null,
      },
    });

    results.push({
      programmeId: p.id,
      programmeName: p.programmeName,
      acronym: p.acronym,
      country,
      childStatus: cf?.childAccompany ?? "UNCERTAIN",
      parentWorkStatus: jobStatus,
      finalScore,
      recommendation,
      verdict,
    });
  }

  return NextResponse.json({ count: results.length, results });
}
