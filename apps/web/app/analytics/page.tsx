export const dynamic = "force-dynamic";

import Link from "next/link";
import { apiGet } from "@/lib/api";
import { MatchBadge } from "@/components/badges";

interface Analytics {
  jobs: {
    total: number;
    bySource: { source: string; count: number }[];
    topFits: { title: string; company: string; location: string | null; score: number; recommendation: string; source: string }[];
    roleDemand: { title: string; count: number }[];
    salaryRanges: { currency: string; count: number; avgMin: number }[];
  };
  scholarships: {
    total: number;
    topFits: { name: string; acronym: string | null; score: number; eligibilityStatus: string }[];
  };
  skillGaps: { skill: string; count: number }[];
}

export default async function AnalyticsPage() {
  const a = await apiGet<Analytics>("/api/analytics");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Career Intelligence</h1>
        <p className="text-sm text-slate-500">Which opportunities have the strongest fit — driven by real data</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-slate-500">Jobs</div>
          <div className="mt-1 text-3xl font-semibold text-slate-900">{a.jobs.total}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-slate-500">Scholarships</div>
          <div className="mt-1 text-3xl font-semibold text-slate-900">{a.scholarships.total}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-slate-500">Skill gaps</div>
          <div className="mt-1 text-3xl font-semibold text-slate-900">{a.skillGaps.length}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-slate-500">Top job fit</div>
          <div className="mt-1 text-3xl font-semibold text-slate-900">{a.jobs.topFits[0]?.score ?? 0}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Top Job Fits</h2>
          <ul className="divide-y divide-slate-100">
            {a.jobs.topFits.map((j, i) => (
              <li key={i} className="flex items-center justify-between py-2">
                <div>
                  <div className="font-medium text-slate-900">{j.title}</div>
                  <div className="text-sm text-slate-500">
                    {j.company} · {j.location ?? "—"} · {j.source}
                  </div>
                </div>
                <MatchBadge score={j.score} />
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Top Scholarship Fits</h2>
          <ul className="divide-y divide-slate-100">
            {a.scholarships.topFits.map((s, i) => (
              <li key={i} className="flex items-center justify-between py-2">
                <div>
                  <div className="font-medium text-slate-900">{s.name}</div>
                  <div className="text-sm text-slate-500">{s.eligibilityStatus}</div>
                </div>
                <MatchBadge score={s.score} />
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Skill Gaps</h2>
          <p className="mb-3 text-xs text-slate-500">Demanded by jobs but not in your profile</p>
          {a.skillGaps.length === 0 ? (
            <p className="text-sm text-slate-500">No gaps detected.</p>
          ) : (
            <ul className="space-y-2">
              {a.skillGaps.map((g, i) => (
                <li key={i} className="flex items-center justify-between">
                  <span className="text-sm text-slate-700">{g.skill}</span>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">{g.count} jobs</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Role Demand</h2>
          <ul className="space-y-2">
            {a.jobs.roleDemand.map((r, i) => (
              <li key={i} className="flex items-center justify-between">
                <span className="text-sm text-slate-700">{r.title}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{r.count}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Jobs by Source</h2>
          <ul className="space-y-2">
            {a.jobs.bySource.map((s, i) => (
              <li key={i} className="flex items-center justify-between">
                <span className="text-sm text-slate-700">{s.source}</span>
                <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">{s.count}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
