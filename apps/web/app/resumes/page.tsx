export const dynamic = "force-dynamic";

import { apiGet } from "@/lib/api";

interface Cv {
  id: string;
  name: string;
  version: number;
  targetRole: string | null;
  targetCountry: string | null;
  skills: string[];
  isDefault: boolean;
  filePath: string | null;
}

export default async function CvsPage() {
  const cvs = await apiGet<Cv[]>("/api/resumes");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">CV Library</h1>
        <p className="text-sm text-slate-500">Multiple CV versions tailored to different roles and markets</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cvs.map((cv) => (
          <div key={cv.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <h2 className="font-semibold text-slate-900">{cv.name}</h2>
              {cv.isDefault && (
                <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-700">Default</span>
              )}
            </div>
            <div className="mt-2 space-y-1 text-sm text-slate-600">
              <div>Target role: {cv.targetRole ?? "—"}</div>
              <div>Target market: {cv.targetCountry ?? "—"}</div>
              <div>Version: v{cv.version}</div>
            </div>
            {cv.skills.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {cv.skills.slice(0, 4).map((s, i) => (
                  <span key={i} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                    {s}
                  </span>
                ))}
              </div>
            )}
            {cv.filePath && (
              <a
                href={cv.filePath}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 block rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                View / Download PDF ↗
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
