// Seed REAL professional certifications relevant to the user's HR/Total Rewards profile.
// Run: DATABASE_URL="<hosted-url>" npx tsx scripts/seed-certifications.ts
import { PrismaClient } from "@prisma/client";
import { certCost, certMatchScore, profileFitFromSkills } from "@careerpilot/shared";

const prisma = new PrismaClient();

const PROFILE_SKILLS = [
  "Total Rewards", "Compensation", "Benefits", "Reward", "Salary Benchmarking", "Pay Structure",
  "Performance Management", "HR Analytics", "People Analytics", "HR Business Partner", "Workforce Planning",
  "Talent Management", "HR Policy", "HR Transformation", "Job Evaluation", "Leadership", "Data Analytics",
];

// [name, provider, category, originalUsd, scholarshipPct, durationWeeks, recognition, skills, url]
const CERTS: [string, string, string, number, number, number, string, string[], string][] = [
  ["SHRM-CP / SHRM-SCP", "SHRM", "Strategic HR", 420, 0, 0, "HIGH", ["Strategic HR", "HR Leadership"], "https://www.shrm.org/"],
  ["PHR / SPHR", "HRCI", "HR", 395, 0, 0, "HIGH", ["HR", "Compensation", "Employee Relations"], "https://www.hrci.org/"],
  ["CIPD Level 5 Associate Diploma", "CIPD", "People Management", 1200, 0, 12, "HIGH", ["People Management", "HR"], "https://www.cipd.org/"],
  ["AIHR People Analytics Certification", "AIHR Academy", "People Analytics", 499, 0, 6, "HIGH", ["People Analytics", "HR Analytics"], "https://www.aihr.com/"],
  ["AIHR Compensation & Benefits Certification", "AIHR Academy", "Compensation & Benefits", 499, 0, 6, "HIGH", ["Compensation", "Benefits", "Total Rewards"], "https://www.aihr.com/"],
  ["AIHR Total Rewards Certification", "AIHR Academy", "Total Rewards", 499, 0, 6, "HIGH", ["Total Rewards", "Reward"], "https://www.aihr.com/"],
  ["WorldatWork C3P – Certified Compensation Professional", "WorldatWork", "Compensation", 650, 0, 0, "HIGH", ["Compensation", "Pay Structure", "Job Evaluation"], "https://www.worldatwork.org/"],
  ["Wharton People Analytics (Coursera)", "Wharton", "People Analytics", 49, 0, 8, "MEDIUM", ["People Analytics", "HR Analytics"], "https://www.coursera.org/specializations/people-analytics"],
  ["HR Analytics Specialization (UC Irvine)", "UC Irvine (Coursera)", "HR Analytics", 49, 0, 12, "MEDIUM", ["HR Analytics"], "https://www.coursera.org/specializations/human-resource-analytics"],
  ["AIHR HR Tech & AI in HR", "AIHR Academy", "HR Technology", 499, 0, 4, "MEDIUM", ["HR Technology", "AI in HR", "HR Automation"], "https://www.aihr.com/"],
  ["Harvard ManageMentor HR Essentials", "Harvard Business Publishing", "HR", 0, 0, 2, "MEDIUM", ["HR"], "https://www.harvardbusiness.org/"],
  ["LinkedIn Learning – People Analytics", "LinkedIn Learning", "People Analytics", 39, 0, 2, "LOW", ["People Analytics"], "https://www.linkedin.com/learning/"],
  ["Free HR Fundamentals (Coursera Audit)", "Coursera", "HR", 0, 0, 4, "LOW", ["HR"], "https://www.coursera.org/"],
  ["Strategic Human Resources Leadership (Cornell eCornell)", "Cornell ILR", "Strategic HR", 3500, 0, 6, "HIGH", ["Strategic HR", "HR Leadership"], "https://ecornell.cornell.edu/"],
  ["NUS/HR Analytics for Business", "NUS (Coursera)", "People Analytics", 49, 0, 4, "MEDIUM", ["People Analytics"], "https://www.coursera.org/"],
];

async function main() {
  let added = 0;
  for (const c of CERTS) {
    const [name, provider, category, originalUsd, scholarshipPct, durationWeeks, recognition, skills, url] = c;
    const existing = await prisma.certification.findFirst({ where: { name } });
    if (existing) continue;
    const cost = certCost(originalUsd, scholarshipPct);
    const profileMatch = profileFitFromSkills(skills, PROFILE_SKILLS);
    const matchScore = certMatchScore({
      profileMatch,
      careerGoalMatch: Math.min(100, profileMatch + 5),
      targetJobValue: profileMatch,
      internationalValue: recognition === "HIGH" ? 90 : recognition === "MEDIUM" ? 70 : 50,
      industryRecognition: recognition === "HIGH" ? 95 : recognition === "MEDIUM" ? 70 : 40,
      costAdvantage: cost.classification === "FREE" || cost.classification === "FULL_SCHOLARSHIP" ? 100 : cost.classification === "LOW_COST" ? 85 : cost.classification === "DISCOUNTED" ? 65 : 35,
    });
    await prisma.certification.create({
      data: {
        name, provider, category, url,
        originalCostUsd: originalUsd, scholarshipPct, finalCostUsd: cost.finalUsd,
        durationWeeks, mode: "ONLINE", certificateOffered: true, recognition,
        skills: JSON.stringify(skills),
        matchScore, costClass: cost.classification,
        notes: `User cost: ${cost.classification === "FREE" ? "USD 0" : `USD ${cost.finalUsd}`} (original USD ${originalUsd}).`,
        source: url,
      },
    });
    added++;
  }
  console.log(`Seeded certifications: added=${added}`);
  await prisma.$disconnect();
}
main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
