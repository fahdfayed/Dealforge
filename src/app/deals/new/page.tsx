import { PageHeader } from "@/components/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { createDealAction } from "../actions";

export default function NewDealPage() {
  return (
    <div className="max-w-lg">
      <PageHeader
        title="New deal"
        subtitle="Empty by default — no client facts are prefilled. Everything else is set up on the Deal Twin, Understand and Build offer screens."
      />
      <Card>
        <CardBody>
          <form action={createDealAction} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Company</label>
              <input
                name="company"
                required
                placeholder="Client company name"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="flex justify-end border-t border-slate-100 pt-4">
              <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
                Create Deal Twin
              </button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
