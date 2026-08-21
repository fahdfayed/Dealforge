import { requireUser } from "@/lib/identity";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCandidate, findPossibleDuplicates } from "@/lib/candidate-repo";
import { updateCandidateAction } from "../actions";
import { CandidateForm } from "@/components/candidate-form";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardBody } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function CandidatePage({ params }: { params: Promise<{ id: string }> }) {
  // Every authenticated screen goes through the gate. The middleware only
  // redirects when the cookie is absent; it cannot tell a forged one from a
  // real one, so this is where a session is actually verified.
  await requireUser();
  const { id } = await params;
  const candidate = await getCandidate(id);
  if (!candidate) notFound();

  // Shown on the record rather than only at creation: duplicates usually get
  // noticed while someone is already looking at one of them.
  const duplicates = (
    await findPossibleDuplicates({
      email: candidate.email,
      phone: candidate.phone,
      fullName: candidate.fullName,
    })
  ).filter((d) => d.id !== candidate.id);

  const update = updateCandidateAction.bind(null, candidate.id);

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={candidate.fullName}
        action={
          <Link href="/candidates" className="text-sm text-slate-600 hover:text-slate-900">
            Back to candidates
          </Link>
        }
      />

      {duplicates.length > 0 && (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardHeader title={`${duplicates.length} possible duplicate${duplicates.length === 1 ? "" : "s"}`} />
          <CardBody className="space-y-1">
            {duplicates.map((d) => (
              <Link
                key={d.id}
                href={`/candidates/${d.id}`}
                className="block text-sm text-amber-900 underline underline-offset-2"
              >
                {d.fullName} — {d.email || d.phone || "no contact details"} ({d.status})
              </Link>
            ))}
          </CardBody>
        </Card>
      )}

      <p className="mb-4 text-xs text-slate-400">
        Added by {candidate.createdBy || "unknown"} on {candidate.createdAt.slice(0, 10)} · last
        updated {candidate.updatedAt.slice(0, 10)}
      </p>

      <form action={update}>
        <CandidateForm candidate={candidate} submitLabel="Save changes" />
      </form>
    </div>
  );
}
