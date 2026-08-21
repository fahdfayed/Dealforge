import { requireUser } from "@/lib/identity";
import Link from "next/link";
import { createCandidateAction } from "../actions";
import { CandidateForm } from "@/components/candidate-form";
import { PageHeader } from "@/components/page-header";

export const dynamic = "force-dynamic";

export default async function NewCandidatePage() {
  // Every authenticated screen goes through the gate. The middleware only
  // redirects when the cookie is absent; it cannot tell a forged one from a
  // real one, so this is where a session is actually verified.
  await requireUser();
  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Add candidate"
        action={
          <Link href="/candidates" className="text-sm text-slate-600 hover:text-slate-900">
            Back to candidates
          </Link>
        }
      />
      <form action={createCandidateAction}>
        <CandidateForm submitLabel="Add to repository" />
      </form>
    </div>
  );
}
