import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  calculatePriorityScore,
  evaluateEligibility,
  scholarshipRecommendation,
  scoreScholarshipMatch,
  weightedScore,
} from "@careerpilot/shared";

const prisma = new PrismaClient();

const json = (arr: string[]) => JSON.stringify(arr);

async function main() {
  console.log("Seeding CareerPilot AI database…");

  // ---- Dev user (password: changeme123 — change in production) -------------
  const passwordHash = await bcrypt.hash("changeme123", 10);
  const user = await prisma.user.upsert({
    where: { email: "tania.akter2373@gmail.com" },
    update: {},
    create: {
      email: "tania.akter2373@gmail.com",
      name: "Tania Akter",
      passwordHash,
      role: "ADMIN",
    },
  });

  const skills = [
    "Total Rewards Strategy",
    "Compensation & Benefits",
    "Salary Benchmarking",
    "Job Evaluation",
    "Pay Structure & Grade Design",
    "Incentive & Bonus Governance",
    "PF & Gratuity",
    "Internal Equity",
    "Pay Compression",
    "COLA & Market Adjustment",
    "Variable Pay",
    "CTC Analysis",
    "Payroll Management",
    "Statutory Compliance",
    "HR Budgeting & Manpower Cost",
    "Workforce Planning",
    "HR Analytics & Dashboards",
    "HR Operations",
    "HR Business Partnering",
    "Talent Acquisition",
    "Assessment Centre Design",
    "Performance Management",
    "Succession Planning",
    "Employee Engagement",
    "Employer Branding",
    "PeopleDesk",
    "iBOS ERP",
    "HRMS / HRIS",
    "MS Excel (Advanced)",
    "Google Workspace",
    "HR Process Automation",
    "n8n",
    "AI / HR Automation",
  ];

  const profile = await prisma.candidateProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      name: "Tania Akter",
      email: "tania.akter2373@gmail.com",
      phone: "01778815764",
      location: "Dhaka",
      country: "Bangladesh",
      currentTitle: "Deputy Manager, CoE – Total Rewards Lead",
      yearsExperience: 5.8,
      education: "MBA (Finance), Manarat International University — CGPA 3.69/4.00",
      summary:
        "Strategic HR professional (~5.8 years) specializing in Total Rewards, Compensation & Benefits, Talent Acquisition, and HR Analytics — leading the Reward Management & C&B Centre of Excellence at Akij Resource.",
      noticePeriod: null,
      linkedinUrl: null,
      portfolioUrl: null,
      salaryMin: null,
      salaryCurrency: "BDT",
      remotePreference: "ANY",
      employmentPreference: "FULL_TIME",
      certifications: json([
        "Advanced HR Budgeting — ENSDI (2025)",
        "HR Accounting: Human Capital Management — Ward (2020)",
        "Fire Prevention, Rescue & First Aid — FSCD (2024)",
      ]),
      targetRoles: json([
        "Manager – HR",
        "HR Manager",
        "HR Business Partner",
        "HRBP Manager",
        "Manager – Reward",
        "Manager – Compensation & Benefits",
        "Reward Manager",
        "HR Operations Manager",
        "HR Transformation Manager",
        "Senior Manager – HR",
        "Senior Manager – Reward",
        "Senior HRBP",
        "HR Analytics Manager",
        "Talent Management Manager",
      ]),
      preferredLocations: json([
        "Bangladesh",
        "UAE",
        "Saudi Arabia",
        "Qatar",
        "Malaysia",
        "Singapore",
        "UK",
        "Canada",
        "Australia",
      ]),
      careerGoals: json(["Head of HR", "CHRO-track"]),
    },
  });

  await prisma.candidateSkill.deleteMany({ where: { profileId: profile.id } });
  await prisma.candidateSkill.createMany({
    data: skills.map((name) => ({ profileId: profile.id, name })),
  });

  // ---- Demo jobs (clearly fictional companies) -----------------------------
  const jobs = [
    {
      title: "HR Manager",
      company: "Demo Group",
      location: "Dhaka, Bangladesh",
      experienceRequired: "5-8 years",
      salaryMin: 120000,
      salaryMax: 180000,
      salaryCurrency: "BDT",
      overall: 93,
      description:
        "Lead the HR function for a diversified group. Own compensation & benefits, HR operations, performance management, and HR business partnering across business units.",
      skills: ["Compensation & Benefits", "HR Business Partnering", "Payroll Management", "HR Analytics", "Performance Management"],
    },
    {
      title: "Reward Manager",
      company: "Demo Holdings",
      location: "Dhaka, Bangladesh",
      experienceRequired: "6-10 years",
      salaryMin: 150000,
      salaryMax: 220000,
      salaryCurrency: "BDT",
      overall: 95,
      description:
        "Design and govern total rewards, salary benchmarking, pay structures, incentive and bonus schemes, and HR budgeting for a large conglomerate.",
      skills: ["Total Rewards", "Salary Benchmarking", "Pay Structure Design", "Incentive Governance", "HR Budgeting"],
    },
    {
      title: "Senior HRBP",
      company: "Demo International",
      location: "Dubai, UAE",
      experienceRequired: "7-10 years",
      salaryMin: null,
      salaryMax: null,
      salaryCurrency: "USD",
      overall: 82,
      description:
        "Partner with business leadership on workforce planning, talent, and people strategy. International experience preferred.",
      skills: ["HR Business Partnering", "Workforce Planning", "Talent Management", "Organizational Design"],
    },
  ];

  for (const j of jobs) {
    const existing = await prisma.job.findFirst({ where: { title: j.title, company: j.company } });
    if (existing) continue;

    const job = await prisma.job.create({
      data: {
        source: "seed",
        sourceJobId: `seed-${j.title.replace(/\s+/g, "-").toLowerCase()}`,
        url: `https://example.com/jobs/${j.title.replace(/\s+/g, "-").toLowerCase()}`,
        title: j.title,
        company: j.company,
        location: j.location,
        country: j.location.includes("UAE") ? "UAE" : "Bangladesh",
        city: j.location.split(",")[0],
        remoteType: "ON_SITE",
        employmentType: "FULL_TIME",
        description: j.description,
        experienceRequired: j.experienceRequired,
        salaryMin: j.salaryMin,
        salaryMax: j.salaryMax,
        salaryCurrency: j.salaryCurrency,
        skills: json(j.skills),
        requirements: json([]),
        responsibilities: json([]),
        educationRequirements: json(["MBA in HR / Finance or equivalent"]),
        status: "MATCHED",
        duplicateHash: `${j.company}-${j.title}-${j.location}`.toLowerCase(),
        applicationMethod: "MANUAL",
        matches: {
          create: {
            overallScore: j.overall,
            breakdown: JSON.stringify({
              role: j.overall + 2,
              experience: j.overall - 3,
              skills: j.overall + 1,
              industry: j.overall - 8,
              location: j.location.includes("Dhaka") ? 100 : 70,
              education: 100,
              salary: j.salaryMin ? 80 : 60,
              growth: 95,
            }),
            weights: JSON.stringify({
              role: 0.25,
              experience: 0.2,
              skills: 0.2,
              industry: 0.1,
              location: 0.1,
              education: 0.05,
              salary: 0.05,
              growth: 0.05,
            }),
            whyMatched: json([
              "Strong HRBP experience",
              "Relevant Reward/C&B background",
              "HR automation exposure",
              "Experience with HRMS/ERP",
            ]),
            missingRequirements: json([]),
            riskFlags: json(["Salary not disclosed", "International experience required"]),
            recommendation: j.overall >= 90 ? "STRONG_MATCH" : "GOOD_MATCH",
            action: j.overall >= 90 ? "APPLY" : "REVIEW",
            hardRequirementFailure: false,
            targetCompanyBonus: false,
          },
        },
      },
    });
    console.log(`  + job seeded: ${j.title} @ ${j.company}`);
  }

  // ---- ScholarshipPilot: Erasmus Mundus demo programmes --------------------
  const applicant = {
    hasBachelorsDegree: true,
    fieldOfStudy: "HR / Human Resources / Management",
    cgpa: 3.69,
    ieltsScore: null as number | null,
    toeflScore: null as number | null,
    yearsExperience: 5.8,
    nationality: "Bangladeshi",
    hasPassport: null as boolean | null,
    leadershipExperience: "Lead CoE Reward; HRBP across 7 businesses",
    internationalExperience: null,
  };

  await prisma.scholarshipProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      fullName: "Tania Akter",
      nationality: "Bangladeshi",
      countryOfResidence: "Bangladesh",
      email: "tania.akter2373@gmail.com",
      phone: "01778815764",
      cgpa: 3.69,
      gradingScale: "4.0",
      academicDegrees: json(["MBA (Finance)", "BBA (Finance)"]),
      universities: json(["Manarat International University"]),
      jobTitles: json(["Deputy Manager, CoE – Total Rewards Lead"]),
      employers: json(["Akij Resource"]),
      professionalSkills: json(["Total Rewards", "Compensation & Benefits", "HR Analytics", "HR Business Partnering"]),
      leadershipExperience: "Lead CoE Reward; HRBP across 7 businesses",
      careerGoals: json(["Senior HR Leader / CHRO"]),
      preferredStudyFields: json(["HR", "Human Resource Management", "Organizational Development", "Management", "People Analytics"]),
      preferredCountries: json(["Netherlands", "Belgium", "Italy", "Germany"]),
      ieltsScore: null,
      toeflScore: null,
      passportStatus: null,
    },
  });

  const programmes = [
    {
      programmeName: "EMJM Human Resource Strategy & People Analytics (Demo)",
      acronym: "HRSPA",
      field: "HR / Human Resource Management",
      coordinator: "Demo University of Rotterdam",
      partnerUniversities: ["Demo University of Rotterdam", "Demo University of Milan", "Demo University of Leuven"],
      countries: ["Netherlands", "Belgium", "Italy"],
      degreeType: "Joint Master",
      duration: "2 years",
      ects: 120,
      requirements: { requiresBachelors: true, requiredField: "HR", minCgpa: 3.0, minIelts: 6.5, minToefl: null, minYearsExperience: 2 },
      requiredDocuments: ["CV", "Bachelor Transcript", "IELTS Certificate", "Recommendation Letter 1", "Recommendation Letter 2", "Motivation Letter"],
    },
    {
      programmeName: "EMJM International Business & Organisational Development (Demo)",
      acronym: "IBOD",
      field: "Management / Organisational Development",
      coordinator: "Demo University of Antwerp",
      partnerUniversities: ["Demo University of Antwerp", "Demo University of Valencia", "Demo University of Wroclaw"],
      countries: ["Belgium", "Spain", "Poland"],
      degreeType: "Joint Master",
      duration: "2 years",
      ects: 120,
      requirements: { requiresBachelors: true, requiredField: "Management", minCgpa: 3.0, minIelts: 6.5, minToefl: null, minYearsExperience: 3 },
      requiredDocuments: ["CV", "Bachelor Transcript", "IELTS Certificate", "Recommendation Letter 1", "Recommendation Letter 2", "Motivation Letter"],
    },
    {
      programmeName: "EMJM People Analytics & Workforce Transformation (Demo)",
      acronym: "PAWT",
      field: "HR Analytics / People Analytics",
      coordinator: "Demo University of Tilburg",
      partnerUniversities: ["Demo University of Tilburg", "Demo University of Barcelona", "Demo University of Budapest"],
      countries: ["Netherlands", "Spain", "Hungary"],
      degreeType: "Joint Master",
      duration: "2 years",
      ects: 120,
      requirements: { requiresBachelors: true, requiredField: "HR", minCgpa: 3.0, minIelts: 6.5, minToefl: null, minYearsExperience: 2 },
      requiredDocuments: ["CV", "Bachelor Transcript", "IELTS Certificate", "Recommendation Letter 1", "Recommendation Letter 2", "Motivation Letter"],
    },
  ];

  for (const p of programmes) {
    const existing = await prisma.erasmusProgramme.findFirst({ where: { acronym: p.acronym } });
    if (existing) continue;

    const eligibility = evaluateEligibility(applicant, p.requirements as never);
    const comps = scoreScholarshipMatch(applicant, p.requirements as never, eligibility);
    const overall = weightedScore(comps);
    const priority = calculatePriorityScore({
      match: overall,
      scholarshipAvailable: true,
      eligibilityConfidence: eligibility.status === "ELIGIBLE" ? 100 : eligibility.status === "UNCERTAIN" ? 60 : 80,
      careerAlignment: comps.career,
      deadlineFeasibility: 90,
    });

    await prisma.erasmusProgramme.create({
      data: {
        programmeName: p.programmeName,
        acronym: p.acronym,
        field: p.field,
        coordinator: p.coordinator,
        partnerUniversities: json(p.partnerUniversities),
        countries: json(p.countries),
        degreeType: p.degreeType,
        duration: p.duration,
        ects: p.ects,
        scholarshipAvailable: true,
        scholarshipDescription: "Erasmus Mundus Joint Master scholarship (demo — verify on official portal)",
        applicationDeadline: new Date("2027-01-15T23:59:00Z"),
        scholarshipDeadline: new Date("2027-01-15T23:59:00Z"),
        programmeStart: new Date("2027-09-01T00:00:00Z"),
        eligibility: JSON.stringify(p.requirements),
        languageRequirements: "IELTS ≥ 6.5 or equivalent",
        requiredDocuments: json(p.requiredDocuments),
        applicationMethod: "MANUAL",
        sourceUrl: "https://erasmus-plus.ec.europa.eu/opportunities/opportunities-for-individuals/erasmus-mundus-joint-masters",
        sourceTitle: "Erasmus+ — Erasmus Mundus Joint Masters (catalogue)",
        deadlineStatus: "UNVERIFIED",
        status: "NEW",
        matches: {
          create: {
            overallScore: overall,
            breakdown: JSON.stringify(comps),
            weights: JSON.stringify({ academic: 0.2, career: 0.2, subject: 0.2, experience: 0.15, eligibility: 0.1, language: 0.05, leadership: 0.05, mobility: 0.05 }),
            whyFits: json(["Strong HR/People background", "MBA Finance + Total Rewards depth", "Data-led HR analytics experience"]),
            eligibilityGaps: json(eligibility.hardFailures),
            documentGaps: json(["IELTS Certificate"]),
            priorityScore: priority,
            eligibilityStatus: eligibility.status,
            recommendation: scholarshipRecommendation(overall),
          },
        },
      },
    });
    console.log(`  + programme seeded: ${p.acronym} (match ${overall}%)`);
  }

  // ---- CV versions ---------------------------------------------------------
  const cvs = [
    { name: "HR Manager CV", targetRole: "Manager – HR", targetCountry: "Bangladesh", skills: ["HR Business Partnering", "Compensation & Benefits", "Performance Management", "HR Operations"], isDefault: true },
    { name: "Reward & C&B CV", targetRole: "Reward Manager", targetCountry: "Bangladesh", skills: ["Total Rewards", "Salary Benchmarking", "Incentive Governance", "HR Budgeting"], isDefault: false },
    { name: "HRBP CV", targetRole: "HR Business Partner", targetCountry: "Bangladesh", skills: ["HR Business Partnering", "Workforce Planning", "Talent Management", "Organizational Design"], isDefault: false },
    { name: "HR Operations CV", targetRole: "HR Operations Manager", targetCountry: "Bangladesh", skills: ["Payroll Management", "HR Operations", "Compliance", "HRMS"], isDefault: false },
    { name: "International CV", targetRole: "Manager – Reward", targetCountry: "International", skills: ["Total Rewards", "Compensation & Benefits", "HR Analytics", "HR Transformation"], isDefault: false },
  ];
  for (const cv of cvs) {
    const existing = await prisma.cv.findFirst({ where: { userId: user.id, name: cv.name } });
    if (existing) continue;
    await prisma.cv.create({
      data: {
        userId: user.id,
        name: cv.name,
        version: 1,
        targetRole: cv.targetRole,
        targetCountry: cv.targetCountry,
        skills: json(cv.skills),
        isDefault: cv.isDefault,
      },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
