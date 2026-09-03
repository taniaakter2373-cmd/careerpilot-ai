export const dynamic = "force-dynamic";

import Link from "next/link";
import { apiGet } from "@/lib/api";
import { ScholarshipApplicationActions, ScholarshipStatusBadge } from "@/components/scholarship-actions";

interface Detail {
  id: string;
  status: string;
  deadline: string | null;
  scholarshipDeadline: string | null;
  applicationUrl: string | null;
  confirmationNumber: string | null;
  programme: { name: string; acronym: string | null; field: string | null; website: string | null; scholarshipAvailable: boolean; deadlineStatus: string } | null;
  motivationLetter: string;
  sop: string;
  documents: { type: string; status: string; note?: string }[];
  missingDocuments: string[];
}

export default async function ScholarshipApplicationDetailPage({ params }: { params: { id: string } }) {
  const a = await apiGet<Detail>(`/api/scholarship-applications/${params.id}`);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/scholarships/applications" className="text-sm text-brand-600 hover:text-brand-700">
          ← Back to Application Center
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-slate-900">{a.programme?.name ?? "Scholarship Application"}</h1>
          <ScholarshipStatusBadge status={a.status} />
        </div>
        {a.programme && <p className="text-slate-600">{a.programme.field}</p>}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {a.motivationLetter && (
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold text-slate-900">Motivation Letter (Draft)</h2>
              <pre className="whitespace-pre-wrap text-sm text-slate-600">{a.motivationLetter}</pre>
            </section>
          )}
          {a.sop && (
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold text-slate-900">Statement of Purpose (Draft)</h2>
              <pre className="whitespace-pre-wrap text-sm text-slate-600">{a.sop}</pre>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Application</h2>
            <ScholarshipApplicationActions id={a.id} status={a.status} />
            {a.applicationUrl && (
              <a
                href={a.applicationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 block rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Open Official Portal ↗
              </a>
            )}
            {a.confirmationNumber && (
              <p className="mt-3 text-sm text-emerald-700">Confirmation: {a.confirmationNumber}</p>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Document Checklist</h2>
            {a.documents.length === 0 ? (
              <p className="text-sm text-slate-500">No document requirements listed.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {a.documents.map((d, i) => (
                  <li key={i} className="flex items-start justify-between gap-2">
                    <span className="text-slate-700">{d.type}</span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                        d.status === "MISSING"
                          ? "bg-red-100 text-red-700"
                          : d.status === "DRAFT"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {d.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {a.missingDocuments.length > 0 && (
              <p className="mt-3 text-xs text-red-600">Missing: {a.missingDocuments.join(", ")}</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
