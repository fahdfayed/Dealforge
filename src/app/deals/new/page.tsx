"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { createDealAction, createDealFromTemplateAction } from "../actions";
import { DEAL_TEMPLATES } from "@/lib/deal-templates";

export default function NewDealPage() {
  const [mode, setMode] = useState<"blank" | "template">("blank");

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="New deal"
      />

      <div className="mb-4 flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setMode("blank")}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${mode === "blank" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-600 hover:text-slate-900"}`}
        >
          Blank deal
        </button>
        <button
          onClick={() => setMode("template")}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${mode === "template" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-600 hover:text-slate-900"}`}
        >
          From template
        </button>
      </div>

      {mode === "blank" ? (
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
                  Create blank Deal Twin
                </button>
              </div>
            </form>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {DEAL_TEMPLATES.map((template) => (
            <form key={template.id} action={createDealFromTemplateAction} className="block">
              <Card className="hover:shadow-md transition-shadow">
                <CardBody className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{template.name}</p>
                    <p className="mt-1 text-sm text-slate-600">{template.description}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {template.industryFocus.map((ind) => (
                        <span key={ind} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
                          {ind}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <input name="template" value={template.id} type="hidden" />
                    <input
                      name="company"
                      required
                      placeholder="Company name"
                      className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 whitespace-nowrap">
                      Use template
                    </button>
                  </div>
                </CardBody>
              </Card>
            </form>
          ))}
        </div>
      )}
    </div>
  );
}
