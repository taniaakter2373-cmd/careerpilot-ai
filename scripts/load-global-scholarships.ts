// Load REAL global scholarship programmes (worldwide) into the hosted Postgres.
// Run: DATABASE_URL="<hosted-url>" npx tsx scripts/load-global-scholarships.ts
import { PrismaClient } from "@prisma/client";
import {
  calculatePriorityScore,
  evaluateEligibility,
  scholarshipRecommendation,
  scoreScholarshipMatch,
  weightedScore,
  type ProgrammeRequirements,
  type ScholarshipApplicant,
} from "@careerpilot/shared";

const prisma = new PrismaClient();
const parseJson = (s: string | null) => (s ? (JSON.parse(s) as string[]) : []);

const PROGRAMS: {
  name: string;
  acronym: string;
  field: string;
  website: string;
  degree: string;
  duration: string;
  country: string;
  requirements: ProgrammeRequirements;
}[] = [
  {
    name: "Chevening Scholarship (UK Government)",
    acronym: "Chevening",
    field: "Leadership / Management / Open to all fields",
    website: "https://www.chevening.org/",
    degree: "Master's",
    duration: "1 year",
    country: "United Kingdom",
    requirements: { requiresBachelors: true, requiredField: "Management", minCgpa: 3.0, minIelts: 6.5, minToefl: null, minYearsExperience: 2 },
  },
  {
    name: "Commonwealth Master's Scholarships (CSC UK)",
    acronym: "Commonwealth",
    field: "Development / Open to all fields",
    website: "https://cscuk.fcdo.gov.uk/",
    degree: "Master's",
    duration: "1 year",
    country: "United Kingdom",
    requirements: { requiresBachelors: true, requiredField: "Management", minCgpa: 3.0, minIelts: 6.5, minToefl: null, minYearsExperience: null },
  },
  {
    name: "DAAD Development-Related Postgraduate Courses (Germany)",
    acronym: "DAAD EPOS",
    field: "Development / Management / Public Policy",
    website: "https://www.daad.de/en/studying-in-germany/scholarships/",
    degree: "Master's",
    duration: "2 years",
    country: "Germany",
    requirements: { requiresBachelors: true, requiredField: "Management", minCgpa: 3.0, minIelts: 6.0, minToefl: null, minYearsExperience: 2 },
  },
  {
    name: "Fulbright Foreign Student Program (USA)",
    acronym: "Fulbright",
    field: "Open to all fields (Master's / PhD)",
    website: "https://foreign.fulbrightonline.org/",
    degree: "Master's",
    duration: "1-2 years",
    country: "United States",
    requirements: { requiresBachelors: true, requiredField: "Management", minCgpa: 3.0, minIelts: null, minToefl: 80, minYearsExperience: null },
  },
  {
    name: "Australia Awards Scholarships",
    acronym: "Australia Awards",
    field: "Development / Open to all fields",
    website: "https://www.dfat.gov.au/people-to-people/australia-awards",
    degree: "Master's",
    duration: "1-2 years",
    country: "Australia",
    requirements: { requiresBachelors: true, requiredField: "Management", minCgpa: 3.0, minIelts: 6.5, minToefl: null, minYearsExperience: null },
  },
  {
    name: "MEXT Scholarship (Japanese Government)",
    acronym: "MEXT",
    field: "Open to all fields",
    website: "https://www.studyinjapan.go.jp/en/scholarships/",
    degree: "Master's",
    duration: "2 years",
    country: "Japan",
    requirements: { requiresBachelors: true, requiredField: "Management", minCgpa: 2.3, minIelts: null, minToefl: null, minYearsExperience: null },
  },
  {
    name: "Chinese Government Scholarship (CSC)",
    acronym: "CSC",
    field: "Open to all fields",
    website: "https://www.campuschina.org/",
    degree: "Master's",
    duration: "2-3 years",
    country: "China",
    requirements: { requiresBachelors: true, requiredField: "Management", minCgpa: 3.0, minIelts: null, minToefl: null, minYearsExperience: null },
  },
  {
    name: "Global Korea Scholarship (GKS)",
    acronym: "GKS",
    field: "Open to all fields",
    website: "https://www.studyinkorea.go.kr/",
    degree: "Master's",
    duration: "2 years",
    country: "South Korea",
    requirements: { requiresBachelors: true, requiredField: "Management", minCgpa: 3.0, minIelts: null, minToefl: null, minYearsExperience: null },
  },
  {
    name: "Swedish Institute Scholarships for Global Professionals (SISGP)",
    acronym: "SISGP",
    field: "Open to all fields (Master's)",
    website: "https://si.se/en/",
    degree: "Master's",
    duration: "1-2 years",
    country: "Sweden",
    requirements: { requiresBachelors: true, requiredField: "Management", minCgpa: 3.0, minIelts: 6.5, minToefl: null, minYearsExperience: null },
  },
  {
    name: "Orange Knowledge Programme (Netherlands)",
    acronym: "OKP",
    field: "Development / Open to all fields",
    website: "https://www.orangeknowledge.nl/",
    degree: "Master's",
    duration: "1 year",
    country: "Netherlands",
    requirements: { requiresBachelors: true, requiredField: "Management", minCgpa: 3.0, minIelts: 6.0, minToefl: null, minYearsExperience: null },
  },
  {
    name: "Banting / Canadian Government International Scholarships",
    acronym: "Canada Gov",
    field: "Open to all fields",
    website: "https://www.educanada.ca/scholarships-bourses/",
    degree: "Master's / PhD",
    duration: "1-2 years",
    country: "Canada",
    requirements: { requiresBachelors: true, requiredField: "Management", minCgpa: 3.0, minIelts: 6.5, minToefl: null, minYearsExperience: null },
  },
];

async function main() {
  const profile = await prisma.scholarshipProfile.findFirst();
  if (!profile) throw new Error("No scholarship profile");
  const candidate = await prisma.candidateProfile.findFirst();
  const yearsExperience = candidate?.yearsExperience ?? null;

  const applicant: ScholarshipApplicant = {
    hasBachelorsDegree: profile.academicDegrees ? parseJson(profile.academicDegrees).length > 0 : null,
    fieldOfStudy: parseJson(profile.preferredStudyFields).join(", ") || null,
    cgpa: profile.cgpa != null ? Number(profile.cgpa) : null,
    ieltsScore: profile.ieltsScore != null ? Number(profile.ieltsScore) : null,
    toeflScore: profile.toeflScore != null ? Number(profile.toeflScore) : null,
    yearsExperience,
    nationality: profile.nationality,
    hasPassport: profile.passportStatus ? String(profile.passportStatus).toUpperCase() === "VALID" : null,
    leadershipExperience: profile.leadershipExperience,
    internationalExperience: profile.internationalExperience,
  };

  let added = 0;
  for (const p of PROGRAMS) {
    const existing = await prisma.erasmusProgramme.findFirst({ where: { acronym: p.acronym } });
    if (existing) continue;

    const eligibility = evaluateEligibility(applicant, p.requirements);
    const components = scoreScholarshipMatch(applicant, p.requirements, eligibility);
    const overall = weightedScore(components);
    const priority = calculatePriorityScore({
      match: overall,
      scholarshipAvailable: true,
      eligibilityConfidence: eligibility.status === "ELIGIBLE" ? 100 : eligibility.status === "LIKELY_ELIGIBLE" ? 85 : eligibility.status === "UNCERTAIN" ? 60 : 0,
      careerAlignment: components.career,
      deadlineFeasibility: 80,
    });

    await prisma.erasmusProgramme.create({
      data: {
        programmeName: p.name,
        acronym: p.acronym,
        officialUrl: p.website,
        coordinator: null,
        partnerUniversities: JSON.stringify([]),
        countries: JSON.stringify([p.country]),
        field: p.field,
        degreeType: p.degree,
        duration: p.duration,
        ects: null,
        scholarshipAvailable: true,
        scholarshipDescription: "Government-funded international scholarship — competitive selection (verify on official website)",
        languageRequirements: p.requirements.minIelts ? `IELTS ≥ ${p.requirements.minIelts} or equivalent` : "See official requirements",
        requiredDocuments: JSON.stringify(["CV", "Bachelor Transcript", "English Language Certificate", "Recommendation Letter 1", "Recommendation Letter 2", "Motivation Letter"]),
        applicationMethod: "MANUAL",
        sourceUrl: p.website,
        sourceTitle: "Official program website",
        sourceLastVerified: new Date(),
        deadlineStatus: "UNVERIFIED",
        status: "NEW",
        matches: {
          create: {
            overallScore: overall,
            breakdown: JSON.stringify(components),
            weights: JSON.stringify({ academic: 0.2, career: 0.2, subject: 0.2, experience: 0.15, eligibility: 0.1, language: 0.05, leadership: 0.05, mobility: 0.05 }),
            whyFits: JSON.stringify(eligibility.hardFailures.length ? [] : ["Relevant professional background", "MBA Finance foundation"]),
            eligibilityGaps: JSON.stringify(eligibility.hardFailures),
            documentGaps: JSON.stringify(["English Language Certificate", "Recommendation Letter"]),
            priorityScore: priority,
            eligibilityStatus: eligibility.status,
            recommendation: scholarshipRecommendation(overall),
          },
        },
      },
    });
    added++;
    console.log(`  + ${p.acronym} (${p.country}) | match ${overall}% | ${eligibility.status}`);
  }

  console.log(`Loaded global scholarships: added=${added}`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
