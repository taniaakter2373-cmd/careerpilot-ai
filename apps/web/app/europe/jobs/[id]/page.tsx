export const dynamic = "force-dynamic";

import Link from "next/link";
import { apiGet } from "@/lib/api";
import { EuropeTrackButton } from "@/components/europe-track-button";

interface Detail {
  id: string;
  title: string;
  company: string | null;
  companyUrl: string | null;
  country: string;
  city: string | null;
  description: string;
  source: string;
  sourceUrl: string | null;
  applicationUrl: string | null;
  employmentType: string;
  remoteType: string;
  salaryText: string | null;
  careerMatchScore: number;
  visaScore: number;
  visaEligibility: string;
  ieltsStatus: string;
  ieltsLabel: string;
  sponsorshipDetected: string;
  sponsorshipNote: string;
  relocationMentioned: string;
  relocationLabel: string;
  jobPriority: string;
  jobPriorityLabel: string;
  recommendedAction: string;
  postedDate: string | null;
  countryInfo: {
    workPermitRoutes: Array<{ route: string; euBlueCard?: boolean; needsSponsor?: boolean; salaryNote?: string | null }>;
    englishRequirement: { status?: string; note?: string } | null;
    notes: string | null;
  } | null;
}

function color(status: string): string {
  switch (status) {
    case "LIKELY_ELIGIBLE": return "bg-emerald-100 text-emerald-700";
    case "POTENTIALLY_ELIGIBLE": return "bg-teal-100 text-teal-700";
    case "REQUIRES_SPONSORSHIP": return "bg-amber-100 text-amber-700";
    case "UNLIKELY_ELIGIBLE": return "bg-red-100 text-red-700";
    default: return "bg-slate-100 text-slate-600";
  }
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs">
        <span className="text-slate-500">{label}</span>
        <span className="font-medium text-slate-900">{value}%</span>
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-slate-100">
        <div className="h-1.5 rounded-full bg-brand-600" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default async function EuropeJobDetailPage({ params }: { params: { id: string } }) {
  const j = await apiGet<Detail>(`/api/europe/jobs/${params.id}`);
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/europe/jobs" className="text-sm text-brand-600 hover:text-brand-700">← Back to Europe jobs</Link>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">{j.title}</h1>
          <p className="text-slate-600">{j.company ?? "—"} · {j.country}{j.city ? `, ${j.city}` : ""}</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-500">{j.jobPriorityLabel}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Job Overview</h2>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-slate-500">Company</dt><dd className="text-slate-900">{j.company ?? "—"}</dd></div>
              <div><dt className="text-slate-500">Source</dt><dd className="text-slate-900">{j.source}</dd></div>
              <div><dt className="text-slate-500">Employment</dt><dd className="text-slate-900">{j.employmentType.replace("_", " ")}</dd></div>
              <div><dt className="text-slate-500">Work mode</dt><dd className="text-slate-900">{j.remoteType.replace("_", " ")}</dd></div>
              <div><dt className="text-slate-500">Salary</dt><dd className="text-slate-900">{j.salaryText ?? "Not disclosed"}</dd></div>
              <div><dt className="text-slate-500">Relocation</dt><dd className="text-slate-900">{j.relocationLabel}</dd></div>
            </dl>
            {j.applicationUrl && (
              <a href={j.applicationUrl} target="_blank" rel="noopener noreferrer"
                className="mt-4 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
                Open Job / Apply ↗
              </a>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Description</h2>
            <p className="whitespace-pre-line text-sm text-slate-600">{j.description || "No description available."}</p>
          </section>

          {j.countryInfo && (
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold text-slate-900">Visa & Work Permit — {j.country}</h2>
              {(j.countryInfo.workPermitRoutes ?? []).length === 0 ? (
                <p className="text-sm text-amber-700">No route data on file — verify on the official immigration site.</p>
              ) : (
                <ul className="space-y-2 text-sm text-slate-700">
                  {j.countryInfo.workPermitRoutes.map((r, i) => (
                    <li key={i} className="rounded-lg bg-slate-50 px-3 py-2">
                      <b>{r.route}</b>{r.euBlueCard ? " · EU Blue Card route" : ""}
                      {r.needsSponsor ? " · needs employer sponsorship" : ""}
                      {r.salaryNote ? <div className="text-xs text-slate-500">{r.salaryNote}</div> : null}
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 text-xs text-slate-500">Source: official immigration pages — verify current rules before relying on them.</p>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Analysis</h2>
            <div className="space-y-3">
              <Bar label="Career Match" value={j.careerMatchScore} />
              <Bar label="Visa Opportunity" value={j.visaScore} />
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Visa</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${color(j.visaEligibility)}`}>{j.visaEligibility.replace(/_/g, " ")}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">IELTS</span>
                <span className="text-xs font-semibold text-slate-800">{j.ieltsLabel}</span>
              </div>
              <div className="text-xs text-slate-500">{j.sponsorshipNote}</div>
            </div>
            <div className="mt-4 rounded-lg border border-brand-200 bg-brand-50 p-3 text-sm text-brand-900">
              <b>Recommended action:</b> {j.recommendedAction}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Actions</h2>
            <EuropeTrackButton europeJobId={j.id} />
            {j.sourceUrl && (
              <a href={j.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 block text-center rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Original listing ↗
              </a>
            )}
            <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
              AI-based preliminary assessment — not legal or immigration advice. Final eligibility, sponsorship, work authorisation and visa approval depend on the country&apos;s current rules, the employer and competent authorities. IELTS is evaluated per job/route — its absence never blocks eligibility by itself.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
