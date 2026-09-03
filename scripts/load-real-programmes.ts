// Load REAL Erasmus Mundus programmes (from official EACEA catalogue) into the hosted Postgres.
// Run: DATABASE_URL="<hosted-url>" npx tsx scripts/load-real-programmes.ts
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

// Real EMJM programmes from the official EACEA Erasmus Mundus Catalogue (eacea.ec.europa.eu).
// Source: https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en
const PROGRAMMES: {
  name: string;
  acronym: string;
  field: string;
  website: string;
  degree: string;
  duration: string;
  ects: number;
  requirements: ProgrammeRequirements;
}[] = [
  {
    name: "International Master in Contemporary Challenges in the World of Work (WOCC)",
    acronym: "WOCC",
    field: "HR / Labour Studies / Work",
    website: "https://www.master-wocc.eu/",
    degree: "Joint Master",
    duration: "2 years",
    ects: 120,
    requirements: { requiresBachelors: true, requiredField: "HR", minCgpa: 3.0, minIelts: 6.5, minToefl: null, minYearsExperience: 2 },
  },
  {
    name: "InterCultural Leadership in Digital Era International Master (CLIDE)",
    acronym: "CLIDE",
    field: "Leadership / Management / Intercultural",
    website: "https://clide.umk.pl/",
    degree: "Joint Master",
    duration: "2 years",
    ects: 120,
    requirements: { requiresBachelors: true, requiredField: "Management", minCgpa: 3.0, minIelts: 6.5, minToefl: null, minYearsExperience: 2 },
  },
  {
    name: "Erasmus Mundus Joint Master in Multilingualism and Cultural Diversity (MultiDiverse)",
    acronym: "MultiDiverse",
    field: "Diversity / Cultural / HR",
    website: "https://www.multidiverse.eu/",
    degree: "Joint Master",
    duration: "2 years",
    ects: 120,
    requirements: { requiresBachelors: true, requiredField: "HR", minCgpa: 3.0, minIelts: 6.5, minToefl: null, minYearsExperience: null },
  },
  {
    name: "Data Engineering and Artificial Intelligence (DEAI)",
    acronym: "DEAI",
    field: "Data Engineering / AI / People Analytics",
    website: "https://deai.ulb.be/",
    degree: "Joint Master",
    duration: "2 years",
    ects: 120,
    requirements: { requiresBachelors: true, requiredField: "Data", minCgpa: 3.0, minIelts: 6.5, minToefl: null, minYearsExperience: null },
  },
  {
    name: "Erasmus Mundus Joint Master Programme on the Engineering of Data-intensive Intelligent Software Systems (EDISS)",
    acronym: "EDISS",
    field: "Data-intensive Systems / AI",
    website: "https://www.master-ediss.eu",
    degree: "Joint Master",
    duration: "2 years",
    ects: 120,
    requirements: { requiresBachelors: true, requiredField: "Data", minCgpa: 3.0, minIelts: 6.5, minToefl: null, minYearsExperience: null },
  },
  {
    name: "European Politics and Society: Václav Havel Joint Master Degree (EPS)",
    acronym: "EPS",
    field: "Politics / Governance / Leadership",
    website: "https://epsmaster.eu/",
    degree: "Joint Master",
    duration: "2 years",
    ects: 120,
    requirements: { requiresBachelors: true, requiredField: "Management", minCgpa: 3.0, minIelts: 6.5, minToefl: null, minYearsExperience: null },
  },
  {
    name: "Erasmus Mundus Joint Master in Sustainable Transportation and Electric Power Systems (EMJM STEPS)",
    acronym: "EMJM STEPS",
    field: "Engineering / Energy",
    website: "https://www.emjmdstepsrock.eu/",
    degree: "Joint Master",
    duration: "2 years",
    ects: 120,
    requirements: { requiresBachelors: true, requiredField: "Engineering", minCgpa: 3.0, minIelts: 6.5, minToefl: null, minYearsExperience: null },
  },
  {
    name: "Erasmus Mundus Masters in Journalism, Media and Globalisation (Mundus Journalism)",
    acronym: "EMMA",
    field: "Media / Journalism / Communication",
    website: "https://mundusjournalism.com",
    degree: "Joint Master",
    duration: "2 years",
    ects: 120,
    requirements: { requiresBachelors: true, requiredField: "Media", minCgpa: 3.0, minIelts: 6.5, minToefl: null, minYearsExperience: null },
  },
  {
    name: "NOHA Erasmus Mundus Joint Master in International Humanitarian Action (NOHA)",
    acronym: "NOHA",
    field: "Humanitarian Action / Development",
    website: "https://www.nohanet.org/masters",
    degree: "Joint Master",
    duration: "2 years",
    ects: 120,
    requirements: { requiresBachelors: true, requiredField: "Development", minCgpa: 3.0, minIelts: 6.5, minToefl: null, minYearsExperience: null },
  },
  {
    name: "International Master in Security, Intelligence and Strategic Studies",
    acronym: "IMSISS",
    field: "Security / Strategy / Intelligence",
    website: "https://www.securityintelligence-erasmusmundus.eu/",
    degree: "Joint Master",
    duration: "2 years",
    ects: 120,
    requirements: { requiresBachelors: true, requiredField: "Security", minCgpa: 3.0, minIelts: 6.5, minToefl: null, minYearsExperience: null },
  },
  {
    name: "European Master's in Clinical Linguistics (EMCL+)",
    acronym: "EMCL",
    field: "Linguistics / Clinical",
    website: "https://www.emcl.eu/",
    degree: "Joint Master",
    duration: "2 years",
    ects: 120,
    requirements: { requiresBachelors: true, requiredField: "Linguistics", minCgpa: 3.0, minIelts: 6.5, minToefl: null, minYearsExperience: null },
  },
  {
    name: "Erasmus Mundus Joint Master Programme in Neuroscience (NEURASMUS)",
    acronym: "NEURASMUS",
    field: "Neuroscience / Science",
    website: "https://www.neurasmus.u-bordeaux.fr/",
    degree: "Joint Master",
    duration: "2 years",
    ects: 120,
    requirements: { requiresBachelors: true, requiredField: "Science", minCgpa: 3.0, minIelts: 6.5, minToefl: null, minYearsExperience: null },
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

  // Remove demo programmes
  const removed = await prisma.erasmusProgramme.deleteMany({ where: { programmeName: { contains: "Demo" } } });
  console.log(`Removed demo programmes: ${removed.count}`);

  let added = 0;
  for (const p of PROGRAMMES) {
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
        countries: JSON.stringify([]),
        field: p.field,
        degreeType: p.degree,
        duration: p.duration,
        ects: p.ects,
        scholarshipAvailable: true,
        scholarshipDescription: "Erasmus Mundus Joint Master scholarship — competitive selection (verify on official website)",
        languageRequirements: "IELTS ≥ 6.5 or equivalent",
        requiredDocuments: JSON.stringify(["CV", "Bachelor Transcript", "IELTS Certificate", "Recommendation Letter 1", "Recommendation Letter 2", "Motivation Letter"]),
        applicationMethod: "MANUAL",
        sourceUrl: p.website,
        sourceTitle: "Erasmus Mundus Catalogue (EACEA)",
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
            documentGaps: JSON.stringify(["IELTS Certificate", "Passport"]),
            priorityScore: priority,
            eligibilityStatus: eligibility.status,
            recommendation: scholarshipRecommendation(overall),
          },
        },
      },
    });
    added++;
    console.log(`  + ${p.acronym} | match ${overall}% | ${eligibility.status}`);
  }

  console.log(`Loaded real programmes: added=${added}`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
