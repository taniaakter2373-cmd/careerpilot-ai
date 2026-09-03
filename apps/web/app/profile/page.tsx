"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authedFetch } from "@/lib/auth-client";

interface Profile {
  name: string;
  email: string;
  phone: string;
  location: string;
  country: string;
  currentTitle: string;
  yearsExperience: number | null;
  education: string;
  summary: string;
  noticePeriod: string;
  linkedinUrl: string;
  salaryMin: number | null;
  salaryCurrency: string;
  skills: string[];
  targetRoles: string[];
  certifications: string[];
  preferredLocations: string[];
  careerGoals: string[];
}

const empty: Profile = {
  name: "",
  email: "",
  phone: "",
  location: "",
  country: "",
  currentTitle: "",
  yearsExperience: null,
  education: "",
  summary: "",
  noticePeriod: "",
  linkedinUrl: "",
  salaryMin: null,
  salaryCurrency: "BDT",
  skills: [],
  targetRoles: [],
  certifications: [],
  preferredLocations: [],
  careerGoals: [],
};

function Field({ label, value, onChange, type = "text" }: { label: string; value: string | number | null; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
    </div>
  );
}

function ListField({ label, value, onChange }: { label: string; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <textarea
        value={value.join(", ")}
        onChange={(e) => onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
        rows={3}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        placeholder="Comma-separated"
      />
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      const res = await authedFetch("/api/candidate");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (res.ok) {
        const data = await res.json();
        if (data) setProfile({ ...empty, ...data });
      }
      setLoading(false);
    })();
  }, [router]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    const res = await authedFetch("/api/candidate", {
      method: "PUT",
      body: JSON.stringify({ ...profile, yearsExperience: Number(profile.yearsExperience) || null, salaryMin: Number(profile.salaryMin) || null }),
    });
    setSaving(false);
    setMessage(res.ok ? "Saved ✓" : "Save failed");
  }

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Career Profile</h1>
        <p className="text-sm text-slate-500">Manage your candidate profile, skills, and target roles</p>
      </div>

      <form onSubmit={save} className="space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Basic Information</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Full name" value={profile.name} onChange={(v) => setProfile({ ...profile, name: v })} />
            <Field label="Email" value={profile.email} onChange={(v) => setProfile({ ...profile, email: v })} />
            <Field label="Phone" value={profile.phone} onChange={(v) => setProfile({ ...profile, phone: v })} />
            <Field label="Current title" value={profile.currentTitle} onChange={(v) => setProfile({ ...profile, currentTitle: v })} />
            <Field label="Location" value={profile.location} onChange={(v) => setProfile({ ...profile, location: v })} />
            <Field label="Country" value={profile.country} onChange={(v) => setProfile({ ...profile, country: v })} />
            <Field label="Years of experience" value={profile.yearsExperience} onChange={(v) => setProfile({ ...profile, yearsExperience: Number(v) })} type="number" />
            <Field label="Salary (monthly)" value={profile.salaryMin} onChange={(v) => setProfile({ ...profile, salaryMin: Number(v) })} type="number" />
            <Field label="Education" value={profile.education} onChange={(v) => setProfile({ ...profile, education: v })} />
            <Field label="Notice period" value={profile.noticePeriod} onChange={(v) => setProfile({ ...profile, noticePeriod: v })} />
            <Field label="LinkedIn" value={profile.linkedinUrl} onChange={(v) => setProfile({ ...profile, linkedinUrl: v })} />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700">Summary</label>
            <textarea
              value={profile.summary}
              onChange={(e) => setProfile({ ...profile, summary: e.target.value })}
              rows={4}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Skills & Preferences</h2>
          <div className="space-y-4">
            <ListField label="Skills" value={profile.skills} onChange={(v) => setProfile({ ...profile, skills: v })} />
            <ListField label="Target roles" value={profile.targetRoles} onChange={(v) => setProfile({ ...profile, targetRoles: v })} />
            <ListField label="Certifications" value={profile.certifications} onChange={(v) => setProfile({ ...profile, certifications: v })} />
            <ListField label="Preferred locations" value={profile.preferredLocations} onChange={(v) => setProfile({ ...profile, preferredLocations: v })} />
            <ListField label="Career goals" value={profile.careerGoals} onChange={(v) => setProfile({ ...profile, careerGoals: v })} />
          </div>
        </section>

        {message && <p className="text-sm font-medium text-emerald-600">{message}</p>}
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Profile"}
        </button>
      </form>
    </div>
  );
}
