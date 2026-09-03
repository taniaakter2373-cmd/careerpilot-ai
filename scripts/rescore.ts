import { PrismaClient } from "@prisma/client";
import { scoreJob, isHrRole, type CandidateForMatching, type JobForMatching } from "@careerpilot/matching";
import { evaluateEligibility, scholarshipRecommendation, scoreScholarshipMatch, weightedScore, type ProgrammeRequirements, type ScholarshipApplicant } from "@careerpilot/shared";

const p = new PrismaClient();
const parseJson = (s: string | null) => (s ? JSON.parse(s) : []);

async function main() {
  const cand = await p.candidateProfile.findFirst({ include: { skills: true } });
  if (!cand) throw new Error("no candidate");
  const c: CandidateForMatching = {
    currentTitle: cand.currentTitle,
    yearsExperience: cand.yearsExperience,
    skills: cand.skills.map((s) => s.name),
    targetRoles: parseJson(cand.targetRoles),
    industries: [],
    preferredLocations: parseJson(cand.preferredLocations),
    education: cand.education,
    salaryExpectation: { min: cand.salaryMin, currency: cand.salaryCurrency },
    careerGoals: parseJson(cand.careerGoals),
  };

  // Re-score jobs
  const jobs = await p.job.findMany({ include: { matches: true } });
  let jn = 0;
  for (const j of jobs) {
    const job: JobForMatching = {
      title: j.title, company: j.company, location: j.location, country: j.country, industry: j.industry,
      salaryMin: j.salaryMin, salaryMax: j.salaryMax, salaryCurrency: j.salaryCurrency,
      skills: parseJson(j.skills), requirements: parseJson(j.requirements),
      educationRequirements: parseJson(j.educationRequirements), experienceRequired: j.experienceRequired,
    };
    const m = scoreJob(c, job);
    const status = m.hardRequirementFailure ? "MATCHED" : m.action === "SKIP" ? "MATCHED" : "MATCHED";
    await p.jobMatch.upsert({
      where: { jobId: j.id },
      update: {
        overallScore: m.overallScore, breakdown: JSON.stringify(m.breakdown), weights: JSON.stringify(m.weights),
        whyMatched: JSON.stringify(m.whyMatched), missingRequirements: JSON.stringify(m.missingRequirements),
        riskFlags: JSON.stringify(m.riskFlags), recommendation: m.recommendation, action: m.action,
        hardRequirementFailure: m.hardRequirementFailure, targetCompanyBonus: m.targetCompanyBonus,
      },
      create: { jobId: j.id, overallScore: m.overallScore, breakdown: JSON.stringify(m.breakdown), weights: JSON.stringify(m.weights),
        whyMatched: JSON.stringify(m.whyMatched), missingRequirements: JSON.stringify(m.missingRequirements),
        riskFlags: JSON.stringify(m.riskFlags), recommendation: m.recommendation, action: m.action,
        hardRequirementFailure: m.hardRequirementFailure, targetCompanyBonus: m.targetCompanyBonus },
    });
    jn++;
  }

  // Re-score scholarships
  const sp = await p.scholarshipProfile.findFirst();
  const applicant: ScholarshipApplicant = {
    hasBachelorsDegree: sp?.academicDegrees ? parseJson(sp.academicDegrees).length > 0 : null,
    fieldOfStudy: sp?.preferredStudyFields ? parseJson(sp.preferredStudyFields).join(", ") : null,
    cgpa: sp?.cgpa ?? null, ieltsScore: sp?.ieltsScore ?? null, toeflScore: sp?.toeflScore ?? null,
    yearsExperience: cand.yearsExperience, nationality: sp?.nationality ?? null,
    hasPassport: sp?.passportStatus ? String(sp.passportStatus).toUpperCase() === "VALID" : null,
    leadershipExperience: sp?.leadershipExperience ?? null, internationalExperience: sp?.internationalExperience ?? null,
  };
  const progs = await p.erasmusProgramme.findMany({ include: { matches: true } });
  let pn = 0;
  for (const pg of progs) {
    let req: ProgrammeRequirements = { requiresBachelors: null, requiredField: pg.field, minCgpa: null, minIelts: null, minToefl: null, minYearsExperience: null };
    try { if (pg.eligibility) req = JSON.parse(pg.eligibility); } catch {}
    const elig = evaluateEligibility(applicant, req);
    const comps = scoreScholarshipMatch(applicant, req, elig);
    const overall = weightedScore(comps);
    await p.scholarshipMatch.upsert({
      where: { programmeId: pg.id },
      update: { overallScore: overall, breakdown: JSON.stringify(comps), eligibilityStatus: elig.status, recommendation: scholarshipRecommendation(overall), eligibilityGaps: JSON.stringify(elig.hardFailures) },
      create: { programmeId: pg.id, overallScore: overall, breakdown: JSON.stringify(comps), weights: JSON.stringify({ academic: 0.2, career: 0.2, subject: 0.2, experience: 0.15, eligibility: 0.1, language: 0.05, leadership: 0.05, mobility: 0.05 }), whyFits: "[]", eligibilityGaps: JSON.stringify(elig.hardFailures), documentGaps: "[]", priorityScore: overall, eligibilityStatus: elig.status, recommendation: scholarshipRecommendation(overall) },
    });
    pn++;
  }

  console.log(`rescored jobs=${jn} scholarships=${pn}`);
  await p.$disconnect();
}
main();
