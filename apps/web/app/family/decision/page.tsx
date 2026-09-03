export const dynamic = "force-dynamic";

import Link from "next/link";
import { apiGet } from "@/lib/api";

interface Report {
  country: string;
  study: { programmeName: string | null; acronym: string | null; scholarship: string; familyScore: number };
  parentWork: { status: string; note: string | null };
  hrCareer: { score: number; hrJobsInCountry: number };
  child: { status: string; schooling: string | null; feeLevel: string; freeSchooling: boolean };
  schools: { name: string; city: string | null; curriculum: string | null; fee: string | null; website: string | null }[];
  finances: { scholarshipStipend: number; parentWorkIncome: number; totalIncome: number; familyLivingCost: number; netAnnual: number; currency: string };
  freePathway: boolean;
  recommendation: string;
  riskFlags: string[];
  sources: (string | null)[];
}

const fmt = (n: number) => `${n.toLocaleString()} ${"€"}`;

function statusColor(s: string): string {
  if (s === "LEGALLY_AVAILABLE" || s === "CONFIRMED" || s === "LIKELY") return "bg-emerald-100 text-emerald-700";
  if (s === "NOT_PERMITTED") return "bg-red-100 text-red-700";
  if (s === "COUNTRY_SPECIFIC" || s === "UNCERTAIN") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

function Factor({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-1.5 text-sm last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className={good === false ? "font-medium text-red-600" : "font-medium text-slate-900"}>{value}</span>
    </div>
  );
}

export default async function FamilyDecisionPage() {
  const reports = await apiGet<Report[]>("/api/family/decision-report");

  return (
    <div className="space-y-6">
      <div>
        <Link href="/family" className="text-sm text-brand-600 hover:text-brand-700">
          ← Back to Study + Family
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Family Decision Report</h1>
        <p className="text-sm text-slate-500">
          Career + Child Education + Family Relocation + Financial Feasibility — combined per country
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {reports.map((r) => (
          <section key={r.country} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
              <h2 className="text-lg font-semibold text-slate-900">
                {r.country}
                {r.freePathway && (
                  <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">FREE PATHWAY</span>
                )}
              </h2>
              <div className="text-right">
                <div className="text-xs text-slate-500">Family Score</div>
                <div className="text-2xl font-bold text-slate-900">{r.study.familyScore}%</div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-0 p-4 md:grid-cols-2 md:gap-4">
              <div>
                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">🎓 Study + Scholarship</h3>
                <Factor label="Programme" value={r.study.programmeName ?? "—"} />
                <Factor label="Scholarship" value={r.study.scholarship} good={r.study.scholarship === "Funded"} />
                <Factor label="Recommendation" value={r.recommendation} />
              </div>
              <div>
                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">💼 Career</h3>
                <Factor label="Parent work" value={r.parentWork.status + (r.parentWork.note ? ` · ${r.parentWork.note}` : "")} good={r.parentWork.status === "LEGALLY_AVAILABLE"} />
                <Factor label="HR career opportunity" value={`${r.hrCareer.score}%`} />
                <Factor label="HR jobs in country" value={`${r.hrCareer.hrJobsInCountry}`} />
              </div>
              <div>
                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">👶 Child</h3>
                <Factor label="Accompaniment" value={r.child.status} good={r.child.status === "CONFIRMED" || r.child.status === "LIKELY"} />
                <Factor label="Schooling type" value={r.child.schooling ?? "—"} />
                <Factor label="Fee level" value={r.child.feeLevel} good={r.child.freeSchooling} />
              </div>
              <div>
                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">💶 Financial Feasibility (estimate)</h3>
                <Factor label="Scholarship stipend" value={`${fmt(r.finances.scholarshipStipend)}/yr`} />
                <Factor label="Parent work income" value={`${fmt(r.finances.parentWorkIncome)}/yr`} />
                <Factor label="Family living cost" value={`${fmt(r.finances.familyLivingCost)}/yr`} />
                <Factor label="Net position" value={`${fmt(r.finances.netAnnual)}/yr`} good={r.finances.netAnnual >= 0} />
              </div>
            </div>

            {r.schools.length > 0 && (
              <div className="border-t border-slate-100 px-4 py-3">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">🏫 Child Schools</h3>
                <ul className="space-y-1 text-sm">
                  {r.schools.map((s, i) => (
                    <li key={i} className="flex items-center justify-between">
                      <span className="text-slate-700">{s.name}</span>
                      {s.website && (
                        <a href={s.website} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-600 hover:text-brand-700">
                          ↗
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {r.riskFlags.length > 0 && (
              <div className="border-t border-red-100 bg-red-50 px-4 py-2">
                <span className="text-xs font-semibold text-red-700">Risks: </span>
                <span className="text-xs text-red-700">{r.riskFlags.join(" · ")}</span>
              </div>
            )}
          </section>
        ))}
      </div>

      <p className="text-xs text-slate-500">
        All financial figures are estimates requiring verification. Visa, work-rights, scholarship and schooling details must be
        confirmed with official authorities. No guarantee of visa, admission, scholarship or employment.
      </p>
    </div>
  );
}
