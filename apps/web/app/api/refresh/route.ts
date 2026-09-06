import { NextResponse } from "next/server";
import { prisma } from "@careerpilot/database";
import {
  computeDuplicateHash,
  JobSourceRegistry,
  defaultSources,
  normalizeJob,
  type JobCriteria,
} from "@careerpilot/job-sources";
import { isBlockedCompany, isHrRole, scoreJob, type CandidateForMatching, type JobForMatching } from "@careerpilot/matching";
import {
  evaluateEligibility,
  scholarshipRecommendation,
  scoreScholarshipMatch,
  weightedScore,
  type ProgrammeRequirements,
  type ScholarshipApplicant,
} from "@careerpilot/shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const parseJson = (s: string | null) => (s ? JSON.parse(s) : []);

async function refreshUmrah() {
  let updated = 0;
  try {
    const res = await fetch("https://www.umrah.com.bd/umrah-packages-from-bangladesh", {
      headers: { "User-Agent": "Mozilla/5.0 (CareerPilot refresh)" },
      signal: AbortSignal.timeout(20000),
    });
    const html = await res.text();
    const prices = [...html.matchAll(/BDT\s*([\d,]{5,})/g)].map((m) => m[1]);
    if (prices.length > 0) {
      const range = `Live prices refreshed: from BDT ${prices[0]}`;
      const existing = await prisma.umrahOpportunity.findMany({ where: { sponsor: "umrah.com.bd" } });
      for (const o of existing) {
        await prisma.umrahOpportunity.update({ where: { id: o.id }, data: { verificationDate: new Date(), notes: `${range} · verified ${new Date().toISOString().slice(0, 10)}` } });
        updated++;
      }
    }
  } catch {
    /* source unavailable — keep last data */
  }
  return updated;
}

async function rescoreJobsAndScholarships(cand: CandidateForMatching) {
  const jobs = await prisma.job.findMany({ include: { matches: true } });
  for (const j of jobs) {
    const job: JobForMatching = {
      title: j.title, company: j.company, location: j.location, country: j.country, industry: j.industry,
      salaryMin: j.salaryMin, salaryMax: j.salaryMax, salaryCurrency: j.salaryCurrency,
      skills: parseJson(j.skills), requirements: parseJson(j.requirements),
      educationRequirements: parseJson(j.educationRequirements), experienceRequired: j.experienceRequired,
    };
    const m = scoreJob(cand, job);
    await prisma.jobMatch.upsert({
      where: { jobId: j.id },
      update: { overallScore: m.overallScore, breakdown: JSON.stringify(m.breakdown), recommendation: m.recommendation, action: m.action, hardRequirementFailure: m.hardRequirementFailure },
      create: { jobId: j.id, overallScore: m.overallScore, breakdown: JSON.stringify(m.breakdown), weights: JSON.stringify(m.weights), whyMatched: "[]", missingRequirements: "[]", riskFlags: "[]", recommendation: m.recommendation, action: m.action, hardRequirementFailure: m.hardRequirementFailure, targetCompanyBonus: false },
    });
  }
  return jobs.length;
}

export async function GET() {
  const cand = await prisma.candidateProfile.findFirst({ include: { skills: true } });
  const c: CandidateForMatching | null = cand
    ? {
        currentTitle: cand.currentTitle,
        yearsExperience: cand.yearsExperience,
        skills: cand.skills.map((s) => s.name),
        targetRoles: parseJson(cand.targetRoles),
        industries: [],
        preferredLocations: parseJson(cand.preferredLocations),
        education: cand.education,
        salaryExpectation: { min: cand.salaryMin, currency: cand.salaryCurrency },
        careerGoals: parseJson(cand.careerGoals),
      }
    : null;

  // 1. Refresh live Umrah packages
  const umrahUpdated = await refreshUmrah();

  // 2. Re-run job discovery (add new, dedupe) using reachable sources
  let jobsFound = 0;
  let jobsAdded = 0;
  if (c) {
    const registry = new JobSourceRegistry();
    // Live international sources (EU/UK/USA/global remote) + Bdjobs opt-in —
    // no demo data. Keeps scores current and pulls new listings on cron.
    for (const source of defaultSources({ ENABLE_BDJOBS: process.env.ENABLE_BDJOBS })) {
      registry.register(source);
    }
    const criteria: JobCriteria = { keywords: [], roles: c.targetRoles, locations: [], countries: c.preferredLocations };
    const { jobs: rawJobs, results } = await registry.search(criteria);
    jobsFound = rawJobs.length;
    const existing = await prisma.job.findMany({ select: { url: true, duplicateHash: true } });
    const urls = new Set(existing.map((j) => j.url));
    const hashes = new Set(existing.map((j) => j.duplicateHash).filter(Boolean) as string[]);
    for (const raw of rawJobs) {
      const job = normalizeJob(raw);
      if (isBlockedCompany(job.company) || !isHrRole(job.title)) continue;
      if (urls.has(job.url) || hashes.has(computeDuplicateHash(job))) continue;
      const m = scoreJob(c, job);
      await prisma.job.create({
        data: {
          source: job.source, sourceJobId: job.sourceJobId, url: job.url, title: job.title, company: job.company,
          location: job.location, country: job.country, city: job.city, remoteType: job.remoteType, employmentType: job.employmentType,
          industry: job.industry, department: job.department, salaryMin: job.salaryMin, salaryMax: job.salaryMax, salaryCurrency: job.salaryCurrency,
          description: job.description, requirements: JSON.stringify(job.requirements), responsibilities: JSON.stringify(job.responsibilities),
          educationRequirements: JSON.stringify(job.educationRequirements), experienceRequired: job.experienceRequired, skills: JSON.stringify(job.skills),
          applicationMethod: job.applicationMethod, applicationUrl: job.applicationUrl, duplicateHash: computeDuplicateHash(job), status: "MATCHED",
          matches: { create: { overallScore: m.overallScore, breakdown: JSON.stringify(m.breakdown), weights: JSON.stringify(m.weights), whyMatched: JSON.stringify(m.whyMatched), missingRequirements: JSON.stringify(m.missingRequirements), riskFlags: JSON.stringify(m.riskFlags), recommendation: m.recommendation, action: m.action, hardRequirementFailure: m.hardRequirementFailure, targetCompanyBonus: false } },
        },
      });
      jobsAdded++;
    }
  }

  // 3. Re-score all jobs + scholarships
  const rescoredJobs = c ? await rescoreJobsAndScholarships(c) : 0;

  // scholarships re-score
  const sp = await prisma.scholarshipProfile.findFirst();
  const applicant: ScholarshipApplicant | null = sp
    ? {
        hasBachelorsDegree: sp.academicDegrees ? parseJson(sp.academicDegrees).length > 0 : null,
        fieldOfStudy: sp.preferredStudyFields ? parseJson(sp.preferredStudyFields).join(", ") : null,
        cgpa: sp.cgpa, ieltsScore: sp.ieltsScore, toeflScore: sp.toeflScore,
        yearsExperience: cand?.yearsExperience ?? null, nationality: sp.nationality,
        hasPassport: sp.passportStatus ? String(sp.passportStatus).toUpperCase() === "VALID" : null,
        leadershipExperience: sp.leadershipExperience, internationalExperience: sp.internationalExperience,
      }
    : null;
  let scholarshipsRescored = 0;
  if (applicant) {
    const progs = await prisma.erasmusProgramme.findMany();
    for (const pg of progs) {
      let req: ProgrammeRequirements = { requiresBachelors: null, requiredField: pg.field, minCgpa: null, minIelts: null, minToefl: null, minYearsExperience: null };
      try { if (pg.eligibility) req = JSON.parse(pg.eligibility); } catch {}
      const elig = evaluateEligibility(applicant, req);
      const comps = scoreScholarshipMatch(applicant, req, elig);
      const overall = weightedScore(comps);
      await prisma.scholarshipMatch.upsert({
        where: { programmeId: pg.id },
        update: { overallScore: overall, eligibilityStatus: elig.status, recommendation: scholarshipRecommendation(overall) },
        create: { programmeId: pg.id, overallScore: overall, breakdown: JSON.stringify(comps), weights: JSON.stringify({ academic: 0.2, career: 0.2, subject: 0.2, experience: 0.15, eligibility: 0.1, language: 0.05, leadership: 0.05, mobility: 0.05 }), whyFits: "[]", eligibilityGaps: JSON.stringify(elig.hardFailures), documentGaps: "[]", priorityScore: overall, eligibilityStatus: elig.status, recommendation: scholarshipRecommendation(overall) },
      });
      scholarshipsRescored++;
    }
  }

  return NextResponse.json({
    refreshedAt: new Date().toISOString(),
    umrahPackagesRefreshed: umrahUpdated,
    jobsFound,
    jobsAdded,
    jobsRescored: rescoredJobs,
    scholarshipsRescored,
  });
}
