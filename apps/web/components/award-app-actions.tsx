"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api";

const COLORS: Record<string, string> = {
  DISCOVERED: "bg-slate-100 text-slate-600",
  SHORTLISTED: "bg-blue-100 text-blue-700",
  EVIDENCE_COLLECTION: "bg-amber-100 text-amber-700",
  NOMINATION_DRAFTED: "bg-violet-100 text-violet-700",
  INTERNAL_REVIEW: "bg-indigo-100 text-indigo-700",
  SUBMITTED: "bg-brand-100 text-brand-700",
  FINALIST: "bg-cyan-100 text-cyan-700",
  WINNER: "bg-emerald-100 text-emerald-700",
  NOT_SELECTED: "bg-red-100 text-red-700",
};

export function AwardStatusBadge({ status }: { status: string }) {
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${COLORS[status] ?? "bg-slate-100 text-slate-600"}`}>{status.replace(/_/g, " ")}</span>;
}

const NEXT: Record<string, string[]> = {
  DISCOVERED: ["SHORTLISTED", "EVIDENCE_COLLECTION"],
  SHORTLISTED: ["EVIDENCE_COLLECTION", "NOMINATION_DRAFTED", "NOT_SELECTED"],
  EVIDENCE_COLLECTION: ["NOMINATION_DRAFTED", "SHORTLISTED"],
  NOMINATION_DRAFTED: ["INTERNAL_REVIEW", "SUBMITTED"],
  INTERNAL_REVIEW: ["SUBMITTED", "NOMINATION_DRAFTED"],
  SUBMITTED: ["FINALIST", "NOT_SELECTED"],
  FINALIST: ["WINNER", "NOT_SELECTED"],
  WINNER: [],
  NOT_SELECTED: [],
};

export function AwardAdvanceActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const options = NEXT[status] ?? [];
  const terminal = ["WINNER", "NOT_SELECTED"].includes(status);

  async function act(next: string) {
    setBusy(true);
    setErr("");
    const res = await fetch(`${API_BASE}/api/award-applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setErr(d.message ?? d.error ?? "Failed"); return; }
    router.refresh();
  }

  if (terminal || options.length === 0) return <span className="text-xs text-slate-400">—</span>;

  return (
    <div>
      <select value="" disabled={busy} onChange={(e) => e.target.value && act(e.target.value)}
        className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs shadow-sm">
        <option value="">Advance…</option>
        {options.map((o) => <option key={o} value={o}>{o.replace(/_/g, " ")}</option>)}
      </select>
      {err && <div className="text-[10px] text-red-600">{err}</div>}
    </div>
  );
}
