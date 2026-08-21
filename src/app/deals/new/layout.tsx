import { requireUser } from "@/lib/identity";

// The page itself is a client component and cannot verify a session, so the
// gate lives in a server layout wrapping it. Its actions check separately —
// this stops the screen rendering at all for an unauthenticated request.
export default async function NewDealLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return <>{children}</>;
}
