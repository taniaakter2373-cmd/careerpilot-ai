"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string };
type Group = { label: string; icon?: string; items: Item[] };

const groups: Group[] = [
  {
    label: "Overview",
    icon: "✦",
    items: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/analytics", label: "Career Intelligence" },
      { href: "/deadlines", label: "Deadlines" },
    ],
  },
  {
    label: "Career",
    icon: "💼",
    items: [
      { href: "/jobs", label: "Jobs" },
      { href: "/recruiter", label: "Recruiter Contacts" },
    ],
  },
  {
    label: "Study",
    icon: "🎓",
    items: [
      { href: "/scholarships", label: "Scholarships" },
      { href: "/certifications", label: "Certifications" },
    ],
  },
  {
    label: "Family",
    icon: "👨‍👩‍👦",
    items: [
      { href: "/family", label: "Study + Family" },
      { href: "/family/decision", label: "Family Decision" },
      { href: "/family/schools", label: "Child Schooling" },
    ],
  },
  {
    label: "Europe",
    icon: "🇪🇺",
    items: [
      { href: "/europe", label: "Overview" },
      { href: "/europe/jobs", label: "Europe Jobs" },
      { href: "/europe/countries", label: "Visa & Countries" },
      { href: "/europe/ielts", label: "IELTS / English" },
      { href: "/europe/applications", label: "Applications" },
    ],
  },
  {
    label: "Awards",
    icon: "🏆",
    items: [
      { href: "/awards", label: "Global Awards" },
      { href: "/awards/applications", label: "Award Tracker" },
    ],
  },
  {
    label: "Applications",
    icon: "🗂️",
    items: [
      { href: "/applications", label: "All Applications" },
      { href: "/audit-log", label: "Audit Log" },
    ],
  },
  {
    label: "Umrah",
    icon: "🕋",
    items: [{ href: "/umrah", label: "Fully-Funded Umrah" }],
  },
  {
    label: "Profile",
    icon: "👤",
    items: [
      { href: "/resumes", label: "CV Library" },
      { href: "/profile", label: "Career Profile" },
    ],
  },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(href + "/") || pathname.startsWith(href + "?");
}

export function Nav() {
  const pathname = usePathname();
  return (
    <aside className="flex w-[17rem] shrink-0 flex-col border-r border-slate-200/80 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 via-brand-500 to-violet-500 text-sm font-extrabold tracking-tight text-white shadow-lg shadow-brand-600/25">
          CP
        </span>
        <div>
          <div className="text-[15px] font-bold leading-tight text-slate-900">CareerPilot AI</div>
          <div className="text-[11px] font-medium leading-tight text-slate-400">Jobs · Study · Awards</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4 [scrollbar-width:thin]">
        {groups.map((g) => (
          <div key={g.label}>
            <div className="mb-1 flex items-center gap-1.5 px-2">
              {g.icon && (
                <span className="flex h-4 w-4 items-center justify-center rounded-md bg-slate-100/80 text-[11px] leading-none">
                  {g.icon}
                </span>
              )}
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">{g.label}</span>
            </div>
            <div className="space-y-0.5">
              {g.items.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={
                      active
                        ? "block rounded-xl bg-brand-50 px-3 py-2 text-[13.5px] font-semibold text-brand-700 ring-1 ring-inset ring-brand-100"
                        : "block rounded-xl px-3 py-2 text-[13.5px] font-medium text-slate-600 transition hover:bg-slate-100/80 hover:text-slate-900"
                    }
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User chip */}
      <div className="border-t border-slate-100 p-3">
        <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-slate-50 to-white p-3 ring-1 ring-slate-200/70">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-violet-500 text-sm font-bold text-white shadow-sm">
            TA
          </span>
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold text-slate-800">Tania Akter</div>
            <div className="truncate text-[11px] text-slate-400">Deputy Manager · Total Rewards</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
