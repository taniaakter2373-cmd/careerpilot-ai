export const dynamic = "force-dynamic";

import Link from "next/link";
import { apiGet } from "@/lib/api";
import { RecommendationBadge } from "@/components/badges";
import { ScholarshipApplyButton } from "@/components/scholarship-apply";

interface Programme {
  id: string;
  programmeName: string;
  acronym: string | null;
  coordinator: string | null;
  partnerUniversities: string[];
  countries: string[];
  field: string | null;
  degreeType: string | null;
  duration: string | null;
  ects: number | null;
  scholarshipAvailable: boolean;
  scholarshipDescription: string | null;
  applicationDeadline: string | null;
  scholarshipDeadline: string | null;
  programmeStart: string | null;
  languageRequirements: string | null;
  requiredDocuments: string[];
  sourceUrl: string | null;
  deadlineStatus: string;
  match: {
    overallScore: number;
    priorityScore: number;
    breakdown: Record<string, number>;
    whyFits: string[];
    eligibilityGaps: string[];
    documentGaps: string[];
    eligibilityStatus: string;
    recommendation: string;
  } | null;
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 text-sm text-slate-600">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-brand-600" style={{ width: `${value}%` }} />
      </div>
      <span className="w-10 shrink-0 text-right text-sm font-medium text-slate-900">{value}%</span>
    </div>
  );
}

const breakdownLabels: Record<string, string> = {
  academic: "Academic Fit",
  career: "Career Fit",
  subject: "Subject Fit",
  experience: "Experience",
  eligibility: "Eligibility",
  language: "Language",
  leadership: "Leadership",
  mobility: "Mobility",
};

export default async function ScholarshipDetailPage({ params }: { params: { id: string } }) {
  const p = await apiGet<Programme>(`/api/scholarships/${params.id}`);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/scholarships" className="text-sm text-brand-600 hover:text-brand-700">
            ← Back to scholarships
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">{p.programmeName}</h1>
          <p className="text-slate-600">
            {p.coordinator}
            {p.acronym ? ` · ${p.acronym}` : ""}
          </p>
        </div>
        {p.match && (
          <div className="text-right">
            <div className="text-sm text-slate-500">Programme Match</div>
            <div className="text-3xl font-bold text-slate-900">{p.match.overallScore}%</div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Overview</h2>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-slate-500">Field</dt>
                <dd className="text-slate-900">{p.field ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Degree</dt>
                <dd className="text-slate-900">{p.degreeType ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Duration</dt>
                <dd className="text-slate-900">{p.duration ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">ECTS</dt>
                <dd className="text-slate-900">{p.ects ?? "—"}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-slate-500">Mobility countries</dt>
                <dd className="text-slate-900">{p.countries.join(", ")}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-slate-500">Partner universities</dt>
                <dd className="text-slate-900">{p.partnerUniversities.join(", ")}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Key Dates</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Application deadline</dt>
                <dd className="text-slate-900">
                  {p.applicationDeadline ? new Date(p.applicationDeadline).toLocaleDateString() : "—"}
                  {p.deadlineStatus === "UNVERIFIED" && (
                    <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                      verify on official site
                    </span>
                  )}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Scholarship deadline</dt>
                <dd className="text-slate-900">
                  {p.scholarshipDeadline ? new Date(p.scholarshipDeadline).toLocaleDateString() : "—"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Programme start</dt>
                <dd className="text-slate-900">{p.programmeStart ? new Date(p.programmeStart).toLocaleDateString() : "—"}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Required Documents</h2>
            <ul className="space-y-1 text-sm text-slate-600">
              {p.requiredDocuments.map((d, i) => (
                <li key={i}>☐ {d}</li>
              ))}
            </ul>
          </section>
        </div>

        <div className="space-y-6">
          {p.match && (
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Match Breakdown</h2>
              <div className="space-y-3">
                {Object.entries(p.match.breakdown).map(([k, v]) => (
                  <Bar key={k} label={breakdownLabels[k] ?? k} value={v} />
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2">
                <RecommendationBadge recommendation={p.match.recommendation} />
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                  {p.match.eligibilityStatus}
                </span>
              </div>
              {p.match.documentGaps.length > 0 && (
                <>
                  <h3 className="mt-5 mb-2 text-sm font-semibold text-amber-700">Missing documents</h3>
                  <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
                    {p.match.documentGaps.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          )}

          {p.sourceUrl && (
            <a
              href={p.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Open Official Source ↗
            </a>
          )}
          <div className="mt-3">
            <ScholarshipApplyButton programmeId={p.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
