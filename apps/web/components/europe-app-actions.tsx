"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api";

const COLORS: Record<string, string> = {
  DISCOVERED: "bg-slate-100 text-slate-600",
  SAVED: "bg-blue-100 text-blue-700",
  APPLICATION_PLANNED: "bg-indigo-100 text-indigo-700",
  APPLIED: "bg-brand-100 text-brand-700",
  HR_SCREENING: "bg-teal-100 text-teal-700",
  INTERVIEW: "bg-cyan-100 text-cyan-700",
  ASSESSMENT: "bg-sky-100 text-sky-700",
  FINAL_INTERVIEW: "bg-violet-100 text-violet-700",
  OFFER: "bg-emerald-100 text-emerald-700",
  VISA_PROCESSING: "bg-amber-100 text-amber-700",
  RELOCATION: "bg-lime-100 text-lime-700",
  REJECTED: "bg-red-100 text-red-700",
  WITHDRAWN: "bg-slate-200 text-slate-500",
};

export function EuropeStatusBadge({ status }: { status: string }) {
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${COLORS[status] ?? "bg-slate-100 text-slate-600"}`}>{status.replace(/_/g, " ")}</span>;
}

const NEXT: Record<string, string[]> = {
  DISCOVERED: ["SAVED", "APPLICATION_PLANNED"],
  SAVED: ["APPLICATION_PLANNED", "APPLIED", "WITHDRAWN"],
  APPLICATION_PLANNED: ["APPLIED", "WITHDRAWN"],
  APPLIED: ["HR_SCREENING", "REJECTED", "WITHDRAWN"],
  HR_SCREENING: ["INTERVIEW", "REJECTED"],
  INTERVIEW: ["ASSESSMENT", "FINAL_INTERVIEW", "REJECTED"],
  ASSESSMENT: ["FINAL_INTERVIEW", "REJECTED"],
  FINAL_INTERVIEW: ["OFFER", "REJECTED"],
  OFFER: ["VISA_PROCESSING", "REJECTED"],
  VISA_PROCESSING: ["RELOCATION", "REJECTED"],
  RELOCATION: [],
  REJECTED: [],
  WITHDRAWN: [],
};

export function EuropeAdvanceActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const options = NEXT[status] ?? [];
  const isTerminal = ["REJECTED", "WITHDRAWN", "RELOCATION"].includes(status);

  async function act(next: string) {
    setBusy(true);
    setErr("");
    const res = await fetch(`${API_BASE}/api/europe/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setErr(data.message ?? data.error ?? "Failed"); return; }
    router.refresh();
  }

  if (isTerminal || options.length === 0) return <span className="text-xs text-slate-400">—</span>;

  return (
    <div>
      <select
        value=""
        disabled={busy}
        onChange={(e) => e.target.value && act(e.target.value)}
        className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs shadow-sm"
      >
        <option value="">Advance…</option>
        {options.map((o) => <option key={o} value={o}>{o.replace(/_/g, " ")}</option>)}
      </select>
      {err && <div className="text-[10px] text-red-600">{err}</div>}
    </div>
  );
}
