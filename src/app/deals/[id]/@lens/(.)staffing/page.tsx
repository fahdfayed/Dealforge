import StaffingPage from "../../staffing/page";
import { LensDrawer } from "@/components/lens-drawer";

// Reuses the real page component rather than copying its markup, so the drawer
// and the standalone route cannot drift apart.
export default function StaffingPageLens(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ all?: string; conflict?: string }>;
}) {
  return (
    <LensDrawer title="Staffing">
      <StaffingPage {...props} />
    </LensDrawer>
  );
}
