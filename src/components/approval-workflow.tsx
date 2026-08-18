"use client";

import React, { useState } from "react";
import type { ApprovalRecord } from "@/types/deal-twin";
import { Badge } from "@/components/ui/badge";

interface ApprovalWorkflowProps {
  approvals: ApprovalRecord[];
  status: "Draft" | "Pending approval" | "Approved" | "Rejected" | "Sent";
  onSubmit?: (decision: "approved" | "rejected", comment: string, approver: string) => Promise<void>;
  loading?: boolean;
}

export function ApprovalWorkflow({ approvals, status, onSubmit, loading }: ApprovalWorkflowProps) {
  const [showForm, setShowForm] = useState(false);
  const [comment, setComment] = useState("");
  const [approver, setApprover] = useState("");
  const [decision, setDecision] = useState<"approved" | "rejected">("approved");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSubmit || !approver.trim()) return;

    setSubmitting(true);
    try {
      await onSubmit(decision, comment, approver);
      setComment("");
      setApprover("");
      setShowForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  const statusColors: Record<string, string> = {
    Draft: "slate",
    "Pending approval": "amber",
    Approved: "emerald",
    Rejected: "rose",
    Sent: "sky",
  };

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Approval workflow</p>
        <Badge color={statusColors[status]}>{status}</Badge>
      </div>

      {approvals.length > 0 && (
        <div className="space-y-2 border-t border-slate-200 pt-3">
          {approvals.map((approval) => (
            <div key={approval.id} className="rounded-md bg-white p-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-900">{approval.approvedBy}</span>
                <Badge color={approval.decision === "approved" ? "emerald" : "rose"}>{approval.decision}</Badge>
              </div>
              {approval.comment && <p className="mt-1 text-slate-600">{approval.comment}</p>}
              <p className="mt-0.5 text-slate-400">{new Date(approval.decidedAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}

      {onSubmit && status === "Pending approval" && (
        <div className="border-t border-slate-200 pt-3">
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-white"
            >
              Add approval decision
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-2">
              <div>
                <label className="mb-0.5 block text-xs font-medium text-slate-600">Approver name</label>
                <input
                  type="text"
                  value={approver}
                  onChange={(e) => setApprover(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs"
                  required
                />
              </div>
              <div>
                <label className="mb-0.5 block text-xs font-medium text-slate-600">Decision</label>
                <select
                  value={decision}
                  onChange={(e) => setDecision(e.target.value as "approved" | "rejected")}
                  className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs"
                >
                  <option value="approved">Approve</option>
                  <option value="rejected">Reject</option>
                </select>
              </div>
              <div>
                <label className="mb-0.5 block text-xs font-medium text-slate-600">Comment (optional)</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add comment..."
                  rows={2}
                  className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitting || loading}
                  className="flex-1 rounded-md bg-indigo-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-md border border-slate-300 px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-white"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
