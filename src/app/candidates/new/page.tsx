import Link from "next/link";
import { createCandidateAction } from "../actions";
import { CandidateForm } from "@/components/candidate-form";
import { PageHeader } from "@/components/page-header";

export const dynamic = "force-dynamic";

export default function NewCandidatePage() {
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
