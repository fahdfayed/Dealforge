import Link from "next/link";
import { listAccounts } from "@/lib/account-repo";
import { createRequisitionAction } from "../actions";
import { ORACLE_SKILL_GROUPS, ORACLE_SKILLS, RATE_UNITS } from "@/lib/oracle-skills";
import { REQUISITION_PRIORITIES } from "@/lib/requisitions";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardBody } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function NewRequisitionPage() {
  const accounts = await listAccounts();

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Raise requisition"
        action={
          <Link href="/requisitions" className="text-sm text-slate-600 hover:text-slate-900">
            Back to requisitions
          </Link>
        }
      />

      <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
        Raising this starts the 24-hour clock for acknowledgement, the calibration call and the
        go/no-go decision. Sourcing stays closed until the gate is met.
      </div>

      <form action={createRequisitionAction} className="space-y-6">
        <Card>
          <CardHeader title="The requirement" />
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-500">Role title</label>
              <input name="roleTitle" required placeholder="Fusion Financials Consultant"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Client</label>
              <select name="accountId" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                <option value="">Not linked to a client record</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Client name (if not listed)</label>
              <input name="accountName" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Primary skill</label>
              <select name="primarySkill" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                <option value="">—</option>
                {ORACLE_SKILLS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Positions</label>
              <input type="number" name="positions" min={1} defaultValue={1}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-500">Other skills required</label>
              <select name="requiredSkills" multiple size={8}
                className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm">
                {ORACLE_SKILL_GROUPS.map((g) => (
                  <optgroup key={g.group} label={g.group}>
                    {g.skills.map((s) => <option key={s} value={s}>{s}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Minimum years</label>
              <input type="number" name="minYears" min={0}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Priority</label>
              <select name="priority" defaultValue="Normal"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                {REQUISITION_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Location</label>
              <input name="location" placeholder="Dubai"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Country</label>
              <input name="country" placeholder="UAE"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-500">Job description from the client</label>
              <textarea name="jobDescription" rows={5}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Commercials and timing" />
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Budget rate</label>
              <input type="number" name="budgetRate" min={0}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Currency</label>
                <input name="budgetCurrency" defaultValue="AED"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Per</label>
                <select name="budgetRateUnit" defaultValue="Per day"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                  {RATE_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Duration (months)</label>
              <input type="number" name="durationMonths" min={0}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Start by</label>
              <input type="date" name="startBy"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Who owns it" />
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Sales owner</label>
              <input name="salesOwner" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">TA owner</label>
              <input name="taOwner" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Practice head</label>
              <input name="practiceHead" placeholder="Leads the resourcing check"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </div>
          </CardBody>
        </Card>

        <div className="flex justify-end">
          <button type="submit"
            className="rounded-md bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-500">
            Raise requisition
          </button>
        </div>
      </form>
    </div>
  );
}
