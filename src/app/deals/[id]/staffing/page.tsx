import Link from "next/link";
import { notFound } from "next/navigation";
import { getDeal } from "@/lib/deal-repo";
import { searchCandidates } from "@/lib/candidate-repo";
import { recommendFrom, requirementFromDeal } from "@/lib/candidate-matching";
import { CandidateRecommendations } from "@/components/candidate-recommendations";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { DealFixLink } from "@/components/fix-link";
import { FIX, type Fix } from "@/lib/fix-links";

export const dynamic = "force-dynamic";

export default async function StaffingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deal = await getDeal(id);
  if (!deal) notFound();

  const requirement = requirementFromDeal(deal.twin, id);

  // The lens is only offered on staff augmentation engagements, but a deal can
  // change type after someone opens it, so the page says so rather than
  // rendering an empty list.
  if (!requirement) {
    return (
      <Card>
        <CardHeader title="Staffing" />
        <CardBody>
          <p className="text-sm text-slate-500">
            Staffing recommendations apply to staff augmentation engagements. This deal is a{" "}
            {deal.twin.dealDNA.engagementType ?? "type that has not been set"}.
          </p>
        </CardBody>
      </Card>
    );
  }

  const { matches, excluded } = recommendFrom(await searchCandidates({}), requirement, { limit: 10 });

  // Each gap names where it is captured, so the reader is not told what is
  // missing and left to find the screen that holds it.
  const missing: Array<{ label: string; fix: Fix }> = [];
  if (requirement.skills.length === 0) missing.push({ label: "the skills required", fix: FIX.discover });
  if (requirement.budgetRate == null) missing.push({ label: "a saved commercial position for the day cost", fix: FIX.price });
  if (!requirement.startBy) missing.push({ label: "a due date", fix: FIX.dealHome });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Staffing"
          subtitle={`Matching the repository against ${requirement.label}`}
        />
        <CardBody className="space-y-4">
          {missing.length > 0 && (
            <div className="space-y-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              <p>
                Ranking improves once the deal records the following. Anything unrecorded is scored
                neutral rather than counted against a candidate.
              </p>
              <ul className="space-y-0.5">
                {missing.map((m) => (
                  <li key={m.label} className="flex flex-wrap items-baseline gap-2">
                    <span>{m.label}</span>
                    <DealFixLink dealId={id} fix={m.fix} />
                  </li>
                ))}
              </ul>
            </div>
          )}
          <CandidateRecommendations
            matches={matches}
            excluded={excluded}
            requirement={requirement}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Turning this into requisitions" />
        <CardBody>
          <p className="text-sm text-slate-600">
            Recommendations here are a view of who could staff this deal. To actually pursue
            anyone, raise a requisition — that is what starts the SLA clocks and the go/no-go gate.
          </p>
          <Link
            href="/requisitions/new"
            className="mt-3 inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Raise a requisition
          </Link>
        </CardBody>
      </Card>
    </div>
  );
}
