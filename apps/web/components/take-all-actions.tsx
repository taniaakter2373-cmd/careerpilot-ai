"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api";

interface ActionRow {
  type: string;
  title: string;
  outcome: string;
  confirmation?: string;
  nextAction: string;
  url?: string | null;
}

export function TakeAllActionsButton() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ summary: any; actions: ActionRow[] } | null>(null);
  const [error, setError] = useState("");

  async function run() {
    setLoading(true);
    setError("");
    const res = await fetch(`${API_BASE}/api/auto-take-actions`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.message ?? data.error ?? "Action failed");
      return;
    }
    setResults(data);
    setConfirming(false);
    router.refresh();
  }

  if (results) {
    const s = results.summary;
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-2 font-semibold text-slate-900">
          ✅ Submitted: {s.submitted} · ⛔ Blocked: {s.blocked} · ⏸ Manual-required: {s.manualRequired}
        </div>
        <ul className="max-h-72 space-y-1 overflow-y-auto text-sm">
          {results.actions.map((r, i) => (
            <li key={i} className="border-b border-slate-100 pb-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-800">
                  {r.outcome === "SUBMITTED" ? "✅" : r.outcome === "BLOCKED" ? "⛔" : "⏸"} {r.type} · {r.title}
                </span>
                <span className="ml-2 shrink-0 text-xs text-slate-400">{r.outcome === "SUBMITTED" ? r.confirmation : ""}</span>
              </div>
              <div className="text-xs text-slate-500">{r.nextAction}</div>
              {r.url && (
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-600 hover:text-brand-700">
                  Open official portal ↗
                </a>
              )}
            </li>
          ))}
        </ul>
        <button onClick={() => setResults(null)} className="mt-3 text-sm font-medium text-brand-600 hover:text-brand-700">Done</button>
      </div>
    );
  }

  return (
    <div>
      {confirming ? (
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2">
          <span className="text-xs text-slate-600">I authorize CareerPilot to prepare, approve and record ALL pending applications. External portal steps needing payment/passport/OTP stay manual.</span>
          <button onClick={run} disabled={loading} className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
            {loading ? "Working…" : "Confirm — Take All Actions"}
          </button>
          <button onClick={() => setConfirming(false)} className="rounded bg-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700">Cancel</button>
        </div>
      ) : (
        <button onClick={() => setConfirming(true)} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
          🤖 Take All Actions (auto)
        </button>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
