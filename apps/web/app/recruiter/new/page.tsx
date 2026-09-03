"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api";

const STAGES = [
  "CONTACTED", "INITIAL_SCREENING", "HR_INTERVIEW", "TECHNICAL/ROLE_INTERVIEW", "ASSESSMENT",
  "FINAL_INTERVIEW", "SALARY_DISCUSSION", "REFERENCE_CHECK", "BACKGROUND_CHECK",
  "OFFER_RECEIVED", "OFFER_ACCEPTED", "OFFER_REJECTED", "ON_HOLD", "REJECTED", "NO_RESPONSE", "JOINED",
];

export default function NewRecruiterPage() {
  const router = useRouter();
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [recruiterName, setRecruiterName] = useState("");
  const [recruiterEmail, setRecruiterEmail] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [stage, setStage] = useState("CONTACTED");
  const [nextAction, setNextAction] = useState("");
  const [actionRequired, setActionRequired] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    if (!company && !jobTitle) {
      setError("Company or job title is required");
      return;
    }
    const res = await fetch(`${API_BASE}/api/recruiter-contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company, jobTitle, recruiterName, recruiterEmail, emailSubject, detectedStage: stage, nextAction, actionRequired }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Failed");
      return;
    }
    router.push("/recruiter");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Add Recruiter Contact</h1>
        <p className="text-sm text-slate-500">Record a recruiter communication (from email or manual). System auto-matches it to your application.</p>
      </div>

      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company (e.g., ABC International)" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Role (e.g., Total Rewards Manager)" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <div className="grid grid-cols-2 gap-3">
          <input value={recruiterName} onChange={(e) => setRecruiterName(e.target.value)} placeholder="Recruiter name" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input value={recruiterEmail} onChange={(e) => setRecruiterEmail(e.target.value)} placeholder="Recruiter email" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder="Email subject" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <select value={stage} onChange={(e) => setStage(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
          {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input value={nextAction} onChange={(e) => setNextAction(e.target.value)} placeholder="Next action (e.g., Submit updated CV by 28 Aug)" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={actionRequired} onChange={(e) => setActionRequired(e.target.checked)} />
          🔴 Action required
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button onClick={submit} className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">Save Contact</button>
      </div>
    </div>
  );
}
