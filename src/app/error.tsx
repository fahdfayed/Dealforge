"use client";

import Link from "next/link";
import { useEffect } from "react";

// What a reader sees when a server action or page throws.
//
// Authorization refusals land here, and so does a genuine fault, which is why
// the wording does not claim to know which. Next replaces server error messages
// with a generic string in production and gives the client only a digest, so
// this cannot show the real reason even when it has one — promising a
// diagnosis it cannot deliver would be worse than admitting the limit.
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // The server log holds the real message; the digest is what ties this
    // screen to that entry.
    console.error("Unhandled error", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg py-16">
      <h1 className="text-xl font-semibold text-slate-900">That did not go through</h1>
      <p className="mt-2 text-sm text-slate-600">
        Either your role does not allow it, or something went wrong on our side. If you were
        expecting to be able to do this, ask an administrator to check your role.
      </p>

      {error.digest && (
        <p className="mt-4 text-xs text-slate-400">
          Reference <span className="font-mono tabular-nums">{error.digest}</span> — quote this if
          you report it, it identifies the entry in the server log.
        </p>
      )}

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          Back to Today
        </Link>
      </div>
    </div>
  );
}
