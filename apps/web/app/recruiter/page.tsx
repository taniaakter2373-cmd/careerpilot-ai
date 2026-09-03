export const dynamic = "force-dynamic";

import Link from "next/link";
import { apiGet } from "@/lib/api";

interface Contact {
  id: string;
  applicationTitle: string | null;
  recruiterName: string | null;
  recruiterEmail: string | null;
  company: string | null;
  jobTitle: string | null;
  emailSubject: string | null;
  emailSummary: string | null;
  detectedStage: string;
  nextAction: string | null;
  nextActionDate: string | null;
  actionRequired: boolean;
  status: string;
  priority: string;
  lastContactAt: string | null;
  receivedDate: string;
}

interface Data {
  contacts: Contact[];
  stages: string[];
}

function stageColor(s: string): string {
  if (["OFFER_RECEIVED", "OFFER_ACCEPTED", "JOINED"].includes(s)) return "bg-emerald-100 text-emerald-700";
  if (["HR_INTERVIEW", "TECHNICAL/ROLE_INTERVIEW", "ASSESSMENT", "FINAL_INTERVIEW"].includes(s)) return "bg-teal-100 text-teal-700";
  if (["CONTACTED", "INITIAL_SCREENING", "SALARY_DISCUSSION", "REFERENCE_CHECK", "BACKGROUND_CHECK"].includes(s)) return "bg-blue-100 text-blue-700";
  if (["REJECTED", "NO_RESPONSE"].includes(s)) return "bg-red-100 text-red-700";
  return "bg-slate-100 text-slate-600";
}

export default async function RecruiterPage() {
  const data = await apiGet<Data>("/api/recruiter-contacts");
  const actionRequired = data.contacts.filter((c) => c.actionRequired).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">📧 Recruiter Contact Tracker</h1>
        <p className="text-sm text-slate-500">Track recruiter communications and interview stages</p>
      </div>

      {actionRequired > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <span className="font-semibold text-red-700">🔴 {actionRequired} contact(s) require action</span>
        </div>
      )}

      {data.contacts.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="text-4xl">📬</div>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">No recruiter contacts yet</h2>
          <p className="mx-auto mt-1 max-w-lg text-sm text-slate-500">
            Add a recruiter contact (from an email or manually) to track the interview pipeline. Email integration connects only
            after your explicit authorization and never sends anything automatically.
          </p>
          <Link href="/recruiter/new" className="mt-4 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            + Add Recruiter Contact
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.contacts.map((c) => (
            <div key={c.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-slate-900">{c.jobTitle ?? c.company ?? "Recruiter contact"}</div>
                  <div className="text-sm text-slate-500">{c.company ?? ""}{c.applicationTitle ? ` · ${c.applicationTitle}` : ""}</div>
                </div>
                {c.actionRequired && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">ACTION</span>}
              </div>
              <div className="mt-3 space-y-1 text-sm text-slate-600">
                <div>Recruiter: {c.recruiterName ?? "—"}{c.recruiterEmail ? ` (${c.recruiterEmail})` : ""}</div>
                <div>Last contact: {c.lastContactAt ? new Date(c.lastContactAt).toLocaleDateString() : new Date(c.receivedDate).toLocaleDateString()}</div>
              </div>
              <div className="mt-3">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${stageColor(c.detectedStage)}`}>{c.detectedStage}</span>
              </div>
              {c.emailSummary && <p className="mt-2 text-xs text-slate-500">{c.emailSummary}</p>}
              {c.nextAction && (
                <div className="mt-2 text-xs">
                  <span className="font-semibold text-slate-700">Next:</span> {c.nextAction}
                  {c.nextActionDate ? ` (by ${new Date(c.nextActionDate).toLocaleDateString()})` : ""}
                </div>
              )}
              <div className="mt-3">
                <Link href={`/recruiter/${c.id}`} className="text-sm font-medium text-brand-600 hover:text-brand-700">
                  Update stage →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
