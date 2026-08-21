import CommitmentsPage from "../../commitments/page";
import { LensDrawer } from "@/components/lens-drawer";

// Reuses the real page component rather than copying its markup, so the drawer
// and the standalone route cannot drift apart. Both props are forwarded even
// though not every lens reads searchParams — the ones that surface a save
// conflict do.
export default function CommitmentsPageLens(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ all?: string; conflict?: string }>;
}) {
  return (
    <LensDrawer title="Commitments">
      <CommitmentsPage {...props} />
    </LensDrawer>
  );
}
