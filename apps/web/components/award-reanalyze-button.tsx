"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api";

export function ReanalyzeAwardsButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function run() {
    setBusy(true);
    setMsg("");
    const res = await fetch(`${API_BASE}/api/awards`, { method: "POST" });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setMsg("Re-analysis failed"); return; }
    setMsg(`Analyzed ${d.analyzed ?? 0} awards against your profile`);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button onClick={run} disabled={busy}
        className="rounded-lg border border-brand-600 bg-white px-4 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50 disabled:opacity-50">
        {busy ? "Analyzing…" : "⟳ Re-analyze for my profile"}
      </button>
      {msg && <span className="text-xs text-slate-500">{msg}</span>}
    </div>
  );
}
