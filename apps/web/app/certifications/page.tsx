export const dynamic = "force-dynamic";

import Link from "next/link";
import { apiGet } from "@/lib/api";
import { MatchBadge } from "@/components/badges";
import { CertApplyButton } from "@/components/cert-actions";

interface Cert {
  id: string;
  name: string;
  provider: string | null;
  category: string | null;
  url: string | null;
  originalCostUsd: number;
  finalCostUsd: number;
  durationWeeks: number | null;
  mode: string | null;
  recognition: string;
  matchScore: number;
  costClass: string;
  costLabel: string;
  costEmoji: string;
  roadmap: "NOW" | "NEXT" | "LATER";
  notes: string | null;
}

const costColor: Record<string, string> = {
  FREE: "bg-emerald-100 text-emerald-700",
  FULL_SCHOLARSHIP: "bg-amber-100 text-amber-700",
  LOW_COST: "bg-blue-100 text-blue-700",
  DISCOUNTED: "bg-orange-100 text-orange-700",
  EXPENSIVE: "bg-red-100 text-red-700",
};

function RoadmapPill({ b }: { b: string }) {
  const cls = b === "NOW" ? "bg-emerald-600 text-white" : b === "NEXT" ? "bg-brand-600 text-white" : "bg-slate-200 text-slate-700";
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{b}</span>;
}

export default async function CertificationsPage({ searchParams }: { searchParams: { free?: string; cost?: string } }) {
  const params = new URLSearchParams();
  if (searchParams.free) params.set("free", searchParams.free);
  if (searchParams.cost) params.set("cost", searchParams.cost);
  const certs = await apiGet<Cert[]>(`/api/certifications?${params.toString()}`);

  const now = certs.filter((c) => c.roadmap === "NOW");
  const next = certs.filter((c) => c.roadmap === "NEXT");
  const later = certs.filter((c) => c.roadmap === "LATER");

  const filters = [
    { key: "", label: "All" },
    { key: "free=1", label: "Free / Funded / Low-Cost" },
    { key: "cost=FREE", label: "🟢 Free" },
    { key: "cost=FULL_SCHOLARSHIP", label: "🟡 Full Scholarship" },
    { key: "cost=LOW_COST", label: "🔵 Low Cost" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">🎓 Professional Certifications</h1>
        <p className="text-sm text-slate-500">Globally available certifications matched to your HR / Total Rewards profile</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <Link key={f.key} href={`/certifications?${f.key}`} className={`rounded-lg px-4 py-2 text-sm font-medium ${(searchParams.free || searchParams.cost || "") === f.key ? "bg-brand-600 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
            {f.label}
          </Link>
        ))}
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">My Certification Roadmap</h2>
        {[["NOW", now], ["NEXT", next], ["LATER", later]].map(([label, items]) => (
          <div key={String(label)} className="mb-3">
            <RoadmapPill b={String(label)} />
            <ul className="mt-1 list-inside list-disc text-sm text-slate-600">
              {(items as Cert[]).slice(0, 6).map((c) => (
                <li key={c.id}>{c.name} <span className="text-xs text-slate-400">({c.provider})</span></li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {certs.map((c) => (
          <div key={c.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-slate-900">{c.name}</h3>
              <MatchBadge score={c.matchScore} />
            </div>
            <p className="text-sm text-slate-500">{c.provider} · {c.category}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className={`rounded-full px-2.5 py-0.5 font-semibold ${costColor[c.costClass] ?? "bg-slate-100"}`}>{c.costEmoji} {c.costLabel}</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-600">
                {c.finalCostUsd <= 0 ? "USD 0" : `USD ${c.finalCostUsd}`}
                {c.originalCostUsd > 0 && c.finalCostUsd !== c.originalCostUsd ? ` (from USD ${c.originalCostUsd})` : ""}
              </span>
              <RoadmapPill b={c.roadmap} />
            </div>
            <div className="mt-2 space-y-1 text-sm text-slate-600">
              <div>⏱️ {c.durationWeeks ? `${c.durationWeeks} weeks` : "Varies"} · {c.mode}</div>
              <div>🌍 Recognition: {c.recognition}</div>
            </div>
            {c.notes && <p className="mt-2 text-xs text-slate-500">{c.notes}</p>}
            {c.url && (
              <a href={c.url} target="_blank" rel="noopener noreferrer" className="mt-3 block rounded-lg border border-slate-300 px-3 py-1.5 text-center text-sm font-medium text-slate-700 hover:bg-slate-50">
                Official Source ↗
              </a>
            )}
            <div className="mt-3">
              <CertApplyButton certificationId={c.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
