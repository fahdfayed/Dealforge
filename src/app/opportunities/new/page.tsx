import { PageHeader } from "@/components/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { DEAL_TYPES, MODULE_OPTIONS } from "@/lib/domain";
import { createOpportunity } from "../actions";

export default function NewOpportunityPage() {
  return (
    <div className="max-w-2xl">
      <PageHeader
        title="New opportunity"
        subtitle="Create the Living Deal Twin. Discovery questions will be generated automatically from the deal type and modules you select."
      />

      <Card>
        <CardBody>
          <form action={createOpportunity} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Opportunity name" name="name" required placeholder="e.g. Al Rawabi Group — HCM Rollout" full />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Client" name="client" required placeholder="Client company name" />
              <Field label="Industry" name="industry" placeholder="e.g. Manufacturing" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Countries" name="countries" placeholder="e.g. UAE, Oman, Morocco" />
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Deal type
                </label>
                <select
                  name="dealType"
                  required
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {DEAL_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Modules in scope
              </label>
              <div className="grid grid-cols-2 gap-2">
                {MODULE_OPTIONS.map((mod) => (
                  <label
                    key={mod}
                    className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <input type="checkbox" name="modules" value={mod} className="rounded border-slate-300" />
                    {mod}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Field label="Budget min (USD)" name="budgetMin" type="number" placeholder="150000" />
              <Field label="Budget max (USD)" name="budgetMax" type="number" placeholder="220000" />
              <Field label="Timeline (months)" name="timelineMonths" type="number" placeholder="6" />
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="submit"
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
              >
                Create Deal Twin
              </button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required,
  full,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  full?: boolean;
}) {
  return (
    <div className={full ? "col-span-2" : undefined}>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
    </div>
  );
}
