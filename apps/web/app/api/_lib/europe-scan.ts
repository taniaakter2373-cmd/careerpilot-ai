import { prisma } from "@careerpilot/database";
import { JobSourceRegistry, defaultSources, normalizeJob } from "@careerpilot/job-sources";
import { isBlockedCompany, isHrRole, scoreJob, type CandidateForMatching } from "@careerpilot/matching";
import { detectRelocationSupport, detectSponsorship, europeJobPriority, evaluateIelts, parseJobEnglishSignals, visaScore, type WorkPermitRoute } from "@careerpilot/shared";
import { EUROPE_PRIORITY_COUNTRIES } from "./europe";

const parseJson = <T = unknown[]>(s: string | null, fb: T): T => (s ? (JSON.parse(s) as T) : fb);

/**
 * Pull live EU-priority-country HR jobs from the registered sources, run the
 * full visa + IELTS + sponsorship analysis and store new EuropeJob rows.
 * Used by both the Europe scan API and the daily refresh cron.
 */
export async function runEuropeScan(): Promise<{ found: number; added: number; skipped: number; sourceResults: Array<{ source: string; jobs: number; error: string | null }> }> {
  const cand = await prisma.candidateProfile.findFirst({ include: { skills: true } });
  const english = cand ? await prisma.englishProfile.findUnique({ where: { candidateId: cand.id } }).catch(() => null) : null;
  if (!cand) return { found: 0, added: 0, skipped: 0, sourceResults: [] };

  const c: CandidateForMatching = {
    currentTitle: cand.currentTitle,
    yearsExperience: cand.yearsExperience,
    skills: cand.skills.map((s) => s.name),
    targetRoles: parseJson<string[]>(cand.targetRoles, []),
    industries: [],
    preferredLocations: parseJson<string[]>(cand.preferredLocations, []),
    education: cand.education,
    salaryExpectation: { min: null, currency: null },
    careerGoals: [],
  };
  const eng = english
    ? {
        ieltsStatus: english.ieltsStatus,
        ieltsOverallBand: english.ieltsOverallBand,
        otherEnglishTest: english.otherEnglishTest,
        toeflScore: english.toeflScore,
        pteScore: english.pteScore,
        duolingoScore: english.duolingoScore,
        englishProficiency: english.englishProficiency,
      }
    : null;

  const ruleRows = await prisma.europeCountryIntelligence.findMany();
  const ruleMap: Record<string, { englishTestForVisa: boolean; routes: WorkPermitRoute[] }> = {};
  for (const r of ruleRows) {
    ruleMap[r.country] = {
      englishTestForVisa: (parseJson<{ status?: string } | null>(r.englishRequirement, null)?.status ?? "") === "TEST_REQUIRED",
      routes: parseJson<WorkPermitRoute[]>(r.workPermitRoutes, []),
    };
  }

  const registry = new JobSourceRegistry();
  for (const s of defaultSources({ ENABLE_BDJOBS: "false" })) registry.register(s);

  const { jobs: foundJobs, results } = await registry.search({
    roles: ["HR Manager", "HR Business Partner", "People Manager", "Compensation & Benefits Manager", "Total Rewards Manager", "HR Operations Manager", "Talent Management"],
    countries: EUROPE_PRIORITY_COUNTRIES,
  });

  const existing = await prisma.europeJob.findMany({ select: { sourceUrl: true } });
  const urls = new Set(existing.map((j) => j.sourceUrl).filter(Boolean) as string[]);

  let added = 0;
  let skipped = 0;
  for (const rawJob of foundJobs) {
    const job = normalizeJob(rawJob);
    if (!job.country || !EUROPE_PRIORITY_COUNTRIES.includes(job.country) || !isHrRole(job.title) || isBlockedCompany(job.company) || !job.url || urls.has(job.url)) {
      skipped++;
      continue;
    }
    const rule = ruleMap[job.country];
    const signals = parseJobEnglishSignals(job.description);
    const ielts = evaluateIelts(signals, rule?.englishTestForVisa ?? false, eng);
    const sponsor = detectSponsorship(job.description);
    const reloc = detectRelocationSupport(job.description);
    const m = scoreJob(c, job);
    const visa = visaScore({
      salaryAnnualLocal: null,
      salaryCurrency: null,
      yearsExperience: c.yearsExperience,
      hasBachelors: Boolean(c.education),
      sponsorship: sponsor.status,
      englishOk: ielts.applyImmediately,
      route: rule?.routes?.[0] ?? null,
    });
    const pr = europeJobPriority({
      careerMatch: m.overallScore,
      visaScore: visa.score,
      sponsorship: sponsor.status,
      noIeltsBarrier: ielts.applyImmediately,
      ieltsGap: ielts.eligibilityImpact === "GAP",
      relocation: reloc.status,
    });

    await prisma.europeJob.create({
      data: {
        source: job.source,
        sourceUrl: job.url,
        title: job.title,
        company: job.company,
        companyUrl: job.companyUrl,
        country: job.country,
        city: job.city,
        description: job.description.slice(0, 8000),
        skills: JSON.stringify(job.skills),
        requirements: JSON.stringify(job.requirements),
        applicationUrl: job.applicationUrl ?? job.url,
        employmentType: job.employmentType,
        remoteType: job.remoteType,
        careerMatchScore: m.overallScore,
        visaScore: visa.score,
        ieltsStatus: ielts.status,
        visaEligibility: visa.eligibility,
        sponsorshipDetected: sponsor.status,
        relocationMentioned: reloc.status,
        englishMentioned: signals.englishRequired ? "REQUIRED" : "NOT_MENTIONED",
        ieltsMentioned: signals.ieltsExplicitlyRequired ? "REQUIRED" : (signals.alternativeTestsAccepted ?? []).length ? "ALTERNATIVE_ACCEPTED" : "NOT_MENTIONED",
        jobPriority: pr.priority,
        recommendedAction: pr.recommendedAction,
        status: m.overallScore >= 60 ? "MATCHED" : "NEW",
        sourceLastChecked: new Date(),
      },
    });
    urls.add(job.url);
    added++;
  }

  return {
    found: foundJobs.length,
    added,
    skipped,
    sourceResults: results.map((r) => ({ source: r.source, jobs: r.jobs.length, error: r.error })),
  };
}
