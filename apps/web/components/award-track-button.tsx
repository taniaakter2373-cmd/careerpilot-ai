"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api";

export function AwardTrackButton({ awardId }: { awardId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function track() {
    setLoading(true);
    setError("");
    const res = await fetch(`${API_BASE}/api/award-applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ awardId }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Failed"); return; }
    router.push("/awards/applications");
  }

  return (
    <div className="w-10">
      <button onClick={track} disabled={loading} title="Track this award"
        className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
        {loading ? "…" : "📥"}
      </button>
      {error && <div className="text-[10px] text-red-600">{error}</div>}
    </div>
  );
}
