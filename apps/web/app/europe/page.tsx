export const dynamic = "force-dynamic";

import Link from "next/link";
import { apiGet } from "@/lib/api";

interface Overview {
  totalJobs: number;
  applyNowJobs: number;
  jobPriorityBreakdown: Record<string, number>;
  countryCards: Array<{
    country: string;
    jobCount: number;
    workPermitRoutes: Array<{ route: string; euBlueCard?: boolean; needsSponsor?: boolean }>;
    englishRequirement: { status?: string; note?: string } | null;
    notes: string | null;
  }>;
  recommended: {
    id: string;
    title: string;
    company: string | null;
    country: string;
    careerMatchScore: number;
    visaScore: number;
    jobPriority: string;
    recommendedAction: string;
  } | null;
  englishProfile: { ieltsStatus: string; ieltsOverallBand: number | null; englishProficiency: string } | null;
  disclaimer: string;
}

export default async function EuropeOverviewPage() {
  const d = await apiGet<Overview>("/api/europe");
  const p1 = d.jobPriorityBreakdown?.P1 ?? 0;
  const p2 = d.jobPriorityBreakdown?.P2 ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">🇪🇺 Europe Career Intelligence</h1>
        <p className="mt-1 text-sm text-slate-500">EU jobs + visa + IELTS analysis for Mid-Leadership HR targets</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {["Europe Jobs", "Visa & Countries", "IELTS / English", "Applications"].map((l, i) => {
          const href = ["/europe/jobs", "/europe/countries", "/europe/ielts", "/europe/applications"][i];
          return (
            <Link key={l} href={href} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
              {l}
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/europe/jobs" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-3xl">💼</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{d.totalJobs}</div>
          <div className="text-xs text-slate-400">Europe jobs found</div>
        </Link>
        <Link href="/europe/jobs?priority=P1" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-3xl">🔥</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{d.applyNowJobs}</div>
          <div className="text-xs text-slate-400">Apply Now (P1)</div>
        </Link>
        <Link href="/europe/jobs?ielts=not_required" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-3xl">🟢</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{(d.jobPriorityBreakdown?.P1 ?? 0) + (d.jobPriorityBreakdown?.P2 ?? 0)}</div>
          <div className="text-xs text-slate-400">Strong (P1+P2)</div>
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Countries</h2>
            <Link href="/europe/countries" className="text-sm font-medium text-brand-600">Visa detail →</Link>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {d.countryCards.map((c) => (
              <div key={c.country} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-800">{c.country}</span>
                  <span className="text-xs text-slate-500">{c.jobCount} jobs</span>
                </div>
                <div className="mt-1 text-[11px] text-slate-500">
                  {(c.workPermitRoutes ?? []).slice(0, 2).map((r) => r.route).join(" · ") || "Verify official routes"}
                </div>
                <div className="mt-1 text-[11px] font-medium text-slate-600">
                  {(c.englishRequirement?.note ?? "").slice(0, 90) || "English test: verify"}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Your English Profile</h2>
          {d.englishProfile ? (
            <div className="mt-2 space-y-1 text-sm text-slate-700">
              <div>IELTS Status: <b>{d.englishProfile.ieltsStatus.replace(/_/g, " ")}</b></div>
              {d.englishProfile.ieltsOverallBand ? <div>Overall: <b>{d.englishProfile.ieltsOverallBand}</b></div> : null}
              <div>Proficiency: <b>{d.englishProfile.englishProficiency.replace(/_/g, " ")}</b></div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-500">Not set — opens as &quot;Not Available&quot;, which never makes you ineligible.</p>
          )}
          <Link href="/europe/ielts" className="mt-3 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            Update IELTS / English
          </Link>
        </section>
      </div>

      {d.recommended && (
        <section className="rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 to-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">⭐ Recommended today</h2>
          <Link href={`/europe/jobs/${d.recommended.id}`} className="mt-2 block">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-slate-900">{d.recommended.title}</div>
                <div className="text-sm text-slate-500">{d.recommended.company ?? "—"} · {d.recommended.country}</div>
              </div>
              <div className="text-right text-sm">
                <div className="font-semibold text-brand-700">Career {d.recommended.careerMatchScore}% · Visa {d.recommended.visaScore}%</div>
                <div className="text-xs text-slate-500">{d.recommended.recommendedAction}</div>
              </div>
            </div>
          </Link>
        </section>
      )}

      <p className="rounded-lg border border-slate-200 bg-white p-3 text-[11px] leading-relaxed text-slate-500">{d.disclaimer}</p>
    </div>
  );
}
