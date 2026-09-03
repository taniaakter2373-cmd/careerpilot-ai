// Load REAL international (Gulf/Middle East) HR jobs from Bayt.com into the hosted Postgres.
// Run: DATABASE_URL="<hosted-url>" npx tsx scripts/load-international-jobs.ts
import { PrismaClient } from "@prisma/client";
import { scoreJob, isBlockedCompany, type CandidateForMatching, type JobForMatching } from "@careerpilot/matching";
import { computeDuplicateHash } from "@careerpilot/job-sources";

const prisma = new PrismaClient();

// Real international jobs from Bayt.com (public job board, Middle East)
// source: https://www.bayt.com/en/jobs/?keywords=HR+Manager
const JOBS: { title: string; company: string; location: string; country: string; url: string }[] = [
  { title: "HR Manager", company: "Mander Restaurant and Cafe LLC", location: "Dubai", country: "UAE", url: "https://www.bayt.com/en/uae/jobs/hr-manager-5477734/" },
  { title: "Head Recruitment", company: "PRISTINE CONSULTANCY FZE", location: "Dubai", country: "UAE", url: "https://www.bayt.com/en/uae/jobs/head-recruitment-5477756/" },
  { title: "HR Specialist", company: "Afaqy", location: "Saudi Arabia", country: "Saudi Arabia", url: "https://www.bayt.com/en/saudi-arabia/jobs/hr-specialist-5477185/" },
  { title: "Office Manager (Saudi national only)", company: "Black Pearl", location: "Saudi Arabia", country: "Saudi Arabia", url: "https://www.bayt.com/en/saudi-arabia/jobs/office-manager-saudi-national-only-5477746/" },
  { title: "Marketing Manager - Talentera and Evalufy", company: "Bayt.com", location: "Dubai", country: "UAE", url: "https://www.bayt.com/en/uae/jobs/marketing-manager-talentera-and-evalufy-5477761/" },
  { title: "Group Chief Executive Officer (GCEO)", company: "Confidential Company", location: "Qatar", country: "Qatar", url: "https://www.bayt.com/en/qatar/jobs/group-chief-executive-officer-gceo-5477410/" },
  { title: "Front-of-House (FOH) Manager", company: "Mander Restaurant and Cafe LLC", location: "Dubai", country: "UAE", url: "https://www.bayt.com/en/uae/jobs/front-of-house-foh-manager-5477735/" },
  { title: "Sales Administration Assistant", company: "VizioTek Technology Systems", location: "Dubai", country: "UAE", url: "https://www.bayt.com/en/uae/jobs/sales-administration-assistant-5477363/" },
  { title: "Manager, Financial Planning & Analysis (FP&A)", company: "Anera", location: "Jordan", country: "Jordan", url: "https://www.bayt.com/en/jordan/jobs/manager-financial-planning-analysis-fp-a-5477755/" },
  { title: "Senior Manager, Financial Planning & Analysis", company: "Anera", location: "Jordan", country: "Jordan", url: "https://www.bayt.com/en/jordan/jobs/senior-manager-financial-planning-analysis-5477753/" },
  { title: "Senior Project Manager", company: "Confidential Company", location: "Jordan", country: "Jordan", url: "https://www.bayt.com/en/jordan/jobs/senior-project-manager-5477757/" },
  { title: "Quantity Surveyor", company: "IKK Group of Companies", location: "Dubai", country: "UAE", url: "https://www.bayt.com/en/uae/jobs/quantity-surveyor-5477713/" },
];

async function main() {
  const candidate = await prisma.candidateProfile.findFirst({ include: { skills: true } });
  if (!candidate) throw new Error("No candidate profile");

  const cand: CandidateForMatching = {
    currentTitle: candidate.currentTitle,
    yearsExperience: candidate.yearsExperience,
    skills: candidate.skills.map((s) => s.name),
    targetRoles: JSON.parse(candidate.targetRoles ?? "[]"),
    industries: [],
    preferredLocations: JSON.parse(candidate.preferredLocations ?? "[]"),
    education: candidate.education,
    salaryExpectation: { min: candidate.salaryMin, currency: candidate.salaryCurrency },
    careerGoals: JSON.parse(candidate.careerGoals ?? "[]"),
  };

  let added = 0, dupes = 0;
  for (const j of JOBS) {
    if (isBlockedCompany(j.company)) { dupes++; continue; }
    const existing = await prisma.job.findUnique({ where: { url: j.url } });
    if (existing) { dupes++; continue; }

    const job: JobForMatching & { url: string; deadline: null } = {
      title: j.title,
      company: j.company,
      location: j.location,
      country: j.country,
      industry: null,
      salaryMin: null,
      salaryMax: null,
      salaryCurrency: null,
      skills: ["HR", "Human Resources", "Compensation & Benefits"],
      requirements: [],
      educationRequirements: [],
      experienceRequired: null,
      description: `${j.title}\n${j.company}\n${j.location}, ${j.country}`,
      url: j.url,
      deadline: null,
    };

    const hash = computeDuplicateHash(job);
    const match = scoreJob(cand, job);
    await prisma.job.create({
      data: {
        source: "bayt",
        sourceJobId: j.url.split("/").filter(Boolean).pop() ?? null,
        url: j.url,
        title: j.title,
        company: j.company,
        location: j.location,
        country: j.country,
        city: j.location,
        remoteType: "ANY",
        employmentType: "FULL_TIME",
        industry: null,
        department: null,
        salaryMin: null,
        salaryMax: null,
        salaryCurrency: null,
        description: job.description,
        requirements: JSON.stringify([]),
        responsibilities: JSON.stringify([]),
        educationRequirements: JSON.stringify([]),
        experienceRequired: null,
        skills: JSON.stringify(job.skills),
        applicationMethod: "MANUAL",
        applicationUrl: j.url,
        duplicateHash: hash,
        status: "MATCHED",
        matches: {
          create: {
            overallScore: match.overallScore,
            breakdown: JSON.stringify(match.breakdown),
            weights: JSON.stringify(match.weights),
            whyMatched: JSON.stringify(match.whyMatched),
            missingRequirements: JSON.stringify(match.missingRequirements),
            riskFlags: JSON.stringify(match.riskFlags),
            recommendation: match.recommendation,
            action: match.action,
            hardRequirementFailure: match.hardRequirementFailure,
            targetCompanyBonus: false,
          },
        },
      },
    });
    added++;
  }
  console.log(`Loaded international jobs: added=${added}, dupes=${dupes}`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
