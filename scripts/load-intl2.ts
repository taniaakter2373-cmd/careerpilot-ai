// Load real Saudi Arabia + Qatar HR jobs from Bayt.com into the hosted Postgres.
// Run: DATABASE_URL="<hosted-url>" npx tsx scripts/load-intl2.ts
import { PrismaClient } from "@prisma/client";
import { scoreJob, isBlockedCompany, type CandidateForMatching, type JobForMatching } from "@careerpilot/matching";
import { computeDuplicateHash } from "@careerpilot/job-sources";

const prisma = new PrismaClient();

const ROWS: { title: string; country: string; url: string }[] = [
  { title: "HR Specialist", country: "Saudi Arabia", url: "https://www.bayt.com/en/saudi-arabia/jobs/hr-specialist-5477185/" },
  { title: "HR Admin", country: "Saudi Arabia", url: "https://www.bayt.com/en/saudi-arabia/jobs/hr-admin-5476487/" },
  { title: "HC Officer", country: "Saudi Arabia", url: "https://www.bayt.com/en/saudi-arabia/jobs/hc-officer-5476073/" },
  { title: "HR Generalist", country: "Saudi Arabia", url: "https://www.bayt.com/en/saudi-arabia/jobs/hr-generalist-5475387/" },
  { title: "Human Resources Supervisor", country: "Saudi Arabia", url: "https://www.bayt.com/en/saudi-arabia/jobs/human-resources-supervisor-5472167/" },
  { title: "Human Resources Specialist", country: "Saudi Arabia", url: "https://www.bayt.com/en/saudi-arabia/jobs/human-resources-specialist-5471421/" },
  { title: "Staff HR Administrator", country: "Saudi Arabia", url: "https://www.bayt.com/en/saudi-arabia/jobs/staff-hr-administrator-5467623/" },
  { title: "HR Generalist", country: "Saudi Arabia", url: "https://www.bayt.com/en/saudi-arabia/jobs/hr-generalist-5467187/" },
  { title: "HR Operations Specialist", country: "Saudi Arabia", url: "https://www.bayt.com/en/saudi-arabia/jobs/hr-operations-specialist-5465811/" },
  { title: "HR Manager", country: "Saudi Arabia", url: "https://www.bayt.com/en/saudi-arabia/jobs/hr-manager-5472732/" },
  { title: "Manager, HR Operations", country: "Saudi Arabia", url: "https://www.bayt.com/en/saudi-arabia/jobs/manager-hr-operations-5471572/" },
  { title: "Senior HR Specialist", country: "Saudi Arabia", url: "https://www.bayt.com/en/saudi-arabia/jobs/senior-hr-specialist-74980394/" },
  { title: "Tahreez/Riyadh-Senior HR Generalist", country: "Saudi Arabia", url: "https://www.bayt.com/en/saudi-arabia/jobs/tahreez-riyadh-senior-hr-generalist-74994354/" },
  { title: "Human Resources Lead", country: "Saudi Arabia", url: "https://www.bayt.com/en/saudi-arabia/jobs/human-resources-lead-74908918/" },
  { title: "Cluster Director of Human Resources", country: "Saudi Arabia", url: "https://www.bayt.com/en/saudi-arabia/jobs/cluster-director-of-human-resources-74967784/" },
  { title: "Human Resources Coordinator", country: "Saudi Arabia", url: "https://www.bayt.com/en/saudi-arabia/jobs/human-resources-coordinator-saudi-candidates-only-75012667/" },
  { title: "HR Officer (Part Time) - Riyadh", country: "Saudi Arabia", url: "https://www.bayt.com/en/saudi-arabia/jobs/hr-officer-part-time-riyadh-74995629/" },
  { title: "Human Resources and Administrative Affairs Manager", country: "Saudi Arabia", url: "https://www.bayt.com/en/saudi-arabia/jobs/hr-and-admin-manager-5473007/" },
  { title: "Human Resources Officer", country: "Saudi Arabia", url: "https://www.bayt.com/en/saudi-arabia/jobs/human-resources-officer-5472230/" },
  { title: "HR Manager", country: "Saudi Arabia", url: "https://www.bayt.com/en/saudi-arabia/jobs/hr-manager-5477692/" },
];

async function main() {
  const cand = await prisma.candidateProfile.findFirst({ include: { skills: true } });
  if (!cand) throw new Error("no candidate");
  const c: CandidateForMatching = {
    currentTitle: cand.currentTitle,
    yearsExperience: cand.yearsExperience,
    skills: cand.skills.map((s) => s.name),
    targetRoles: JSON.parse(cand.targetRoles ?? "[]"),
    industries: [],
    preferredLocations: JSON.parse(cand.preferredLocations ?? "[]"),
    education: cand.education,
    salaryExpectation: { min: cand.salaryMin, currency: cand.salaryCurrency },
    careerGoals: JSON.parse(cand.careerGoals ?? "[]"),
  };

  let added = 0, dupes = 0;
  for (const r of ROWS) {
    if (isBlockedCompany(r.title)) { dupes++; continue; }
    const existing = await prisma.job.findUnique({ where: { url: r.url } });
    if (existing) { dupes++; continue; }
    const job: JobForMatching & { url: string; deadline: null } = {
      title: r.title, company: "Bayt.com", location: r.country, country: r.country,
      industry: null, salaryMin: null, salaryMax: null, salaryCurrency: null,
      skills: ["HR", "Human Resources"], requirements: [], educationRequirements: [], experienceRequired: null,
      description: `${r.title}\n${r.country}`, url: r.url, deadline: null,
    };
    const hash = computeDuplicateHash(job);
    const m = scoreJob(c, job);
    await prisma.job.create({
      data: {
        source: "bayt", sourceJobId: r.url.split("/").filter(Boolean).pop() ?? null, url: r.url,
        title: r.title, company: "Bayt.com", location: r.country, country: r.country, city: r.country,
        remoteType: "ANY", employmentType: "FULL_TIME", industry: null, department: null,
        salaryMin: null, salaryMax: null, salaryCurrency: null, description: job.description,
        requirements: "[]", responsibilities: "[]", educationRequirements: "[]", experienceRequired: null,
        skills: JSON.stringify(job.skills), applicationMethod: "MANUAL", applicationUrl: r.url,
        duplicateHash: hash, status: "MATCHED",
        matches: { create: { overallScore: m.overallScore, breakdown: JSON.stringify(m.breakdown), weights: JSON.stringify(m.weights), whyMatched: JSON.stringify(m.whyMatched), missingRequirements: JSON.stringify(m.missingRequirements), riskFlags: JSON.stringify(m.riskFlags), recommendation: m.recommendation, action: m.action, hardRequirementFailure: m.hardRequirementFailure, targetCompanyBonus: false } },
      },
    });
    added++;
  }
  console.log(`Loaded international jobs: added=${added}, dupes=${dupes}`);
  await prisma.$disconnect();
}
main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
