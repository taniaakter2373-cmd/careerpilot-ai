import Link from "next/link";

export function PageHeader({
  back,
  title,
  subtitle,
  children,
}: {
  back?: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-header">
      <div className="min-w-0">
        {back && (
          <Link href={back} className="mb-1 inline-flex items-center gap-1 text-sm font-medium text-slate-400 transition hover:text-brand-600">
            ← Back
          </Link>
        )}
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-sub">{subtitle}</p>}
      </div>
      {children && <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function Chip({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: "slate" | "blue" | "emerald" | "amber" | "red" | "violet" | "teal" | "brand" | "orange";
}) {
  const map: Record<string, string> = {
    slate: "bg-slate-100 text-slate-600",
    blue: "bg-blue-50 text-blue-700 ring-blue-600/10",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
    teal: "bg-teal-50 text-teal-700 ring-teal-600/10",
    amber: "bg-amber-50 text-amber-700 ring-amber-600/10",
    orange: "bg-orange-50 text-orange-700 ring-orange-600/10",
    red: "bg-red-50 text-red-700 ring-red-600/10",
    violet: "bg-violet-50 text-violet-700 ring-violet-600/10",
    brand: "bg-brand-50 text-brand-700 ring-brand-600/10",
  };
  return (
    <span className={`chip ring-1 ring-inset ${map[tone] ?? map.slate}`}>{children}</span>
  );
}

export function StatTile({
  icon,
  label,
  value,
  sub,
  href,
}: {
  icon?: string;
  label: string;
  value: React.ReactNode;
  sub?: string;
  href?: string;
}) {
  const inner = (
    <div className="card flex items-center gap-4 p-5 transition duration-200 hover:border-slate-300 hover:shadow-card">
      {icon && (
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 text-2xl ring-1 ring-inset ring-slate-200/70">
          {icon}
        </span>
      )}
      <div className="min-w-0">
        <div className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</div>
        <div className="mt-0.5 truncate text-2xl font-bold tracking-tight text-slate-900">{value}</div>
        {sub && <div className="mt-0.5 truncate text-xs text-slate-400">{sub}</div>}
      </div>
    </div>
  );
  return href ? (
    <Link href={href} className="block">
      {inner}
    </Link>
  ) : (
    inner
  );
}

export function EmptyState({ icon = "📭", title, hint }: { icon?: string; title: string; hint?: string }) {
  return (
    <div className="card flex flex-col items-center justify-center gap-2 border-dashed p-12 text-center">
      <span className="text-4xl">{icon}</span>
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      {hint && <p className="max-w-md text-sm text-slate-400">{hint}</p>}
    </div>
  );
}

export function Disclaimer({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-amber-200/70 bg-amber-50/70 px-4 py-3 text-xs leading-relaxed text-amber-800">
      {children}
    </p>
  );
}
