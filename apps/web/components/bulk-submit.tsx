"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api";

interface BulkResult {
  id: string;
  type: string;
  title: string;
  outcome: "SUBMITTED" | "BLOCKED" | "SKIPPED";
  reason?: string;
  confirmationNumber?: string;
}

export function BulkSubmitButton({ pendingCount }: { pendingCount: number }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BulkResult[] | null>(null);
  const [error, setError] = useState("");

  async function run() {
    setLoading(true);
    setError("");
    const res = await fetch(`${API_BASE}/api/applications/bulk-submit`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.message ?? data.error ?? "Bulk submit failed");
      return;
    }
    setResults(data.results ?? []);
    setConfirming(false);
    router.refresh();
  }

  if (results) {
    const submitted = results.filter((r) => r.outcome === "SUBMITTED").length;
    const blocked = results.filter((r) => r.outcome === "BLOCKED").length;
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-2 font-semibold text-slate-900">
          ✅ {submitted} submitted · ⛔ {blocked} blocked
        </div>
        <ul className="max-h-64 space-y-1 overflow-y-auto text-sm">
          {results.map((r) => (
            <li key={r.type + r.id} className="flex items-start justify-between gap-2">
              <span className="text-slate-700">
                {r.outcome === "SUBMITTED" ? "✅" : "⛔"} {r.type} · {r.title}
              </span>
              <span className="shrink-0 text-xs text-slate-400">
                {r.outcome === "SUBMITTED" ? r.confirmationNumber : r.reason}
              </span>
            </li>
          ))}
        </ul>
        <button onClick={() => setResults(null)} className="mt-3 text-sm font-medium text-brand-600 hover:text-brand-700">
          Done
        </button>
      </div>
    );
  }

  return (
    <div>
      {confirming ? (
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2">
          <span className="text-xs text-slate-600">I have reviewed and authorize submitting all {pendingCount} pending applications.</span>
          <button onClick={run} disabled={loading} className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
            {loading ? "Submitting…" : "Confirm Submit All"}
          </button>
          <button onClick={() => setConfirming(false)} className="rounded bg-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700">
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          disabled={pendingCount === 0}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Submit All ({pendingCount})
        </button>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
