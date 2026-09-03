"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api";

export function CertApplyButton({ certificationId }: { certificationId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function apply() {
    setLoading(true);
    setError("");
    const res = await fetch(`${API_BASE}/api/certification-applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ certificationId }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Failed");
      return;
    }
    setResult(data.status === "APPROVED" ? "Approved" : "Preparing");
    router.push("/certifications/applications");
  }

  return (
    <div>
      <button onClick={apply} disabled={loading} className="w-full rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
        {loading ? "Preparing…" : "Apply / Prepare Application"}
      </button>
      {result && <p className="mt-1 text-xs font-medium text-emerald-700">Application {result}. Final enrolment is manual-only (USER_APPROVAL).</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
