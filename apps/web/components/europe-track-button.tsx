"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api";

export function EuropeTrackButton({ europeJobId }: { europeJobId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function track() {
    setLoading(true);
    setError("");
    const res = await fetch(`${API_BASE}/api/europe/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ europeJobId }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Failed"); return; }
    setCreated(data.id ?? "ok");
    router.push("/europe/applications");
  }

  return (
    <div>
      <button onClick={track} disabled={loading}
        className="w-full rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
        {loading ? "Tracking…" : "📋 Track Application"}
      </button>
      {created && <p className="mt-1 text-xs font-medium text-emerald-700">Tracked — view in Applications.</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
