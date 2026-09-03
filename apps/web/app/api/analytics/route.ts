import { NextResponse } from "next/server";
import { prisma } from "@careerpilot/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const parseJson = (s: string | null) => (s ? (JSON.parse(s) as string[]) : []);
const norm = (s: string) => s.toLowerCase().trim();

export async function GET() {
  const [candidate, jobMatches, schMatches, jobs, schols] = await Promise.all([
    prisma.candidateProfile.findFirst({ include: { skills: true } }),
    prisma.jobMatch.findMany({ include: { job: true }, orderBy: { overallScore: "desc" }, take: 200 }),
    prisma.scholarshipMatch.findMany({ include: { programme: true }, orderBy: { overallScore: "desc" }, take: 200 }),
    prisma.job.findMany({ take: 500 }),
    prisma.erasmusProgramme.findMany({ take: 200 }),
  ]);

  // Top job fits
  const topJobFits = jobMatches
    .filter((m) => m.job)
    .slice(0, 10)
    .map((m) => ({
      title: m.job.title,
      company: m.job.company,
      location: m.job.location,
      score: m.overallScore,
      recommendation: m.recommendation,
      source: m.job.source,
    }));

  // Top scholarship fits (eligible only — the user only considers eligible scholarships)
  const topScholarshipFits = schMatches
    .filter((m) => m.programme && ["ELIGIBLE", "LIKELY_ELIGIBLE"].includes(m.eligibilityStatus))
    .slice(0, 10)
    .map((m) => ({
      name: m.programme.programmeName,
      acronym: m.programme.acronym,
      score: m.overallScore,
      eligibilityStatus: m.eligibilityStatus,
    }));

  // Skill gaps: skills demanded by jobs but not evidenced in the candidate profile.
  // Uses token + alias matching so "pay structure design" matches "Pay Structure & Grade Design".
  const candSkills = (candidate?.skills ?? []).map((s) => norm(s.name)).filter(Boolean);
  const STOP = new Set(["and", "the", "of", "for", "in", "to", "a", "an", "with", "&amp;"]);
  const tokens = (s: string) => new Set(s.split(/[^a-z0-9]+/).filter((w) => w.length > 1 && !STOP.has(w)));

  function skillMatches(demanded: string): boolean {
    const d = norm(demanded);
    // direct containment either way
    if (candSkills.some((c) => c.includes(d) || d.includes(c))) return true;
    // token overlap (≥50% of demanded tokens present in some candidate skill)
    const dt = tokens(d);
    if (dt.size > 0) {
      const ok = candSkills.some((c) => {
        const ct = tokens(c);
        let hits = 0;
        for (const t of dt) if (ct.has(t)) hits++;
        return hits / dt.size >= 0.5;
      });
      if (ok) return true;
    }
    // HR alias: "hr" ~ "human resources"
    const isHrDemand = /(^|[^a-z])(hr|human resources?)([^a-z]|$)/.test(d);
    if (isHrDemand) return candSkills.some((c) => /(^|[^a-z])hr([^a-z]|$)/.test(c) || c.includes("human resource"));
    return false;
  }

  const demanded = new Map<string, number>();
  for (const j of jobs) {
    for (const s of parseJson(j.skills)) {
      const k = norm(s);
      demanded.set(k, (demanded.get(k) ?? 0) + 1);
    }
  }
  const skillGaps = [...demanded.entries()]
    .filter(([k]) => !skillMatches(k))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([skill, count]) => ({ skill, count }));

  // Role demand (most common job titles)
  const titleCount = new Map<string, number>();
  for (const j of jobs) {
    const t = j.title.trim();
    titleCount.set(t, (titleCount.get(t) ?? 0) + 1);
  }
  const roleDemand = [...titleCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([title, count]) => ({ title, count }));

  // Jobs by source
  const bySource = new Map<string, number>();
  for (const j of jobs) bySource.set(j.source, (bySource.get(j.source) ?? 0) + 1);
  const jobsBySource = [...bySource.entries()].map(([source, count]) => ({ source, count }));

  // Salary ranges (by currency, from disclosed jobs)
  const salaryRanges: { currency: string; count: number; avgMin: number | null }[] = [];
  const salaryByCur = new Map<string, { total: number; count: number }>();
  for (const j of jobs) {
    if (j.salaryMin != null && j.salaryCurrency) {
      const e = salaryByCur.get(j.salaryCurrency) ?? { total: 0, count: 0 };
      e.total += j.salaryMin;
      e.count += 1;
      salaryByCur.set(j.salaryCurrency, e);
    }
  }
  for (const [currency, v] of salaryByCur) {
    salaryRanges.push({ currency, count: v.count, avgMin: Math.round(v.total / v.count) });
  }

  return NextResponse.json({
    candidate: candidate ? { skills: candidate.skills.map((s) => s.name), targetRoles: parseJson(candidate.targetRoles), yearsExperience: candidate.yearsExperience } : null,
    jobs: { total: jobs.length, bySource: jobsBySource, topFits: topJobFits, roleDemand, salaryRanges },
    scholarships: { total: schols.length, topFits: topScholarshipFits },
    skillGaps,
  });
}
