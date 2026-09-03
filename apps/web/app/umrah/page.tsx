export const dynamic = "force-dynamic";

import Link from "next/link";
import { apiGet } from "@/lib/api";
import { UmrahApplyButton } from "@/components/umrah-actions";
import { AddUmrahOpportunity } from "@/components/add-umrah";

interface UmrahRow {
  id: string;
  title: string;
  sponsor: string | null;
  officialUrl: string | null;
  eligibility: string | null;
  applicationDeadline: string | null;
  travelPeriod: string | null;
  coverage: {
    visa: boolean;
    roundTripFlight: boolean;
    makkahHotel: boolean;
    madinahHotel: boolean;
    food: boolean;
    transport: boolean;
    insurance: boolean | string;
    mandatoryFees: boolean;
  };
  childCovered: boolean;
  isFullyFree: boolean;
  coveragePercent: number;
  classification: string;
  classificationLabel: string;
  classificationEmoji: string;
  confidence: string;
  verified: boolean;
  status: string;
  bangladeshEligible: string;
  riskLevel: string;
  recommendable: boolean;
  coveredExpenses: string[];
  excludedExpenses: string[];
}

const COVER_LABELS: [keyof UmrahRow["coverage"], string][] = [
  ["visa", "🛂 Visa"],
  ["roundTripFlight", "✈️ Round-trip airfare"],
  ["makkahHotel", "🏨 Makkah accommodation"],
  ["madinahHotel", "🏨 Madinah accommodation"],
  ["food", "🍽️ Food / meals"],
  ["transport", "🚌 Transportation"],
  ["insurance", "🛡️ Insurance"],
  ["mandatoryFees", "📋 Mandatory fees"],
];

export default async function UmrahPage() {
  const opportunities = await apiGet<UmrahRow[]>("/api/umrah");
  const verifiedFree = opportunities.filter((o) => o.isFullyFree && o.verified && o.childCovered);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">🕋 Fully-Funded Umrah</h1>
          <p className="text-sm text-slate-500">Only verified opportunities where your total out-of-pocket cost = BDT 0</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-emerald-700">{verifiedFree.length}</div>
          <div className="text-xs text-slate-400">verified fully-free (family BDT 0)</div>
        </div>
      </div>

      <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="font-semibold text-amber-900">Strict Zero-Cost Rule</h2>
        <p className="mt-1 text-sm text-amber-800">
          An opportunity is <b>FULLY FREE</b> only if <b>every</b> mandatory expense is verified as covered: visa, round-trip
          airfare, Makkah + Madinah accommodation, food, transportation, insurance, and all mandatory fees. Nothing is assumed —
          coverage must be confirmed by the official sponsor. If no verified opportunity exists, the system honestly says so.
        </p>
      </section>

      <AddUmrahOpportunity />

      {verifiedFree.length === 0 && opportunities.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="text-4xl">🕋</div>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">NO VERIFIED 100% FREE OPPORTUNITY FOUND</h2>
          <p className="mx-auto mt-1 max-w-xl text-sm text-slate-500">
            After searching, no <b>verified fully-funded</b> Umrah opportunity (parent cost BDT 0, and child cost BDT 0 if
            travelling together) was found at this time. Commercial packages start from ~BDT 155,000 and are NOT classified as
            free. If you receive an official sponsorship with written confirmation of full coverage, add it above for strict
            verification.
          </p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {opportunities.map((o) => (
          <div key={o.id} className={`rounded-xl border p-5 shadow-sm ${o.isFullyFree && o.verified ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white"}`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-slate-900">{o.title}</h2>
                <p className="text-sm text-slate-500">{o.sponsor ?? "Sponsor"}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${o.verified ? "bg-emerald-600 text-white" : o.classification === "FREE_FOR_APPLICANT_ONLY" ? "bg-amber-100 text-amber-800" : o.classification === "EXPIRED" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"}`}>
                {o.classificationEmoji} {o.classificationLabel}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className={`rounded-full px-2 py-0.5 font-semibold ${o.bangladeshEligible === "YES" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                🇧🇩 Bangladesh: {o.bangladeshEligible}
              </span>
              <span className={`rounded-full px-2 py-0.5 font-semibold ${o.status === "OPEN" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                Status: {o.status}
              </span>
              <span className={`rounded-full px-2 py-0.5 font-semibold ${o.riskLevel === "LOW" ? "bg-emerald-100 text-emerald-700" : o.riskLevel === "MEDIUM" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                Risk: {o.riskLevel}
              </span>
            </div>

            <div className="mt-3">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Coverage</span>
                <span>{o.coveragePercent}%</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full rounded-full ${o.isFullyFree ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${o.coveragePercent}%` }} />
              </div>
            </div>

            <ul className="mt-3 space-y-1">
              {COVER_LABELS.map(([k, label]) => {
                const covered = k === "insurance" ? o.coverage.insurance === true || o.coverage.insurance === "NOT_REQUIRED" : o.coverage[k];
                return (
                  <li key={k} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{label}</span>
                    <span className={covered ? "font-medium text-emerald-700" : "font-medium text-red-600"}>{covered ? "100% Covered" : "Not covered"}</span>
                  </li>
                );
              })}
              <li className="flex items-center justify-between text-sm">
                <span className="text-slate-600">👦 Child cost</span>
                <span className={o.childCovered ? "font-medium text-emerald-700" : "font-medium text-red-600"}>{o.childCovered ? "BDT 0" : "Not covered"}</span>
              </li>
            </ul>

            {o.verified && (
              <div className="mt-3 rounded-lg bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-800">
                💰 User cost: BDT 0 · Verification: VERIFIED · Confidence: {o.confidence}
              </div>
            )}
            {o.classification === "FREE_FOR_APPLICANT_ONLY" && !o.childCovered && (
              <div className="mt-3 rounded-lg bg-amber-100 px-3 py-2 text-sm font-medium text-amber-800">
                🟡 FREE FOR APPLICANT ONLY — parent cost BDT 0, but the child is <b>NOT covered</b>. This is NOT a fully-free family Umrah.
              </div>
            )}

            {o.officialUrl && (
              <a href={o.officialUrl} target="_blank" rel="noopener noreferrer" className="mt-3 block rounded-lg border border-slate-300 px-3 py-1.5 text-center text-sm font-medium text-slate-700 hover:bg-slate-50">
                View Official Source ↗
              </a>
            )}
            {o.recommendable && (
              <div className="mt-3">
                <UmrahApplyButton umrahId={o.id} />
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-500">
        Accuracy over quantity: an opportunity is never called "FREE" unless all mandatory costs are verified as covered. No
        application, payment, passport submission or booking happens without your approval.
      </p>
    </div>
  );
}
