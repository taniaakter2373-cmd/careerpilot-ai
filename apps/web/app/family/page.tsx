export const dynamic = "force-dynamic";

import Link from "next/link";
import { apiGet } from "@/lib/api";
import { familyDocumentChecklist } from "@careerpilot/shared";

interface ChildProfile {
  fullName: string;
  age: number | null;
  nationality: string | null;
  passportStatus: string | null;
  currentGrade: string | null;
  preferredSchoolingLanguage: string | null;
  preferredCurriculum: string | null;
}

interface FamilyAssessment {
  id: string;
  programmeId: string;
  programmeName: string | null;
  acronym: string | null;
  country: string | null;
  overallScore: number;
  recommendation: string;
  childStatus: string;
  parentWorkStatus?: string;
  hrCareerScore: number;
  freePathway: boolean;
  studyScore: number;
  fundingScore: number;
  childScore: number;
  schoolingScore: number;
}

function recColor(r: string): string {
  switch (r) {
    case "EXCELLENT_FAMILY_PATHWAY":
      return "bg-emerald-100 text-emerald-700";
    case "STRONG_FAMILY_PATHWAY":
      return "bg-teal-100 text-teal-700";
    case "POSSIBLE_WITH_CONDITIONS":
      return "bg-amber-100 text-amber-700";
    case "HIGH_RISK":
      return "bg-orange-100 text-orange-700";
    default:
      return "bg-red-100 text-red-700";
  }
}

export default async function FamilyPage() {
  const child = await apiGet<ChildProfile | null>("/api/family/child-profile");
  const assessments = await apiGet<FamilyAssessment[]>("/api/family/assessments");
  const docs = familyDocumentChecklist(child?.passportStatus === "VALID");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Study + Family</h1>
        <p className="text-sm text-slate-500">Realistic, affordable, legal study pathways with your child</p>
        <Link href="/family/decision" className="mt-1 inline-block text-sm font-medium text-brand-600 hover:text-brand-700">
          Open full Family Decision Report (Career + Child + Relocation + Finance) →
        </Link>
      </div>

      {child && (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Child Profile</h2>
          <dl className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <div>
              <dt className="text-slate-500">Name</dt>
              <dd className="font-medium text-slate-900">{child.fullName}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Age</dt>
              <dd className="font-medium text-slate-900">{child.age != null ? `${child.age} years` : "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Nationality</dt>
              <dd className="font-medium text-slate-900">{child.nationality ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Passport</dt>
              <dd className="font-medium text-slate-900">{child.passportStatus ?? "—"}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-slate-500">Current grade</dt>
              <dd className="font-medium text-slate-900">{child.currentGrade ?? "—"}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-slate-500">Preferred schooling</dt>
              <dd className="font-medium text-slate-900">
                {child.preferredSchoolingLanguage ?? "—"}
                {child.preferredCurriculum ? ` · ${child.preferredCurriculum}` : ""}
              </dd>
            </div>
          </dl>
          <div className="mt-4">
            <Link href="/family/child" className="text-sm font-medium text-brand-600 hover:text-brand-700">
              Edit child profile →
            </Link>
          </div>
        </section>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Family Document Checklist</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Parent</h3>
            <ul className="space-y-1 text-sm">
              {docs.parent.map((d, i) => (
                <li key={i} className="flex items-center justify-between">
                  <span className="text-slate-600">{d.type}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${d.status === "VERIFIED" || d.status === "READY" ? "bg-emerald-100 text-emerald-700" : d.status === "DRAFT" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                    {d.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Child</h3>
            <ul className="space-y-1 text-sm">
              {docs.child.map((d, i) => (
                <li key={i} className="flex items-center justify-between">
                  <span className="text-slate-600">{d.type}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${d.status === "VERIFIED" || d.status === "READY" ? "bg-emerald-100 text-emerald-700" : d.status === "DRAFT" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                    {d.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-4 text-xs text-slate-500">
          Passport + Birth Certificate verified from Google Drive. All visa/school claims must be verified with official authorities.
        </p>
      </section>

      <section className="overflow-hidden rounded-xl border border-emerald-200 bg-white shadow-sm">
        <div className="border-b border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          🆓 FREE Family Pathways (study funded + free/low-cost schooling + child can accompany + parent can work)
        </div>
        {assessments.filter((a) => a.freePathway).length === 0 ? (
          <p className="p-4 text-sm text-slate-500">No free pathways currently (add IELTS to unlock more funded scholarships).</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-emerald-50 text-xs uppercase tracking-wide text-emerald-700">
              <tr>
                <th className="px-4 py-3">Country</th>
                <th className="px-4 py-3">Programme</th>
                <th className="px-4 py-3">Parent work</th>
                <th className="px-4 py-3">Child</th>
                <th className="px-4 py-3">Schooling</th>
                <th className="px-4 py-3">HR career</th>
                <th className="px-4 py-3">Family score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50">
              {assessments
                .filter((a) => a.freePathway)
                .map((a) => (
                  <tr key={a.id} className="hover:bg-emerald-50/40">
                    <td className="px-4 py-3 font-semibold text-slate-900">{a.country ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {a.programmeName ?? "—"}
                      {a.acronym ? <span className="ml-1 text-xs text-slate-400">{a.acronym}</span> : null}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{a.parentWorkStatus ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{a.childStatus}</td>
                    <td className="px-4 py-3 text-emerald-700">Free / low-cost</td>
                    <td className="px-4 py-3 text-slate-600">{a.hrCareerScore}%</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{a.overallScore}%</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
        <p className="px-4 py-2 text-xs text-slate-500">
          Verify every visa/school/fee detail with official authorities before applying. No guarantee of visa, admission or employment.
        </p>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
          Family + Parent-Work Opportunities ({assessments.length})
        </div>
        {assessments.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">Run family assessment to see opportunities.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Programme</th>
                <th className="px-4 py-3">Country</th>
                <th className="px-4 py-3">Child</th>
                <th className="px-4 py-3">Parent work</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Recommendation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assessments.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {a.programmeName ?? "—"}
                    {a.acronym ? <span className="ml-1 text-xs text-slate-400">{a.acronym}</span> : null}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{a.country ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{a.childStatus}</td>
                  <td className="px-4 py-3 text-slate-600">{a.parentWorkStatus ?? "—"}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{a.overallScore}%</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${recColor(a.recommendation)}`}>
                      {a.recommendation}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <p className="text-xs text-slate-500">
        ⚠️ All visa, work-rights and schooling figures are country-level likelihoods that must be verified with the official
        immigration/education authority before any application. No visa approval or school admission is guaranteed.
      </p>
    </div>
  );
}
