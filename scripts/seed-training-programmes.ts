// Seed the International Training & Fellowship Tracker (physical professional
// development abroad). Funding levels are ONLY set where verified from the
// official source; everything else is UNVERIFIED / NOT_CONFIRMED.
//
// Run: DATABASE_URL="<hosted-url>" npx tsx scripts/seed-training-programmes.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface Seed {
  name: string;
  organization: string;
  country?: string;
  city?: string;
  mode?: "ONSITE" | "ONLINE" | "HYBRID";
  hrRelevance?: "HIGH" | "MEDIUM" | "LOW";
  rewardRelevance?: "HIGH" | "MEDIUM" | "LOW";
  durationText?: string;
  nextCycleNote?: string;
  fundingLevel?: string;
  coversAirfare?: string;
  coversAccommodation?: string;
  coversMeals?: string;
  coversVisa?: string;
  stipendNote?: string;
  fundingTerms?: string;
  ieltsRequired?: "NO" | "YES" | "UNKNOWN";
  englishEvidenceNote?: string;
  privateSectorEligible?: "YES" | "NO" | "UNKNOWN";
  govtNominationRequired?: boolean;
  experienceRequired?: string;
  nationalityNote?: string;
  officialUrl?: string;
  applicationUrl?: string;
  status?: string;
  priority?: string;
  assessment?: string;
  source?: string;
  notes?: string;
}

// Funding score per user's scale.
const FUNDING_SCORE: Record<string, number> = {
  FULLY: 100,
  MOSTLY: 70,
  PARTIALLY: 50,
  TUITION_ONLY: 25,
  SELF: 0,
  FREE_NOT_FUNDED: 0,
  UNVERIFIED: 0,
};

// Match score per user's weights.
function matchScore(s: Seed): number {
  const hr = s.hrRelevance === "HIGH" ? 25 : s.hrRelevance === "MEDIUM" ? 15 : 5;
  const rw = s.rewardRelevance === "HIGH" ? 15 : s.rewardRelevance === "MEDIUM" ? 8 : 2;
  const fund = (FUNDING_SCORE[s.fundingLevel ?? "UNVERIFIED"] ?? 0) * 0.2; // 20
  const priv = s.privateSectorEligible === "YES" ? 15 : s.privateSectorEligible === "UNKNOWN" ? 7 : 0;
  const exp = 10; // candidate has 6+ yrs — fits most mid-career
  const noIelts = s.ieltsRequired === "NO" ? 5 : s.ieltsRequired === "UNKNOWN" ? 2 : 0;
  const travel = (s.mode ?? "ONSITE") === "ONSITE" ? 5 : 0;
  const lead = 5;
  return Math.round(hr + rw + fund + priv + exp + noIelts + travel + lead);
}

const PROGRAMS: Seed[] = [
  {
    name: "Commonwealth Professional Fellowships",
    organization: "Commonwealth Scholarship Commission in the UK (CSC)",
    country: "United Kingdom",
    mode: "ONSITE",
    hrRelevance: "MEDIUM",
    rewardRelevance: "LOW",
    durationText: "6 weeks – 3 months (UK host organisation)",
    nextCycleNote: "2027 applications closed 25 Aug 2026; typically opens late July each year",
    fundingLevel: "FULLY",
    coversAirfare: "YES",
    coversAccommodation: "YES",
    coversMeals: "YES",
    coversVisa: "YES",
    stipendNote: "Stipend £2,218/month (£2,753 London) + arrival allowance up to £1,247.09 (2025/26 rates)",
    fundingTerms:
      "Official: approved return airfare; reimbursement of the standard visa application fee; monthly stipend £2,218 (£2,753 London); arrival allowance up to £1,247.09; up to £1,000–£2,000 for short courses/conferences. Host allowance contributed.",
    ieltsRequired: "NO",
    englishEvidenceNote: "No IELTS stated; must meet each host programme's requirements",
    privateSectorEligible: "YES",
    govtNominationRequired: false,
    experienceRequired: "5+ years relevant experience; must be employed; 2 references (1 from current employer)",
    nationalityNote: "Bangladesh is on the ODA-eligible country list",
    officialUrl: "https://cscuk.fcdo.gov.uk/scholarships/commonwealth-fellowships-information-for-candidates/",
    applicationUrl: "https://portal.csccentralonline.org.uk/application",
    status: "WATCHLIST",
    priority: "WATCHLIST",
    assessment: "MEDIUM_MATCH",
    source: "cscuk.fcdo.gov.uk (verified 13-Sep-2026)",
    notes:
      "Fully funded and private-sector eligible, but the 2027 host programmes are health/science/development — HR relevance is low in the current cycle. Watch for HR-relevant hosts when 2028 opens.",
  },
  {
    name: "AOTS Management Training in Japan",
    organization: "Association for Overseas Technical Cooperation and Sustainable Partnerships (AOTS)",
    country: "Japan",
    mode: "ONSITE",
    hrRelevance: "MEDIUM",
    rewardRelevance: "LOW",
    durationText: "Short programmes (varies)",
    fundingLevel: "UNVERIFIED",
    fundingTerms: "Not confirmed — official pages reviewed do not state airfare/accommodation coverage",
    ieltsRequired: "UNKNOWN",
    privateSectorEligible: "YES",
    govtNominationRequired: false,
    nationalityNote: "Programmes for engineers/managers from companies in developing countries",
    officialUrl: "https://www.aots.jp/en/what-we-do/hrd/management/",
    status: "WATCHLIST",
    priority: "WATCHLIST",
    assessment: "MEDIUM_MATCH",
    source: "aots.jp (partially verified 13-Sep-2026)",
    notes: "Designed for private-sector managers/engineers from developing countries. Verify exact funding + current call.",
  },
  {
    name: "ITCILO Turin — face-to-face HR / labour courses (e.g. Executive Solutions to New Forms of Work)",
    organization: "International Training Centre of the ILO (ITCILO)",
    country: "Italy",
    city: "Turin",
    mode: "ONSITE",
    hrRelevance: "HIGH",
    rewardRelevance: "MEDIUM",
    durationText: "Typically 1–5 days to a few weeks (e.g. 19–23 Oct 2026)",
    fundingLevel: "SELF",
    coversAirfare: "NO",
    coversAccommodation: "NO",
    coversMeals: "NOT_CONFIRMED",
    coversVisa: "NOT_CONFIRMED",
    fundingTerms:
      "Course fees apply; travel and accommodation are not covered automatically. Fellowships exist only for specific groups (e.g. workers'/employers' organisations).",
    ieltsRequired: "NO",
    privateSectorEligible: "YES",
    govtNominationRequired: false,
    officialUrl: "https://www.itcilo.org/courses",
    status: "OPEN",
    priority: "NOT_SUITABLE",
    assessment: "LOW_MATCH",
    source: "itcilo.org (verified 13-Sep-2026)",
    notes: "Physically in Turin and HR/labour relevant, but self-funded → fails the 'fully funded travel' objective.",
  },
  {
    name: "ADB–Japan Scholarship Program (JSP)",
    organization: "Asian Development Bank",
    country: "Multiple (Asia-Pacific universities)",
    mode: "ONSITE",
    hrRelevance: "MEDIUM",
    rewardRelevance: "LOW",
    durationText: "Postgraduate degree (1–2 years)",
    fundingLevel: "UNVERIFIED",
    fundingTerms: "Not confirmed in this session — ADB-JSP funding terms must be verified on the official ADB page",
    ieltsRequired: "UNKNOWN",
    privateSectorEligible: "UNKNOWN",
    govtNominationRequired: false,
    officialUrl: "https://www.adb.org/",
    status: "WATCHLIST",
    priority: "WATCHLIST",
    assessment: "MEDIUM_MATCH",
    source: "candidate — verify",
    notes: "Funded postgraduate study for ADB developing-member-country nationals; verify eligibility, funding and English-test rules.",
  },
  {
    name: "Eisenhower Fellowships",
    organization: "Eisenhower Fellowships",
    country: "United States",
    mode: "ONSITE",
    hrRelevance: "MEDIUM",
    rewardRelevance: "LOW",
    durationText: "~4–6 weeks (customised fellowship)",
    fundingLevel: "UNVERIFIED",
    fundingTerms: "Not confirmed in this session — verify on ef.org",
    ieltsRequired: "UNKNOWN",
    privateSectorEligible: "YES",
    govtNominationRequired: false,
    experienceRequired: "Typically senior leaders (10–20+ years)",
    officialUrl: "https://www.ef.org/",
    status: "WATCHLIST",
    priority: "WATCHLIST",
    assessment: "LOW_MATCH",
    source: "candidate — verify",
    notes: "Private-sector eligible and travel-based, but usually targets more senior leaders than 6 years' experience.",
  },
  {
    name: "Swedish Institute Management Programme (SIMP / SI Leadership)",
    organization: "Swedish Institute",
    country: "Sweden",
    mode: "HYBRID",
    hrRelevance: "MEDIUM",
    rewardRelevance: "LOW",
    durationText: "Multi-month programme with an in-Sweden component",
    fundingLevel: "UNVERIFIED",
    fundingTerms: "Not confirmed in this session — verify on si.se (SI programmes typically cover travel/accommodation for selected participants)",
    ieltsRequired: "UNKNOWN",
    privateSectorEligible: "UNKNOWN",
    govtNominationRequired: false,
    officialUrl: "https://si.se/en/",
    status: "WATCHLIST",
    priority: "WATCHLIST",
    assessment: "MEDIUM_MATCH",
    source: "candidate — verify",
    notes: "Verify whether Bangladesh is in the current target-country list and whether funding covers airfare/accommodation.",
  },

  // ---- NOT SUITABLE (documented reasons) ----
  {
    name: "JICA Knowledge Co-Creation Program (KCCP)",
    organization: "Japan International Cooperation Agency",
    country: "Japan",
    mode: "ONSITE",
    hrRelevance: "LOW",
    fundingLevel: "FULLY",
    fundingTerms: "Funded, but for government/counterpart officials",
    privateSectorEligible: "NO",
    govtNominationRequired: true,
    status: "NOT_SUITABLE",
    priority: "NOT_SUITABLE",
    assessment: "NOT_ELIGIBLE",
    officialUrl: "https://www.jica.go.jp/english/",
    source: "official — government-oriented",
    notes: "Government officials/counterparts only.",
  },
  {
    name: "KOICA Fellowship / CIAT",
    organization: "Korea International Cooperation Agency",
    country: "South Korea",
    mode: "ONSITE",
    hrRelevance: "LOW",
    fundingLevel: "FULLY",
    fundingTerms: "Funded, but for government officials",
    privateSectorEligible: "NO",
    govtNominationRequired: true,
    status: "NOT_SUITABLE",
    priority: "NOT_SUITABLE",
    assessment: "NOT_ELIGIBLE",
    officialUrl: "https://www.koica.go.kr/",
    source: "official — government-oriented",
    notes: "Government officials only.",
  },
  {
    name: "Malaysian Technical Cooperation Programme (MTCP)",
    organization: "Government of Malaysia",
    country: "Malaysia",
    mode: "ONSITE",
    hrRelevance: "LOW",
    fundingLevel: "FULLY",
    fundingTerms: "Funded, but for government officials of developing countries",
    privateSectorEligible: "NO",
    govtNominationRequired: true,
    status: "NOT_SUITABLE",
    priority: "NOT_SUITABLE",
    assessment: "NOT_ELIGIBLE",
    officialUrl: "https://mtcp.kln.gov.my/",
    source: "official — government-oriented",
    notes: "Government officials; nomination via ministry.",
  },
  {
    name: "Indian Technical and Economic Cooperation (ITEC)",
    organization: "Government of India",
    country: "India",
    mode: "ONSITE",
    hrRelevance: "MEDIUM",
    fundingLevel: "FULLY",
    fundingTerms: "Funded (airfare, accommodation, per diem) but requires government nomination for most civilian courses",
    privateSectorEligible: "NO",
    govtNominationRequired: true,
    status: "NOT_SUITABLE",
    priority: "NOT_SUITABLE",
    assessment: "NOT_ELIGIBLE",
    officialUrl: "https://www.itecgoi.in/",
    source: "official — nomination-based",
    notes: "Government nomination required; not suitable for a private-sector applicant without ministry nomination.",
  },
  {
    name: "Chevening Scholarships (UK)",
    organization: "UK Government (FCDO)",
    country: "United Kingdom",
    mode: "ONSITE",
    hrRelevance: "MEDIUM",
    fundingLevel: "FULLY",
    fundingTerms: "Fully funded master's (tuition, stipend, airfare) — but requires IELTS and is degree study",
    ieltsRequired: "YES",
    privateSectorEligible: "YES",
    status: "NOT_SUITABLE",
    priority: "NOT_SUITABLE",
    assessment: "NOT_ELIGIBLE",
    officialUrl: "https://www.chevening.org/",
    source: "official — IELTS required",
    notes: "IELTS is mandatory; candidate has no English certificate. Also full-time degree, not short training.",
  },
  {
    name: "SHRM / CIPD / WorldatWork / eCornell professional certifications",
    organization: "Professional bodies",
    country: "Online / self-arranged",
    mode: "ONLINE",
    hrRelevance: "HIGH",
    rewardRelevance: "HIGH",
    fundingLevel: "SELF",
    fundingTerms: "Self-funded; no airfare/accommodation (online)",
    privateSectorEligible: "YES",
    status: "NOT_SUITABLE",
    priority: "NOT_SUITABLE",
    assessment: "LOW_MATCH",
    officialUrl: "https://www.worldatwork.org/",
    source: "official — self-funded",
    notes: "Strong HR/reward relevance but self-funded and online — fails the physical + funded objective.",
  },
];

async function main() {
  let created = 0;
  for (const s of PROGRAMS) {
    const data: Record<string, unknown> = {
      name: s.name,
      organization: s.organization,
      country: s.country ?? null,
      city: s.city ?? null,
      mode: s.mode ?? "ONSITE",
      hrRelevance: s.hrRelevance ?? "MEDIUM",
      rewardRelevance: s.rewardRelevance ?? "MEDIUM",
      durationText: s.durationText ?? null,
      nextCycleNote: s.nextCycleNote ?? null,
      fundingLevel: s.fundingLevel ?? "UNVERIFIED",
      fundingScore: FUNDING_SCORE[s.fundingLevel ?? "UNVERIFIED"] ?? 0,
      coversAirfare: s.coversAirfare ?? "NOT_CONFIRMED",
      coversAccommodation: s.coversAccommodation ?? "NOT_CONFIRMED",
      coversMeals: s.coversMeals ?? "NOT_CONFIRMED",
      coversVisa: s.coversVisa ?? "NOT_CONFIRMED",
      stipendNote: s.stipendNote ?? null,
      fundingTerms: s.fundingTerms ?? null,
      ieltsRequired: s.ieltsRequired ?? "UNKNOWN",
      englishEvidenceNote: s.englishEvidenceNote ?? null,
      privateSectorEligible: s.privateSectorEligible ?? "UNKNOWN",
      govtNominationRequired: s.govtNominationRequired ?? false,
      experienceRequired: s.experienceRequired ?? null,
      nationalityNote: s.nationalityNote ?? null,
      officialUrl: s.officialUrl ?? null,
      applicationUrl: s.applicationUrl ?? s.officialUrl ?? null,
      status: s.status ?? "WATCHLIST",
      matchScore: matchScore(s),
      priority: s.priority ?? "WATCHLIST",
      assessment: s.assessment ?? "MEDIUM_MATCH",
      source: s.source ?? "official",
      sourceLastChecked: new Date(),
      notes: s.notes ?? null,
    };
    const existing = await prisma.trainingProgram.findFirst({ where: { name: s.name } });
    if (existing) await prisma.trainingProgram.update({ where: { id: existing.id }, data });
    else await prisma.trainingProgram.create({ data: data as never });
    created++;
  }
  console.log(`Seeded ${created} training programmes`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
