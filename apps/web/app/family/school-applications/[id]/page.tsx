export const dynamic = "force-dynamic";

import Link from "next/link";
import { apiGet } from "@/lib/api";
import { SchoolStatusBadge, SchoolApplicationActions } from "@/components/school-app-actions";

interface Detail {
  id: string;
  schoolName: string | null;
  country: string | null;
  city: string | null;
  curriculum: string | null;
  website: string | null;
  tuitionFee: string | null;
  status: string;
  notes: string | null;
  confirmationNumber: string | null;
  applicationDate: string | null;
}

const CHILD_DOCS = [
  ["Child passport", "VERIFIED", "In Google Drive"],
  ["Birth certificate", "VERIFIED", "In Google Drive"],
  ["Parent-child relationship proof", "MISSING", "Request from authorities"],
  ["School records (current school)", "READY", "Request from current school"],
  ["Vaccination / health records", "MISSING", "Request from doctor"],
  ["School admission form", "MISSING", "Complete on school portal"],
  ["Parental consent", "MISSING", "Complete on school portal"],
];

export default async function SchoolAppDetailPage({ params }: { params: { id: string } }) {
  const a = await apiGet<Detail>(`/api/family/school-applications/${params.id}`);
  const isSubmitted = a.status === "SUBMITTED";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/applications" className="text-sm text-brand-600 hover:text-brand-700">
          ← Back to All Applications
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-slate-900">{a.schoolName ?? "School Application"}</h1>
          <SchoolStatusBadge status={a.status} />
        </div>
        <p className="text-slate-600">{a.city ? `${a.city}, ` : ""}{a.country ?? ""}</p>
      </div>

      {isSubmitted && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="font-semibold text-amber-900">What this status means</h2>
          <p className="mt-1 text-sm text-amber-800">
            <b>SUBMITTED</b> means this application is recorded as submitted in your CareerPilot tracker (reference{" "}
            {a.confirmationNumber ?? "—"}). It is <b>NOT</b> the school&apos;s confirmation. The <b>actual admission</b> is done
            on the school&apos;s official portal — contact their admissions office, complete their form, pay any application fee,
            and send the child&apos;s documents. The school&apos;s own reply is the real confirmation.
          </p>
        </section>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">School</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-slate-500">Curriculum</dt><dd className="text-slate-900">{a.curriculum ?? "—"}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">Tuition</dt><dd className="text-slate-900">{a.tuitionFee ?? "—"}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">Applied / recorded on</dt><dd className="text-slate-900">{a.applicationDate ? new Date(a.applicationDate).toLocaleString() : "—"}</dd></div>
          {a.confirmationNumber && <div className="flex justify-between"><dt className="text-slate-500">Tracker confirmation</dt><dd className="text-emerald-700">{a.confirmationNumber}</dd></div>}
        </dl>
        {a.website && (
          <a href={a.website} target="_blank" rel="noopener noreferrer" className="mt-4 block rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50">
            Official School Website (apply here) ↗
          </a>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-lg font-semibold text-slate-900">Child Documents Required for Admission</h2>
        <p className="mb-3 text-xs text-slate-500">For {`Zayaan`} — verify each with the school admissions office.</p>
        <ul className="space-y-1.5 text-sm">
          {CHILD_DOCS.map(([doc, status, note], i) => (
            <li key={i} className="flex items-center justify-between">
              <span className="text-slate-700">{doc}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${status === "VERIFIED" ? "bg-emerald-100 text-emerald-700" : status === "READY" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`}>
                {status}
              </span>
              <span className="w-40 text-right text-xs text-slate-400">{note}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Next Actions</h2>
        <ol className="list-decimal space-y-1.5 pl-5 text-sm text-slate-700">
          <li>Open the school&apos;s official website and find "Admissions" / "Apply".</li>
          <li>Complete their application form for the child (grade depends on age).</li>
          <li>Submit the child&apos;s documents (passport, birth certificate, school records, vaccination).</li>
          <li>Pay the school&apos;s application/admission fee (if any) — fee must be confirmed by the school.</li>
          <li>Await the school&apos;s decision — that is the real confirmation, not the tracker reference.</li>
        </ol>
        <div className="mt-4">
          <SchoolApplicationActions id={a.id} status={a.status} />
        </div>
      </section>

      <p className="text-xs text-slate-500">
        The tracker records your applications and reminders. Actual admission, fees, and school decisions always happen with the
        school itself and require your approval.
      </p>
    </div>
  );
}
