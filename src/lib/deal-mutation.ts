import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDeal, saveDeal, ConflictError } from "@/lib/deal-repo";
import type { DealTwin } from "@/types/deal-twin";

// Every deal-mutating server action funnels through here: read the current
// twin, apply a pure mutator, and save with the revision the caller last
// read. A conflict redirects back with ?conflict=1 instead of silently
// overwriting concurrent work (doc 3.2 / 15.3).
export async function mutateDeal(
  dealId: string,
  expectedRevision: number,
  mutate: (twin: DealTwin) => DealTwin,
  path: string
): Promise<void> {
  const deal = await getDeal(dealId);
  if (!deal) throw new Error(`Deal ${dealId} not found.`);

  const nextTwin = mutate(deal.twin);

  try {
    await saveDeal(dealId, nextTwin, expectedRevision);
    revalidatePath(path);
  } catch (e) {
    if (e instanceof ConflictError) {
      revalidatePath(path);
      redirect(`${path}?conflict=1`);
    }
    throw e;
  }
}
