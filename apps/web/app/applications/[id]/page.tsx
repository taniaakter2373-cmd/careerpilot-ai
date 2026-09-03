export const dynamic = "force-dynamic";

import Link from "next/link";
import { apiGet } from "@/lib/api";
import { ApplicationActions, ApplicationStatusBadge } from "@/components/application-actions";

interface ApplicationDetail {
  id: string;
  jobId: string;
  cvId: string | null;
  coverLetterId: string | null;
  status: string;
  applicationMethod: string;
  applicationUrl: string | null;
  applicationDate: string | null;
  job: { id: string; title: string; company: string; location: string | null; url: string; applicationUrl: string | null } | null;
  coverLetter: { id: string; content: string } | null;
  answers: { question: string; answer: string; status: string }[];
  validation: { field: string; severity: string; message: string }[];
}

export default async function ApplicationDetailPage({ params }: { params: { id: string } }) {
  const a = await apiGet<ApplicationDetail>(`/api/applications/${params.id}`);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/applications" className="text-sm text-brand-600 hover:text-brand-700">
          ← Back to applications
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-slate-900">{a.job?.title ?? "Application"}</h1>
          <ApplicationStatusBadge status={a.status} />
        </div>
        {a.job && (
          <p className="text-slate-600">
            {a.job.company}
            {a.job.location ? ` · ${a.job.location}` : ""}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {a.coverLetter && (
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold text-slate-900">Cover Letter</h2>
              <pre className="whitespace-pre-wrap text-sm text-slate-600">{a.coverLetter.content}</pre>
            </section>
          )}

          {a.answers.length > 0 && (
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold text-slate-900">Application Answers</h2>
              <table className="w-full text-left text-sm">
                <tbody className="divide-y divide-slate-100">
                  {a.answers.map((ans, i) => (
                    <tr key={i}>
                      <td className="py-2 pr-4 text-slate-500">{ans.question}</td>
                      <td className="py-2 text-slate-900">
                        {ans.status === "USER_INPUT_REQUIRED" ? (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                            USER_INPUT_REQUIRED
                          </span>
                        ) : (
                          ans.answer
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Submission</h2>
            <ApplicationActions id={a.id} status={a.status} />
            {a.applicationUrl && (
              <a
                href={a.applicationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 block rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Open Application Portal ↗
              </a>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Quality Check</h2>
            {a.validation.length === 0 ? (
              <p className="text-sm text-emerald-600">All checks passed ✓</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {a.validation.map((v, i) => (
                  <li key={i} className={v.severity === "BLOCKING" ? "text-red-600" : "text-amber-600"}>
                    {v.severity === "BLOCKING" ? "⛔" : "⚠️"} {v.message}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
