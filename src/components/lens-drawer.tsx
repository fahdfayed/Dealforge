"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// A lens opened over the stage you were already on.
//
// Lenses are things you consult while doing something else — what evidence
// backs this, what have we committed to, what did we say last week. Making each
// one a destination meant every consultation cost you your place in the flow,
// which is what pushed people to keep the whole deal menu visible at once.
//
// This only renders on a soft navigation, via the intercepting routes under
// @lens. A deep link or a refresh lands on the full page instead, so a lens URL
// stays shareable.
export function LensDrawer({ title, children }: { title: string; children: React.ReactNode }) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const closerRef = useRef<HTMLButtonElement>(null);

  const close = () => router.back();

  useEffect(() => {
    // Focus moves into the drawer so the keyboard is not left behind on the
    // page underneath.
    closerRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        router.back();
        return;
      }
      if (e.key !== "Tab") return;

      // Contain Tab within the panel. Without this, tabbing walks onto the
      // stage behind the overlay, which cannot be clicked.
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
    };
  }, [router]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label={`Close ${title}`}
        tabIndex={-1}
        onClick={close}
        className="absolute inset-0 cursor-default bg-slate-900/30"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex h-full w-full max-w-2xl flex-col border-l border-slate-200 bg-white shadow-xl"
      >
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          <button
            ref={closerRef}
            type="button"
            onClick={close}
            className="rounded px-2 py-1 text-sm text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            Close
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
