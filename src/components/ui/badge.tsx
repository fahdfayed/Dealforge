const COLOR_CLASSES: Record<string, string> = {
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  sky: "bg-sky-50 text-sky-700 ring-sky-600/20",
  amber: "bg-amber-50 text-amber-800 ring-amber-600/20",
  violet: "bg-violet-50 text-violet-700 ring-violet-600/20",
  slate: "bg-slate-100 text-slate-700 ring-slate-500/20",
  rose: "bg-rose-50 text-rose-700 ring-rose-600/20",
};

export function Badge({ color = "slate", children }: { color?: string; children: React.ReactNode }) {
  const classes = COLOR_CLASSES[color] ?? COLOR_CLASSES.slate;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${classes}`}>
      {children}
    </span>
  );
}
