export const dynamic = "force-dynamic";

import Link from "next/link";
import { apiGet } from "@/lib/api";
import { AwardTrackButton } from "@/components/award-track-button";
import { NominationBuilder } from "@/components/nomination-builder";

interface Detail {
  id: string;
  name: string;
  organization: string | null;
  region: string | null;
  country: string | null;
  category: string | null;
  year: string | null;
  description: string | null;
  eligibility: string | null;
  officialUrl: string | null;
  applicationUrl: string | null;
  entryFeeUsd: number | null;
  feeNote: string | null;
  deadline: string | null;
  deadlineStatus: string;
  nominationType: string;
  judgingCriteria: string | null;
  evidenceRequired: string | null;
  eligibilityScore: number;
  profileFitScore: number;
  evidenceStrength: number;
  competitive: string;
  competitiveLabel: string;
  awardPriority: string;
  awardPriorityLabel: string;
  recommendedAction: string;
  missingEvidence: string[];
  disclaimer: string;
}

function scorePill(n: number): string {
  if (n >= 85) return "bg-emerald-100 text-emerald-700";
  if (n >= 70) return "bg-teal-100 text-teal-700";
  if (n >= 55) return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs">
        <span className="text-slate-500">{label}</span>
        <span className="font-medium text-slate-900">{value}%</span>
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-slate-100">
        <div className="h-1.5 rounded-full bg-violet-600" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default async function AwardDetailPage({ params }: { params: { id: string } }) {
  const a = await apiGet<Detail>(`/api/awards/${params.id}`);
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/awards" className="text-sm text-brand-600 hover:text-brand-700">← Back to awards</Link>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">🏆 {a.name}</h1>
          <p className="text-slate-600">{a.organization ?? "—"} · {[a.region, a.country, a.category, a.year].filter(Boolean).join(" · ")}</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-slate-800">{a.awardPriorityLabel}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {a.description && (
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold text-slate-900">Award Overview</h2>
              <p className="text-sm text-slate-600">{a.description}</p>
            </section>
          )}
          {a.eligibility && (
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold text-slate-900">Eligibility</h2>
              <p className="whitespace-pre-line text-sm text-slate-600">{a.eligibility}</p>
              <p className="mt-2 text-xs text-amber-600">Do not rely on this alone — confirm current-cycle eligibility on the official source.</p>
            </section>
          )}
          {a.judgingCriteria && (
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold text-slate-900">Judging Criteria</h2>
              <p className="text-sm text-slate-600">{a.judgingCriteria}</p>
            </section>
          )}

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Missing Evidence</h2>
            {a.missingEvidence.length === 0 ? (
              <p className="text-sm text-emerald-700">Your profile evidences the key achievement areas. Add measurable impact numbers to strengthen the nomination.</p>
            ) : (
              <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
                {a.missingEvidence.map((m) => <li key={m}>{m}</li>)}
              </ul>
            )}
          </section>

          <NominationBuilder awardId={a.id} />
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">My Match</h2>
            <div className="space-y-3">
              <Bar label="Eligibility" value={a.eligibilityScore} />
              <Bar label="Profile Fit" value={a.profileFitScore} />
              <Bar label="Evidence Strength" value={a.evidenceStrength} />
            </div>
            <div className="mt-3 text-sm">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${scorePill(a.evidenceStrength)}`}>{a.competitiveLabel}</span>
            </div>
            <div className="mt-3 rounded-lg border border-violet-200 bg-violet-50 p-3 text-sm text-violet-900">
              <b>Recommended action:</b> {a.recommendedAction}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Cost & Deadline</h2>
            <dl className="space-y-1 text-sm">
              <div><dt className="inline text-slate-500">Fee: </dt><dd className="inline text-slate-900">{a.entryFeeUsd != null ? `USD ${a.entryFeeUsd}` : "Verify on official source"}{a.feeNote ? ` — ${a.feeNote}` : ""}</dd></div>
              <div><dt className="inline text-slate-500">Deadline: </dt><dd className="inline text-slate-900">{a.deadline ? new Date(a.deadline).toLocaleDateString() : "Verify"}</dd></div>
              <div><dt className="inline text-slate-500">Nomination: </dt><dd className="inline text-slate-900">{a.nominationType.replace(/_/g, " ")}</dd></div>
              {a.deadlineStatus === "UNVERIFIED" && <div className="text-xs text-amber-600">⚠️ Deadline unverified — check official source</div>}
            </dl>
            <div className="mt-3 flex gap-2">
              <AwardTrackButton awardId={a.id} />
            </div>
            {(a.officialUrl || a.applicationUrl) && (
              <a href={a.applicationUrl ?? a.officialUrl ?? "#"} target="_blank" rel="noopener noreferrer"
                className="mt-2 block rounded-lg border border-slate-300 px-3 py-1.5 text-center text-sm font-medium text-slate-700 hover:bg-slate-50">
                Official Application Source ↗
              </a>
            )}
          </section>

          <p className="rounded-lg bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-500">{a.disclaimer}</p>
        </div>
      </div>
    </div>
  );
}
