import { notFound } from "next/navigation";
import { getDeal } from "@/lib/deal-repo";
import { evaluateSubmissionCheck, type CheckLens } from "@/lib/submission-check";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const LENSES: CheckLens[] = ["Core", "CFO", "CIO", "Procurement", "Delivery", "Oracle"];

export default async function SubmissionCheckPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deal = await getDeal(id);
  if (!deal) notFound();

  const { issues, blockingIssues } = evaluateSubmissionCheck(deal.twin);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Submission readiness"
          subtitle={blockingIssues.length === 0 ? "No blocking issues found." : `${blockingIssues.length} blocking issue(s) must be resolved.`}
        />
        <CardBody>
          <Badge color={blockingIssues.length === 0 ? "emerald" : "rose"}>
            {blockingIssues.length === 0 ? "Ready to submit" : "Not ready"}
          </Badge>
        </CardBody>
      </Card>

      {LENSES.map((lens) => {
        const lensIssues = issues.filter((i) => i.lens === lens);
        if (lensIssues.length === 0) return null;
        return (
          <Card key={lens}>
            <CardHeader title={`${lens} lens`} />
            <CardBody className="space-y-2">
              {lensIssues.map((issue) => (
                <div key={issue.id} className="flex items-center justify-between gap-2 rounded-md border border-slate-100 px-3 py-2 text-sm">
                  <span>{issue.label}</span>
                  <Badge color={issue.blocking ? "rose" : "amber"}>{issue.blocking ? "Blocking" : "Advisory"}</Badge>
                </div>
              ))}
            </CardBody>
          </Card>
        );
      })}

      {issues.length === 0 && (
        <Card className="p-8 text-center text-sm text-slate-500">No issues found across any lens.</Card>
      )}
    </div>
  );
}
