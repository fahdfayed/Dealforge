// Shown when a save hit a revision conflict — the Deal Twin changed since
// this page was loaded. Never silently overwritten (doc 3.2 / 15.3).
export function ConflictBanner({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      This deal was updated elsewhere since this page loaded, so your last change was not saved. Reload to see the
      current version before trying again.
    </div>
  );
}
