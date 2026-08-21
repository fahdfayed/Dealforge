import Link from "next/link";
import { dealFixHref, type Fix } from "@/lib/fix-links";

// The link that takes you to where an issue is resolved.
//
// One component so every issue across the app points somewhere the same way:
// same wording, same affordance, so a reader learns once that an issue is
// always clickable rather than discovering it per screen.
export function FixLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="whitespace-nowrap text-xs font-medium text-indigo-600 underline underline-offset-2 hover:text-indigo-700"
    >
      {label} →
    </Link>
  );
}

// For issues produced against a DealTwin, which know the screen but not the
// deal they belong to.
export function DealFixLink({ dealId, fix }: { dealId: string; fix: Fix }) {
  return <FixLink href={dealFixHref(dealId, fix)} label={`Fix in ${fix.label}`} />;
}
