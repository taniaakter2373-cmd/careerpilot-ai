export const dynamic = "force-dynamic";

import Link from "next/link";
import { apiGet } from "@/lib/api";
import { PageHeader, Chip, StatTile, EmptyState, Disclaimer } from "@/components/ui";

interface Program {
  id: string;
  name: string;
  organization: string | null;
  country: string | null;
  city: string | null;
  mode: string;
  hrRelevance: string;
  rewardRelevance: string;
  durationText: string | null;
  nextCycleNote: string | null;
  deadline: string | null;
  fundingLevel: string;
  fundingLabel: string;
  fundingScore: number;
  coversAirfare: string;
  coversAccommodation: string;
  coversMeals: string;
  coversVisa: string;
  stipendNote: string | null;
  fundingTerms: string | null;
  ieltsRequired: string;
  englishEvidenceNote: string | null;
  privateSectorEligible: string;
  govtNominationRequired: boolean;
  experienceRequired: string | null;
  nationalityNote: string | null;
  officialUrl: string | null;
  applicationUrl: string | null;
  status: string;
  matchScore: number;
  priority: string;
  priorityLabel: string;
  assessment: string;
  assessmentLabel: string;
  source: string | null;
  notes: string | null;
}

function cover(v: string): { label: string; tone: "emerald" | "red" | "slate" } {
  if (v === "YES") return { label: "✓", tone: "emerald" };
  if (v === "NO") return { label: "✕", tone: "red" };
  return { label: "?", tone: "slate" };
}

function CoverRow({ label, v }: { label: string; v: string }) {
  const c = cover(v);
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
      {label}
      <span className={c.tone === "emerald" ? "font-bold text-emerald-600" : c.tone === "red" ? "font-bold text-red-500" : "font-bold text-slate-400"}>
        {c.label}
      </span>
    </span>
  );
}

function ProgramCard({ p }: { p: Program }) {
  return (
    <div className="card card-hover flex flex-col p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold leading-snug text-slate-900">{p.name}</h3>
          <p className="mt-0.5 truncate text-sm text-slate-500">
            {p.organization ?? "—"}
            {p.country ? ` · ${p.country}` : ""}
            {p.city ? `, ${p.city}` : ""}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-lg font-bold text-slate-900">{p.matchScore}<span className="text-[10px] font-normal text-slate-400">/100</span></div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <Chip tone="violet">{p.assessmentLabel}</Chip>
        <Chip tone={p.mode === "ONSITE" ? "emerald" : "slate"}>{p.mode === "ONSITE" ? "✈️ On-site abroad" : p.mode}</Chip>
        <Chip tone={p.fundingLevel === "FULLY" || p.fundingLevel === "MOSTLY" ? "emerald" : p.fundingLevel === "SELF" ? "red" : "slate"}>
          {p.fundingLabel}
        </Chip>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-600">
        <div><dt className="text-slate-400">HR relevance</dt><dd className="font-medium">{p.hrRelevance}</dd></div>
        <div><dt className="text-slate-400">Reward relevance</dt><dd className="font-medium">{p.rewardRelevance}</dd></div>
        <div><dt className="text-slate-400">Duration</dt><dd className="font-medium">{p.durationText ?? "—"}</dd></div>
        <div><dt className="text-slate-400">Private sector</dt><dd className="font-medium">{p.privateSectorEligible}</dd></div>
        <div><dt className="text-slate-400">IELTS</dt><dd className="font-medium">{p.ieltsRequired}</dd></div>
        <div><dt className="text-slate-400">Govt nomination</dt><dd className="font-medium">{p.govtNominationRequired ? "Required" : "No"}</dd></div>
      </dl>

      <div className="mt-3 flex flex-wrap gap-3 border-t border-slate-100 pt-3">
        <CoverRow label="Airfare" v={p.coversAirfare} />
        <CoverRow label="Accommodation" v={p.coversAccommodation} />
        <CoverRow label="Meals" v={p.coversMeals} />
        <CoverRow label="Visa" v={p.coversVisa} />
      </div>

      {(p.stipendNote || p.fundingTerms) && (
        <p className="mt-2 rounded-lg bg-slate-50 p-2.5 text-[11px] leading-relaxed text-slate-500">
          <b>Funding terms:</b> {p.fundingTerms ?? p.stipendNote}
        </p>
      )}
      {p.experienceRequired && <p className="mt-2 text-[11px] text-slate-400">Experience: {p.experienceRequired}</p>}
      {p.nationalityNote && <p className="mt-1 text-[11px] text-slate-400">Eligibility: {p.nationalityNote}</p>}
      {p.notes && <p className="mt-2 text-[11px] italic text-slate-400">{p.notes}</p>}

      <div className="mt-4 flex items-center gap-2">
        {p.officialUrl && (
          <a href={p.officialUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-sm flex-1">
            Official source ↗
          </a>
        )}
        {p.applicationUrl && (
          <a href={p.applicationUrl} target="_blank" rel="noopener noreferrer" className="btn-primary btn-sm flex-1">
            Apply ↗
          </a>
        )}
      </div>
    </div>
  );
}

export default async function TrainingPage({ searchParams }: { searchParams: { mode?: string; funding?: string; status?: string } }) {
  const params = new URLSearchParams();
  if (searchParams.mode) params.set("mode", searchParams.mode);
  if (searchParams.funding) params.set("funding", searchParams.funding);
  if (searchParams.status) params.set("status", searchParams.status);
  const programs = await apiGet<Program[]>(`/api/training?${params.toString()}`);

  const best = programs.filter((p) => ["HIGH_MATCH", "MEDIUM_MATCH"].includes(p.assessment) && p.priority !== "NOT_SUITABLE" && p.priority !== "WATCHLIST");
  const applyNow = programs.filter((p) => p.priority === "APPLY_NOW" || (p.status === "OPEN" && p.fundingLevel !== "SELF"));
  const watchlist = programs.filter((p) => p.priority === "WATCHLIST" || p.status === "WATCHLIST");
  const notSuitable = programs.filter((p) => p.priority === "NOT_SUITABLE" || p.status === "NOT_SUITABLE");

  const pill = (active: boolean) =>
    active ? "rounded-xl bg-brand-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm" : "rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50";

  return (
    <div className="page">
      <PageHeader
        title="✈️ International Training & Fellowships"
        subtitle="Physically-attended, funded professional development abroad — HR / Total Rewards / leadership. Funding is only claimed where verified from the official source."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon="📋" label="Tracked" value={programs.length} sub="programmes" />
        <StatTile icon="✅" label="Verified fully funded" value={programs.filter((p) => p.fundingLevel === "FULLY").length} sub="airfare+stay+stipend" />
        <StatTile icon="✈️" label="On-site abroad" value={programs.filter((p) => p.mode === "ONSITE").length} sub="physical attendance" />
        <StatTile icon="🚫" label="Not suitable" value={notSuitable.length} sub="govt-only / IELTS / self-funded" />
      </div>

      <div className="card flex flex-wrap items-center gap-2 p-4">
        <span className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">View</span>
        {[
          { k: "", l: "All" },
          { k: "mode=ONSITE", l: "✈️ On-site only" },
          { k: "funding=FULLY", l: "🟢 Fully funded" },
          { k: "status=WATCHLIST", l: "🟡 Watchlist" },
          { k: "status=NOT_SUITABLE", l: "🔴 Not suitable" },
        ].map((f) => {
          const key = f.k.split("=")[0] as "mode" | "funding" | "status" | "";
          const val = f.k.split("=")[1] ?? "";
          const active = f.k === "" ? !searchParams.mode && !searchParams.funding && !searchParams.status : key !== "" && searchParams[key] === val;
          return (
            <Link key={f.k} href={`/training?${f.k}`} className={pill(Boolean(active))}>
              {f.l}
            </Link>
          );
        })}
      </div>

      {programs.length === 0 ? (
        <EmptyState icon="✈️" title="No programmes match this filter" hint="Clear the filters to see all tracked programmes." />
      ) : (
        <>
          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">A. Best opportunities</h2>
            {best.length === 0 ? <p className="text-sm text-slate-500">None currently qualify as a strong funded match.</p> : (
              <div className="card-grid">{best.map((p) => <ProgramCard key={p.id} p={p} />)}</div>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">B. Apply now (open + funded)</h2>
            {applyNow.length === 0 ? (
              <p className="text-sm text-slate-500">Nothing verified as open + funded right now — see the watchlist.</p>
            ) : (
              <div className="card-grid">{applyNow.map((p) => <ProgramCard key={p.id} p={p} />)}</div>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">C. Watchlist (closed / verify cycle)</h2>
            {watchlist.length === 0 ? <p className="text-sm text-slate-500">None.</p> : (
              <div className="card-grid">{watchlist.map((p) => <ProgramCard key={p.id} p={p} />)}</div>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-900">D. Not suitable (documented reason)</h2>
            <div className="card-grid">{notSuitable.map((p) => <ProgramCard key={p.id} p={p} />)}</div>
          </section>
        </>
      )}

      <Disclaimer>
        Funding levels are only stated where the official source explicitly covers airfare / accommodation / stipend — otherwise they are marked
        &quot;not confirmed&quot;. This is an AI-assisted tracker, not legal/immigration advice. Always verify the current cycle, eligibility and funding on the
        official programme page before applying, and never assume funding.
      </Disclaimer>
    </div>
  );
}
