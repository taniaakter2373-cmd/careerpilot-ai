import { NextResponse } from "next/server";
import { prisma } from "@careerpilot/database";
import {
  getCountryFamily,
  parentJobStatus,
  hrCareerOpportunity,
  isFreePathway,
  familyFinancialEstimate,
  COUNTRY_HR_OPPORTUNITY,
} from "@careerpilot/shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const assessments = await prisma.familyAssessment.findMany({ orderBy: { overallScore: "desc" } });

  // Best study programme per country
  const bestByCountry = new Map<string, any>();
  for (const a of assessments) {
    if (a.country && (!bestByCountry.has(a.country) || a.overallScore > bestByCountry.get(a.country).overallScore)) {
      bestByCountry.set(a.country, a);
    }
  }

  const [schools, jobs] = await Promise.all([
    prisma.school.findMany(),
    prisma.job.findMany({ where: { status: { notIn: ["REJECTED", "DUPLICATE", "EXPIRED"] } }, select: { id: true, country: true, title: true } }),
  ]);

  const reports = [];
  for (const [country, a] of bestByCountry) {
    const programme = await prisma.erasmusProgramme.findUnique({ where: { id: a.programmeId } });
    const cf = getCountryFamily(country);
    const parentWork = parentJobStatus(cf, true);
    const hrCareer = hrCareerOpportunity(country);
    const hrJobs = jobs.filter((j) => (j.country ?? "").toLowerCase() === country.toLowerCase()).length;
    const schoolingFreeOrLowCost = cf?.schooling.feeLevel === "FREE" || cf?.schooling.feeLevel === "LOW_COST";
    const childCanAccompany = ["CONFIRMED", "LIKELY"].includes(a.childStatus ?? "");
    const studyFunded = a.fundingScore >= 85;
    const freePathway = isFreePathway({ studyFunded, schoolingFreeOrLowCost, childCanAccompany, parentCanWork: parentWork === "LEGALLY_AVAILABLE" });

    const countrySchools = schools
      .filter((s) => (s.country ?? "").toLowerCase() === country.toLowerCase())
      .slice(0, 3)
      .map((s) => ({ name: s.schoolName, city: s.city, curriculum: s.curriculum, fee: s.tuitionFee, website: s.website }));

    const finances = familyFinancialEstimate(country, { scholarshipStipend: a.fundingScore >= 85 ? 11000 : 0 });

    const riskFlags: string[] = [];
    if (parentWork === "NOT_LEGALLY_AVAILABLE") riskFlags.push("Parent cannot legally work");
    if (!childCanAccompany) riskFlags.push("Child accompaniment not confirmed");
    if (!schoolingFreeOrLowCost) riskFlags.push("Schooling may be high-cost");
    if (!studyFunded) riskFlags.push("Funding not confirmed");
    if (finances.netAnnual < 0) riskFlags.push("Estimated annual shortfall");

    reports.push({
      country,
      study: { programmeName: programme?.programmeName ?? null, acronym: programme?.acronym ?? null, scholarship: studyFunded ? "Funded" : "Verify", familyScore: a.overallScore },
      parentWork: { status: parentWork, note: cf?.work.hoursPerWeek ? `up to ${cf.work.hoursPerWeek} hrs/week` : null },
      hrCareer: { score: hrCareer, hrJobsInCountry: hrJobs },
      child: { status: a.childStatus, schooling: cf?.schooling.type ?? null, feeLevel: cf?.schooling.feeLevel ?? "UNKNOWN", freeSchooling: schoolingFreeOrLowCost },
      schools: countrySchools,
      finances: { ...finances, estimated: true, currency: "EUR" },
      freePathway,
      recommendation: a.recommendation,
      riskFlags,
      sources: [cf?.source ?? null, programme?.sourceUrl ?? null].filter(Boolean),
    });
  }

  reports.sort((a, b) => b.study.familyScore - a.study.familyScore);
  return NextResponse.json(reports);
}
