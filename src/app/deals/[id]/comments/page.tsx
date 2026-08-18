import { notFound } from "next/navigation";
import { getDeal } from "@/lib/deal-repo";
import { CommentsClient } from "./comments-client";

export const dynamic = "force-dynamic";

export default async function CommentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const deal = await getDeal(id);
  if (!deal) notFound();

  return <CommentsClient initialDeal={deal} dealId={id} />;
}
