export const dynamic = "force-dynamic";

import Link from "next/link";
import { apiGet } from "@/lib/api";
import { PageHeader, Chip, Disclaimer } from "@/components/ui";
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
  applyWithoutIelts: boolean;
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
  const tone = j.jobPriority === "P1" ? "emerald" : j.jobPriority === "P2" ? "blue" : j.jobPriority === "P3" ? "amber" : "red";
  return (
    <div className="page">
      <PageHeader back="/europe/jobs" title={j.title} subtitle={`${j.company ?? "—"} · ${j.country}${j.city ? `, ${j.city}` : ""}`}>
        <Chip tone={tone}>{j.jobPriorityLabel}</Chip>
      </PageHeader>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="card-section">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Job Overview</h2>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{j.source}</span>
            </div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
              <div><dt className="text-slate-400">Company</dt><dd className="font-medium text-slate-800">{j.company ?? "—"}</dd></div>
              <div><dt className="text-slate-400">Employment</dt><dd className="font-medium text-slate-800">{j.employmentType.replace("_", " ")}</dd></div>
              <div><dt className="text-slate-400">Work mode</dt><dd className="font-medium text-slate-800">{j.remoteType.replace("_", " ")}</dd></div>
              <div><dt className="text-slate-400">Salary</dt><dd className="font-medium text-slate-800">{j.salaryText ?? "Not disclosed"}</dd></div>
              <div><dt className="text-slate-400">Relocation</dt><dd className="font-medium text-slate-800">{j.relocationLabel}</dd></div>
              <div><dt className="text-slate-400">Posted</dt><dd className="font-medium text-slate-800">{j.postedDate ? new Date(j.postedDate).toLocaleDateString() : "—"}</dd></div>
            </dl>
            {j.applicationUrl && (
              <a href={j.applicationUrl} target="_blank" rel="noopener noreferrer" className="btn-primary mt-5">
                Open job / Apply ↗
              </a>
            )}
          </section>

          <section className="card-section">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Description</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{j.description || "No description available."}</p>
          </section>

          {j.countryInfo && (
            <section className="card-section">
              <h2 className="mb-3 text-lg font-semibold text-slate-900">🛂 Visa & Work Permit — {j.country}</h2>
              {(j.countryInfo.workPermitRoutes ?? []).length === 0 ? (
                <p className="text-sm text-amber-700">No route data on file — verify on the official immigration site.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {j.countryInfo.workPermitRoutes.map((r, i) => (
                    <li key={i} className="flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-3">
                      <span className="mt-0.5 text-base">{r.euBlueCard ? "💙" : "🪪"}</span>
                      <div>
                        <div className="font-semibold text-slate-800">
                          {r.route}
                          {r.euBlueCard ? " · EU Blue Card" : ""}
                          {r.needsSponsor ? <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700">employer sponsorship</span> : null}
                        </div>
                        {r.salaryNote ? <div className="text-xs text-slate-500">{r.salaryNote}</div> : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 text-xs text-slate-400">Source: official immigration pages — verify current rules before relying on them.</p>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <section className="card-section">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Analysis</h2>
            <div className="space-y-3">
              <Bar label="Career Match" value={j.careerMatchScore} />
              <Bar label="Visa Opportunity" value={j.visaScore} />
            </div>
            <div className="mt-4 space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Visa</span>
                <Chip tone={colorTone(j.visaEligibility)}>{j.visaEligibility.replace(/_/g, " ")}</Chip>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">IELTS</span>
                {j.applyWithoutIelts ? (
                  <Chip tone="emerald">✓ Apply without IELTS</Chip>
                ) : (
                  <Chip tone="amber">English test required — verify alternatives</Chip>
                )}
              </div>
              <div className="text-xs text-slate-500">{j.sponsorshipNote}</div>
            </div>
            <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50 p-3.5 text-sm text-brand-900">
              <b>Recommended action:</b> {j.recommendedAction}
            </div>
          </section>

          <section className="card-section">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Actions</h2>
            <EuropeTrackButton europeJobId={j.id} />
            {j.sourceUrl && (
              <a href={j.sourceUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary mt-2 w-full">
                Original listing ↗
              </a>
            )}
            <Disclaimer>
              AI-based preliminary assessment — not legal or immigration advice. Final eligibility, sponsorship, work authorisation and visa approval
              depend on the country&apos;s current rules, the employer and competent authorities. IELTS is evaluated per job — its absence never blocks
              eligibility by itself.
            </Disclaimer>
          </section>
        </div>
      </div>
    </div>
  );
}

function colorTone(status: string): "emerald" | "teal" | "amber" | "blue" | "red" {
  switch (status) {
    case "LIKELY_ELIGIBLE": return "emerald";
    case "POTENTIALLY_ELIGIBLE": return "teal";
    case "REQUIRES_SPONSORSHIP": return "amber";
    case "UNLIKELY_ELIGIBLE": return "red";
    default: return "blue";
  }
}
