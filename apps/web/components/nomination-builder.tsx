"use client";

import { useState } from "react";
import { API_BASE } from "@/lib/api";

export function NominationBuilder({ awardId }: { awardId: string }) {
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const [warning, setWarning] = useState("");
  const [error, setError] = useState("");

  async function build() {
    setBusy(true);
    setError("");
    setWarning("");
    const res = await fetch(`${API_BASE}/api/awards/${awardId}/nomination`, { method: "POST" });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setError(d.error ?? "Failed"); return; }
    setDraft(d.draft);
    setWarning(d.warning);
  }

  return (
    <section className="rounded-xl border border-violet-200 bg-white p-6 shadow-sm">
      <h2 className="mb-2 text-lg font-semibold text-slate-900">Prepare My Award Nomination</h2>
      <p className="mb-3 text-sm text-slate-500">AI builds a draft from verified profile data only — [Evidence Required] marks anything not on file.</p>
      {!draft && (
        <button onClick={build} disabled={busy}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50">
          {busy ? "Drafting…" : "✍️ Prepare My Nomination"}
        </button>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {draft && (
        <div>
          {warning && <p className="mb-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-700">{warning}</p>}
          <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-xs leading-relaxed text-slate-700">{draft}</pre>
          <div className="mt-3 flex gap-2">
            <button onClick={() => { setDraft(null); }} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Close</button>
          </div>
        </div>
      )}
    </section>
  );
}
