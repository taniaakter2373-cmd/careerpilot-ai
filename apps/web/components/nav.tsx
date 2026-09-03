import Link from "next/link";

const groups = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/analytics", label: "Career Intelligence" },
      { href: "/deadlines", label: "Deadlines" },
    ],
  },
  {
    label: "💼 Career",
    items: [
      { href: "/jobs", label: "Jobs" },
      { href: "/recruiter", label: "Recruiter Contacts" },
    ],
  },
  {
    label: "🎓 Study",
    items: [
      { href: "/scholarships", label: "Scholarships" },
      { href: "/certifications", label: "Certifications" },
    ],
  },
  {
    label: "👨‍👩‍👦 Family",
    items: [
      { href: "/family", label: "Study + Family" },
      { href: "/family/decision", label: "Family Decision" },
      { href: "/family/schools", label: "Child Schooling" },
    ],
  },
  {
    label: "Applications",
    items: [
      { href: "/applications", label: "All Applications" },
      { href: "/audit-log", label: "Audit Log" },
    ],
  },
  {
    label: "🕋 Umrah",
    items: [{ href: "/umrah", label: "Fully-Funded Umrah" }],
  },
  {
    label: "Profile",
    items: [
      { href: "/resumes", label: "CV Library" },
      { href: "/profile", label: "Career Profile" },
    ],
  },
];

export function Nav() {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-violet-600 text-sm font-bold text-white shadow-sm">
          CP
        </span>
        <div>
          <div className="text-sm font-semibold leading-tight text-slate-900">CareerPilot AI</div>
          <div className="text-[10px] leading-tight text-slate-400">Jobs · Study · Family</div>
        </div>
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto p-3">
        {groups.map((g) => (
          <div key={g.label}>
            <div className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{g.label}</div>
            <div className="space-y-0.5">
              {g.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-slate-200 p-3">
        <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
          <div className="font-medium text-slate-700">Tania Akter</div>
          <div>Deputy Manager · Total Rewards</div>
        </div>
      </div>
    </aside>
  );
}
