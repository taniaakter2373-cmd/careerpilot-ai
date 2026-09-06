// Seed reference data: Europe country intelligence (work-permit routes) + a
// starter Global Award catalog. Run: DATABASE_URL="<hosted-url>" npx tsx scripts/seed-europe-awards.ts
//
// DATA QUALITY: every country route / award row carries a source label and the
// UI marks deadlines/fees/salary thresholds as requiring verification on the
// official source. Nothing here is presented as guaranteed.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface CountrySeed {
  country: string;
  routes: Array<{ route: string; euBlueCard?: boolean; needsSponsor: boolean; salaryNote?: string; docs?: string[]; source: string; confidence: "HIGH" | "MEDIUM" | "LOW" }>;
  englishReq: { status: string; note: string; source: string };
  thresholds: Array<{ route: string; threshold: string; note: string }>;
  sponsorship: string;
  notes: string;
}

const COUNTRIES: CountrySeed[] = [
  {
    country: "Germany",
    sponsorship: "POSSIBLE",
    notes: "EU Blue Card and Skilled Immigration Act routes are open to HR professionals with a recognised qualification and a qualifying job offer. Verify current thresholds at Make-it-in-Germany.",
    englishReq: { status: "TEST_NOT_MANDATORY", note: "English-medium roles usually do not require IELTS for the job; the EU Blue Card may ask for evidence of qualification recognition, not an English test.", source: "make-it-in-germany.com" },
    thresholds: [
      { route: "EU Blue Card", threshold: "State-specific minimum salary (approx.)", note: "Verify the current figure on the official site" },
      { route: "Skilled Worker (Fachkraft)", threshold: "Qualifying salary", note: "Verify with the Federal Employment Agency" },
    ],
    routes: [
      { route: "EU Blue Card", euBlueCard: true, needsSponsor: true, salaryNote: "Salary threshold applies; verify current annual figure.", docs: ["Degree / qualification recognition", "Job offer"], source: "make-it-in-germany.com", confidence: "MEDIUM" },
      { route: "Skilled Worker with university degree (§18b)", needsSponsor: true, docs: ["Recognised/ comparable qualification", "Job offer"], source: "make-it-in-germany.com", confidence: "MEDIUM" },
      { route: "Skilled Worker with vocational training (§18a)", needsSponsor: true, docs: ["Vocational qualification"], source: "make-it-in-germany.com", confidence: "MEDIUM" },
      { route: "Opportunity Card (Chancenkarte)", needsSponsor: false, docs: ["Points system"], source: "make-it-in-germany.com", confidence: "MEDIUM" },
    ],
  },
  {
    country: "Netherlands",
    sponsorship: "POSSIBLE",
    notes: "Highly Skilled Migrant permit needs a sponsor recognised by the IND. Verify current salary thresholds.",
    englishReq: { status: "TEST_NOT_MANDATORY", note: "Highly Skilled Migrant route does not require IELTS for the permit; employers decide language needs.", source: "ind.nl" },
    thresholds: [{ route: "Highly Skilled Migrant", threshold: "Age/experience-dependent salary threshold", note: "Verify at ind.nl" }],
    routes: [
      { route: "Highly Skilled Migrant (kennismigrant)", needsSponsor: true, salaryNote: "Salary threshold applies; verify at ind.nl.", docs: ["Recognised sponsor employer", "Salary above threshold"], source: "ind.nl", confidence: "MEDIUM" },
      { route: "EU Blue Card", euBlueCard: true, needsSponsor: true, docs: ["Degree", "Job offer"], source: "ind.nl", confidence: "MEDIUM" },
      { route: "Orientation Year for graduates", needsSponsor: false, docs: ["Recent graduate of NL/recognised university"], source: "ind.nl", confidence: "LOW" },
    ],
  },
  {
    country: "Ireland",
    sponsorship: "POSSIBLE",
    notes: "Critical Skills Employment Permit is the main route for degree-level occupations; requires a job offer above the salary threshold. Verify current list and thresholds.",
    englishReq: { status: "TEST_NOT_MANDATORY", note: "IELTS not mandatory for the permit. Employers may assess English separately.", source: "citizensinformation.ie" },
    thresholds: [{ route: "Critical Skills Employment Permit", threshold: "Annual salary threshold", note: "Verify at citizensinformation.ie / dbei.gov.ie" }],
    routes: [
      { route: "Critical Skills Employment Permit", needsSponsor: true, salaryNote: "Salary threshold applies; verify current rate.", docs: ["Job offer", "Degree"], source: "citizensinformation.ie", confidence: "MEDIUM" },
      { route: "General Employment Permit", needsSponsor: true, docs: ["Job offer; labour market test may apply"], source: "citizensinformation.ie", confidence: "MEDIUM" },
    ],
  },
  {
    country: "France",
    sponsorship: "POSSIBLE",
    notes: "Talent Passport and EU Blue Card routes exist for skilled workers. Verify current salary thresholds with the French authorities.",
    englishReq: { status: "TEST_NOT_MANDATORY", note: "English test not a permit requirement; employer decides. French language may be relevant for some roles.", source: "Welcome to France" },
    thresholds: [{ route: "EU Blue Card / Talent Passport", threshold: "Salary threshold (1.5x minimum reference)", note: "Verify current figure" }],
    routes: [
      { route: "Talent Passport – Employee", needsSponsor: true, docs: ["Job offer", "Qualification"], source: "Welcome to France", confidence: "MEDIUM" },
      { route: "EU Blue Card", euBlueCard: true, needsSponsor: true, docs: ["Degree (3+ yrs)", "Job offer"], source: "Welcome to France", confidence: "MEDIUM" },
      { route: "Salarié (work permit)", needsSponsor: true, docs: ["Job offer"], source: "Welcome to France", confidence: "MEDIUM" },
    ],
  },
  {
    country: "Belgium",
    sponsorship: "POSSIBLE",
    notes: "Single Permit covers work+residence; EU Blue Card available. Verify region-specific salary thresholds (Flanders/Brussels/Wallonia).",
    englishReq: { status: "TEST_NOT_MANDATORY", note: "No IELTS requirement for the permit itself.", source: "europa.eu/eu-blue-card" },
    thresholds: [{ route: "Single Permit / EU Blue Card", threshold: "Salary threshold (region-specific)", note: "Verify current figure" }],
    routes: [
      { route: "Single Permit", needsSponsor: true, docs: ["Job offer", "Employer authorisation"], source: "work-in-belgium.be", confidence: "MEDIUM" },
      { route: "EU Blue Card", euBlueCard: true, needsSponsor: true, docs: ["Degree", "Job offer"], source: "work-in-belgium.be", confidence: "MEDIUM" },
    ],
  },
  {
    country: "Sweden",
    sponsorship: "POSSIBLE",
    notes: "Work permit is employer-tied with salary + insurance requirements. Verify current rules with the Swedish Migration Agency.",
    englishReq: { status: "TEST_NOT_MANDATORY", note: "No IELTS for the permit; employer language expectations only.", source: "migrationsverket.se" },
    thresholds: [{ route: "Work permit", threshold: "Salary + employment conditions must be market-standard", note: "Verify at migrationsverket.se" }],
    routes: [
      { route: "Work permit (employer-tied)", needsSponsor: true, docs: ["Job offer meeting salary & insurance terms"], source: "migrationsverket.se", confidence: "MEDIUM" },
      { route: "EU Blue Card", euBlueCard: true, needsSponsor: true, docs: ["Degree", "Job offer"], source: "migrationsverket.se", confidence: "MEDIUM" },
    ],
  },
  {
    country: "Denmark",
    sponsorship: "POSSIBLE",
    notes: "Positive List / Pay Limit schemes let employers hire skilled non-EU staff. Verify thresholds with nyidanmark.dk.",
    englishReq: { status: "TEST_NOT_MANDATORY", note: "No IELTS for the permit; employer decides.", source: "nyidanmark.dk" },
    thresholds: [{ route: "Pay Limit", threshold: "Annual salary above the pay-limit", note: "Verify at nyidanmark.dk" }],
    routes: [
      { route: "Positive List", needsSponsor: true, docs: ["Job offer on the Positive List"], source: "nyidanmark.dk", confidence: "MEDIUM" },
      { route: "Pay Limit scheme", needsSponsor: true, docs: ["High-salary job offer"], source: "nyidanmark.dk", confidence: "MEDIUM" },
      { route: "Fast-track (certified company)", needsSponsor: true, docs: ["Certified employer"], source: "nyidanmark.dk", confidence: "LOW" },
    ],
  },
  {
    country: "Finland",
    sponsorship: "POSSIBLE",
    notes: "Work-based residence permit for specialists; verify with migri.fi.",
    englishReq: { status: "TEST_NOT_MANDATORY", note: "No IELTS for the permit.", source: "migri.fi" },
    thresholds: [{ route: "Specialist permit", threshold: "Salary ≥ approx. €3,000/month", note: "Verify current figure at migri.fi" }],
    routes: [
      { route: "Specialist residence permit", needsSponsor: true, docs: ["Job offer", "Salary above threshold"], source: "migri.fi", confidence: "MEDIUM" },
    ],
  },
  {
    country: "Austria",
    sponsorship: "POSSIBLE",
    notes: "Red-White-Red Card is points-based for skilled workers. Verify points + salary thresholds with migration.gv.at.",
    englishReq: { status: "TEST_NOT_MANDATORY", note: "Points may reward language skills; IELTS is not a hard permit requirement.", source: "migration.gv.at" },
    thresholds: [{ route: "Red-White-Red Card", threshold: "Points + salary threshold", note: "Verify at migration.gv.at" }],
    routes: [
      { route: "Red-White-Red Card – Very Highly Qualified", needsSponsor: true, docs: ["Points assessment", "Job offer"], source: "migration.gv.at", confidence: "MEDIUM" },
      { route: "Red-White-Red Card – Skilled Worker in shortage occupation", needsSponsor: true, docs: ["Points", "Job offer"], source: "migration.gv.at", confidence: "MEDIUM" },
    ],
  },
  {
    country: "Portugal",
    sponsorship: "POSSIBLE",
    notes: "Job offer + work visa via consulate; employer assistance helps. Verify with the Portuguese immigration authority (AIMA).",
    englishReq: { status: "TEST_NOT_MANDATORY", note: "English test not a permit requirement.", source: "aima.gov.pt" },
    thresholds: [{ route: "Work visa", threshold: "Minimum wage (approx.) + job offer", note: "Verify current requirement" }],
    routes: [
      { route: "Work visa / residence permit", needsSponsor: true, docs: ["Job offer"], source: "aima.gov.pt", confidence: "LOW" },
      { route: "Job-seeker visa", needsSponsor: false, docs: ["Proof of means"], source: "aima.gov.pt", confidence: "LOW" },
    ],
  },
];

interface AwardSeed {
  name: string;
  organization: string;
  region: string;
  country?: string;
  category: string;
  description: string;
  eligibility: string;
  officialUrl: string;
  applicationUrl?: string;
  nominationType: string;
  judgingCriteria?: string;
  skillsMatched?: string[];
}

const AWARDS: AwardSeed[] = [
  {
    name: "Stevie Awards for Great Employers — HR Professional categories",
    organization: "Stevie Awards",
    region: "GLOBAL",
    category: "Reward / HR",
    description: "Recognises achievement in HR and employer excellence worldwide. Individual HR professional and rewards/payroll categories exist; category list and cycle vary each year.",
    eligibility: "Open to HR professionals and organisations worldwide. Verify current categories, eligibility, fees and deadlines on the official source — do not rely on third-party lists.",
    officialUrl: "https://stevieawards.com/",
    applicationUrl: "https://stevieawards.com/",
    nominationType: "SELF_NOMINATION",
    judgingCriteria: "Innovation, measurable results, and impact of the HR/reward initiative.",
    skillsMatched: ["HR", "Reward", "Compensation", "Benefits", "Payroll", "People"],
  },
  {
    name: "HR Excellence Awards (HRD / HR magazine family)",
    organization: "HRD / HR magazine",
    region: "GLOBAL",
    category: "HR",
    description: "Annual awards programme recognising HR teams and individuals. Verify the applicable country edition, categories, fees and deadlines.",
    eligibility: "Check the applicable edition's eligibility and deadlines on the official site.",
    officialUrl: "https://hrdconnect.com/",
    nominationType: "SELF_NOMINATION",
    judgingCriteria: "Impact, innovation and business results of HR work.",
    skillsMatched: ["HR", "People", "Talent", "Workforce", "Leadership"],
  },
  {
    name: "Asia HRD Awards (Asia's Best HR / individual categories)",
    organization: "Asia HRD Congress",
    region: "APAC",
    country: "Asia-Pacific",
    category: "HR",
    description: "Flagship recognition for HR excellence across Asia. Individual and organisation categories; verify current edition, categories, fees and deadlines on the official source.",
    eligibility: "Typically open to HR professionals and teams operating in Asia-Pacific. Verify exact eligibility and dates.",
    officialUrl: "https://www.asiahcd.com/",
    nominationType: "NOMINATION",
    judgingCriteria: "Strategic HR leadership, innovation and measurable impact.",
    skillsMatched: ["HR", "People", "Leadership", "Talent"],
  },
  {
    name: "Human Resources Professional of the Year — national HR awards (e.g., CIPD Ireland / SHRM recognition programmes)",
    organization: "National HR institutes (e.g., CIPD, SHRM programmes)",
    region: "NATIONAL",
    country: "UK / IE / US",
    category: "HR",
    description: "Several national HR institutes run Professional-of-the-Year style recognitions. Search the applicable institute (e.g., CIPD, SHRM) for the current programme.",
    eligibility: "Membership and geography requirements vary by institute. Verify on the official institute site.",
    officialUrl: "https://www.cipd.org/",
    nominationType: "NOMINATION",
    skillsMatched: ["HR", "People", "Leadership"],
  },
  {
    name: "Women in HR / Women in Business leadership awards (eligible category)",
    organization: "Multiple (e.g., Women in HR Summit, regional Women in Business awards)",
    region: "GLOBAL",
    category: "Leadership",
    description: "Recognition for women in HR/business leadership. Only shortlist where the candidate is eligible and the category fits.",
    eligibility: "Verify category, geography and eligibility on each organiser's official site before applying.",
    officialUrl: "https://womeninhr.com/",
    nominationType: "NOMINATION",
    skillsMatched: ["Leadership", "HR", "People"],
  },
  {
    name: "Brandon Hall Group — Excellence in Technology / HCM awards",
    organization: "Brandon Hall Group",
    region: "GLOBAL",
    category: "HR Technology / Innovation",
    description: "Awards for excellence in HCM, talent, and HR technology — including individual/category recognition where applicable. Verify current categories and deadlines.",
    eligibility: "Generally tied to submitted case studies/programmes; verify category fit and deadlines.",
    officialUrl: "https://www.brandonhall.com/",
    nominationType: "APPLICATION",
    judgingCriteria: "Technology innovation and measurable business outcomes.",
    skillsMatched: ["HRIS", "Analytics", "Automation", "Digital", "HR"],
  },
  {
    name: "Employer Branding / Talent Acquisition Innovation awards (regional HR excellence programmes)",
    organization: "Regional HR award bodies (e.g., HR Festival, national TA associations)",
    region: "GLOBAL",
    category: "Talent / Innovation",
    description: "Regional programmes recognise innovation in employer branding and talent acquisition. Verify the current region/edition before applying.",
    eligibility: "Depends on the specific regional programme. Verify official details.",
    officialUrl: "https://www.hrfestival.com/",
    nominationType: "NOMINATION",
    skillsMatched: ["Talent", "Employer Branding", "People", "Innovation"],
  },
  {
    name: "IR Global / professional services Excellence awards (individual contributor categories)",
    organization: "IR Global",
    region: "GLOBAL",
    category: "Professional Excellence",
    description: "Recognises professional excellence; HR/reward practitioners may fit individual contributor categories. Verify current categories and deadlines.",
    eligibility: "Verify category scope, geography and deadlines on the official source.",
    officialUrl: "https://www.irglobal.com/",
    nominationType: "NOMINATION",
    skillsMatched: ["HR", "Reward", "Professional", "Leadership"],
  },
];

async function main() {
  let cAdded = 0;
  for (const c of COUNTRIES) {
    const existing = await prisma.europeCountryIntelligence.findUnique({ where: { country: c.country } });
    const data = {
      workPermitRoutes: JSON.stringify(c.routes),
      salaryThresholds: JSON.stringify(c.thresholds),
      englishRequirement: JSON.stringify(c.englishReq),
      sponsorshipLikelihood: c.sponsorship,
      notes: c.notes,
      lastVerified: null,
    };
    if (existing) await prisma.europeCountryIntelligence.update({ where: { country: c.country }, data });
    else await prisma.europeCountryIntelligence.create({ data: { country: c.country, ...data } });
    cAdded++;
  }

  let aAdded = 0;
  for (const a of AWARDS) {
    const existing = await prisma.award.findFirst({ where: { name: a.name } });
    const data = {
      name: a.name,
      organization: a.organization,
      region: a.region,
      country: a.country ?? null,
      category: a.category,
      description: a.description,
      eligibility: a.eligibility,
      officialUrl: a.officialUrl,
      applicationUrl: a.applicationUrl ?? a.officialUrl,
      nominationType: a.nominationType,
      judgingCriteria: a.judgingCriteria ?? null,
      skillsMatched: JSON.stringify(a.skillsMatched ?? []),
      deadlineStatus: "UNVERIFIED",
      source: "Official award source — verify",
      sourceLastChecked: null,
    };
    if (existing) await prisma.award.update({ where: { id: existing.id }, data });
    else await prisma.award.create({ data });
    aAdded++;
  }

  console.log(`Seeded country intelligence: ${cAdded}, awards: ${aAdded}`);
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
