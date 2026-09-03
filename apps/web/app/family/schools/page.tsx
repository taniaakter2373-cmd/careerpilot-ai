export const dynamic = "force-dynamic";

import Link from "next/link";
import { apiGet } from "@/lib/api";
import { MatchBadge } from "@/components/badges";
import { SchoolApplyButton } from "@/components/school-actions";

interface School {
  id: string;
  schoolName: string;
  country: string | null;
  city: string | null;
  curriculum: string | null;
  language: string | null;
  ageRange: string | null;
  tuitionFee: string | null;
  website: string | null;
  matchScore: number;
  recommendation: string;
}

export default async function SchoolsPage() {
  const schools = await apiGet<School[]>("/api/family/schools");

  return (
    <div className="space-y-6">
      <div>
        <Link href="/family" className="text-sm text-brand-600 hover:text-brand-700">
          ← Back to Study + Family
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Child Schooling</h1>
        <p className="text-sm text-slate-500">International schools matched to your child — discover and apply</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {schools.map((s) => (
          <div key={s.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <h2 className="font-semibold text-slate-900">{s.schoolName}</h2>
              <MatchBadge score={s.matchScore} />
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {s.city ? `${s.city}, ` : ""}{s.country ?? "—"}
            </p>
            <div className="mt-3 space-y-1 text-sm text-slate-600">
              <div>📚 {s.curriculum ?? "—"}</div>
              <div>🗣️ {s.language ?? "—"} · Ages {s.ageRange ?? "—"}</div>
              <div>💵 {s.tuitionFee ?? "—"}</div>
            </div>
            {s.website && (
              <a
                href={s.website}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block text-center rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Official Website ↗
              </a>
            )}
            <div className="mt-3">
              <SchoolApplyButton schoolId={s.id} />
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-500">
        ⚠️ Tuition fees marked "requires confirmation" and admission policies must be verified with each school's admissions
        office. No admission is guaranteed.
      </p>
    </div>
  );
}
