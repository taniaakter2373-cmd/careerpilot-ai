// Load real Qatar HR jobs from Bayt.com into the hosted Postgres (scored against profile).
// Run: DATABASE_URL="<hosted-url>" npx tsx scripts/load-qatar.ts
import { PrismaClient } from "@prisma/client";
import { scoreJob, isBlockedCompany, type CandidateForMatching, type JobForMatching } from "@careerpilot/matching";
import { computeDuplicateHash } from "@careerpilot/job-sources";

const prisma = new PrismaClient();

const ROWS: { title: string; url: string }[] = [
  { title: "HR Officer", url: "https://www.bayt.com/en/qatar/jobs/hr-officer-5472068/" },
  { title: "HR & Admin Supervisor", url: "https://www.bayt.com/en/qatar/jobs/hr-admin-supervisor-5468240/" },
  { title: "Lead HR Separations Officer", url: "https://www.bayt.com/en/qatar/jobs/lead-hr-separations-officer-75035882/" },
  { title: "Human Resources Coordinator", url: "https://www.bayt.com/en/qatar/jobs/human-resources-coordinator-75018306/" },
  { title: "Talent & Culture Coordinator - QHR", url: "https://www.bayt.com/en/qatar/jobs/talent-culture-coordinator-qhr-74960687/" },
  { title: "HR & Admin Manager", url: "https://www.bayt.com/en/qatar/jobs/hr-admin-manager-74275201/" },
  { title: "HR & Admin Officer", url: "https://www.bayt.com/en/qatar/jobs/hr-admin-officer-74274484/" },
  { title: "Talent Acquisition Specialist", url: "https://www.bayt.com/en/qatar/jobs/talent-acquisition-specialist-75054879/" },
  { title: "School HR Manager", url: "https://www.bayt.com/en/qatar/jobs/school-hr-manager-75055666/" },
  { title: "HRIS Team Leader", url: "https://www.bayt.com/en/qatar/jobs/hris-team-leader-75055361/" },
  { title: "Human Resources Executive", url: "https://www.bayt.com/en/qatar/jobs/human-resources-executive-75036160/" },
  { title: "Assistant Human Resources Manager", url: "https://www.bayt.com/en/qatar/jobs/assistant-human-resources-manager-75008168/" },
  { title: "Talent Acquisition Specialist", url: "https://www.bayt.com/en/qatar/jobs/talent-acquisition-specialist-74812741/" },
  { title: "Recruitment Director", url: "https://www.bayt.com/en/qatar/jobs/recruitment-director-74793284/" },
  { title: "Learning and Development & Recruitment Officer", url: "https://www.bayt.com/en/qatar/jobs/learning-and-development-recruitment-officer-74737888/" },
  { title: "HR Manager", url: "https://www.bayt.com/en/qatar/jobs/hr-manager-74274625/" },
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
      title: r.title, company: "Bayt.com", location: "Qatar", country: "Qatar",
      industry: null, salaryMin: null, salaryMax: null, salaryCurrency: null,
      skills: ["HR", "Human Resources", "Talent Acquisition", "Compensation & Benefits"], requirements: [], educationRequirements: [], experienceRequired: null,
      description: `${r.title}\nQatar`, url: r.url, deadline: null,
    };
    const hash = computeDuplicateHash(job);
    const m = scoreJob(c, job);
    if (m.overallScore < 70) { dupes++; continue; } // only pull profile matches >= 70%
    await prisma.job.create({
      data: {
        source: "bayt", sourceJobId: r.url.split("/").filter(Boolean).pop() ?? null, url: r.url,
        title: r.title, company: "Bayt.com", location: "Qatar", country: "Qatar", city: "Qatar",
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
  console.log(`Loaded Qatar jobs: added=${added}, dupes=${dupes}`);
  await prisma.$disconnect();
}
main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
