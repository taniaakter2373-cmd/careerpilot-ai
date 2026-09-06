export const dynamic = "force-dynamic";

import { apiGet } from "@/lib/api";

interface Overview {
  countryCards: Array<{
    country: string;
    jobCount: number;
    workPermitRoutes: Array<{ route: string; euBlueCard?: boolean; needsSponsor?: boolean; salaryNote?: string | null; source?: string }>;
    salaryThresholds: Array<{ route?: string; threshold?: string; note?: string }>;
    englishRequirement: { status?: string; note?: string } | null;
    sponsorshipLikelihood: string;
    notes: string | null;
  }>;
  disclaimer: string;
}

export default async function EuropeCountriesPage() {
  const d = await apiGet<Overview>("/api/europe");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">🗺️ Visa & Country Intelligence</h1>
        <p className="text-sm text-slate-500">Work-permit routes for your EU target countries — always verify against official sources</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {d.countryCards.map((c) => (
          <section key={c.country} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">{c.country}</h2>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">{c.jobCount} jobs</span>
            </div>

            <div className="mt-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Possible work-permit routes</div>
              {(c.workPermitRoutes ?? []).length === 0 ? (
                <p className="mt-1 text-sm text-amber-700">No route data on file — check the official immigration site.</p>
              ) : (
                <ul className="mt-1 space-y-1.5">
                  {c.workPermitRoutes.map((r, i) => (
                    <li key={i} className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      <b>{r.route}</b>
                      {r.euBlueCard ? <span className="ml-1 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">EU BLUE CARD</span> : null}
                      {r.needsSponsor ? <span className="ml-1 text-xs text-slate-500">· employer sponsorship</span> : null}
                      {r.salaryNote ? <div className="text-xs text-slate-500">{r.salaryNote}</div> : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {(c.salaryThresholds ?? []).length > 0 && (
              <div className="mt-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Indicative salary thresholds</div>
                <ul className="mt-1 space-y-1 text-xs text-slate-600">
                  {c.salaryThresholds.map((s, i) => (
                    <li key={i}>{s.route ?? ""}{s.threshold ? ` — ${s.threshold}` : ""}{s.note ? ` (${s.note})` : ""}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-3 text-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">English / test</div>
              <p className="mt-1 text-slate-600">{c.englishRequirement?.note ?? "Verify current requirement."}</p>
            </div>

            {c.notes && <p className="mt-3 text-xs text-slate-400">Note: {c.notes}</p>}
          </section>
        ))}
      </div>

      <p className="rounded-lg border border-slate-200 bg-white p-3 text-[11px] leading-relaxed text-slate-500">{d.disclaimer}</p>
    </div>
  );
}
