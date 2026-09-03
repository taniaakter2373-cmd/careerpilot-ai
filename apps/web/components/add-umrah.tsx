"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api";

const COVERS = [
  ["visa", "🛂 Visa"],
  ["roundTripFlight", "✈️ Round-trip airfare"],
  ["makkahHotel", "🏨 Makkah hotel"],
  ["madinahHotel", "🏨 Madinah hotel"],
  ["food", "🍽️ Food"],
  ["transport", "🚌 Transport"],
  ["insurance", "🛡️ Insurance (or not required)"],
  ["mandatoryFees", "📋 Mandatory fees"],
] as const;

export function AddUmrahOpportunity() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [sponsor, setSponsor] = useState("");
  const [officialUrl, setOfficialUrl] = useState("");
  const [eligibility, setEligibility] = useState("");
  const [deadline, setDeadline] = useState("");
  const [confidence, setConfidence] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [bangladeshEligible, setBangladeshEligible] = useState<"YES" | "NO" | "NOT_CONFIRMED">("NOT_CONFIRMED");
  const [coverage, setCoverage] = useState<Record<string, boolean>>({});
  const [childCovered, setChildCovered] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    if (!title || !sponsor || !officialUrl) {
      setError("Title, sponsor and official source URL are required (evidence).");
      return;
    }
    const res = await fetch(`${API_BASE}/api/umrah`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        sponsor,
        officialUrl,
        eligibility,
        applicationDeadline: deadline || null,
        confidence,
        bangladeshEligible,
        childCovered,
        coverage: { ...coverage, insurance: coverage.insurance ? true : "NOT_REQUIRED" },
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Failed to add");
      return;
    }
    setOpen(false);
    setTitle(""); setSponsor(""); setOfficialUrl(""); setEligibility(""); setDeadline("");
    setCoverage({}); setChildCovered(false);
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      {!open ? (
        <button onClick={() => setOpen(true)} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
          + Add Verified Opportunity
        </button>
      ) : (
        <div className="space-y-3">
          <h3 className="font-semibold text-slate-900">Add a Verified Umrah Sponsorship</h3>
          <p className="text-xs text-slate-500">Only add opportunities with an official source confirming full coverage. Coverage is strictly classified — nothing is assumed free.</p>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Opportunity title" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input value={sponsor} onChange={(e) => setSponsor(e.target.value)} placeholder="Sponsor organization" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input value={officialUrl} onChange={(e) => setOfficialUrl(e.target.value)} placeholder="Official source URL (evidence)" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input value={eligibility} onChange={(e) => setEligibility(e.target.value)} placeholder="Eligibility (e.g., Bangladeshi citizen)" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <div className="flex gap-2 text-sm">
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <select value={confidence} onChange={(e) => setConfidence(e.target.value as any)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="LOW">Confidence: LOW</option>
              <option value="MEDIUM">Confidence: MEDIUM</option>
              <option value="HIGH">Confidence: HIGH</option>
            </select>
            <select value={bangladeshEligible} onChange={(e) => setBangladeshEligible(e.target.value as any)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="NOT_CONFIRMED">Bangladesh: NOT CONFIRMED</option>
              <option value="YES">Bangladesh: YES</option>
              <option value="NO">Bangladesh: NO</option>
            </select>
          </div>
          <div>
            <div className="mb-1 text-sm font-medium text-slate-700">Covered expenses (confirm each)</div>
            <div className="grid grid-cols-2 gap-1">
              {COVERS.map(([k, label]) => (
                <label key={k} className="flex items-center gap-2 rounded border border-slate-200 px-2 py-1 text-sm">
                  <input type="checkbox" checked={!!coverage[k]} onChange={(e) => setCoverage({ ...coverage, [k]: e.target.checked })} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            <label className="mt-2 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={childCovered} onChange={(e) => setChildCovered(e.target.checked)} />
              👦 Child cost also covered (BDT 0)
            </label>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button onClick={submit} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">Save for strict verification</button>
            <button onClick={() => setOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
