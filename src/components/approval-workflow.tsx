"use client";

import React, { useState, useCallback } from "react";
import type { ApprovalRecord } from "@/types/deal-twin";
import { Badge } from "@/components/ui/badge";
import { Input, Textarea, Select } from "@/components/form-input";

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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!onSubmit) return;

      setError(null);
      setSuccess(false);

      if (!approver.trim()) {
        setError("Please enter your name");
        return;
      }

      if (!comment.trim() && decision === "rejected") {
        setError("Please provide a reason for rejection");
        return;
      }

      setSubmitting(true);
      try {
        await onSubmit(decision, comment, approver);
        setComment("");
        setApprover("");
        setDecision("approved");
        setSuccess(true);
        setShowForm(false);
        setTimeout(() => setSuccess(false), 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to submit approval");
      } finally {
        setSubmitting(false);
      }
    },
    [onSubmit, approver, comment, decision]
  );

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

      {success && (
        <div className="rounded-md bg-emerald-50 border border-emerald-200 p-3">
          <p className="text-xs text-emerald-800">✓ Approval submitted successfully</p>
        </div>
      )}

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
              className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-white transition-colors"
            >
              Add approval decision
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              {error && (
                <div className="rounded-md bg-rose-50 border border-rose-200 p-2.5">
                  <p className="text-xs text-rose-800">{error}</p>
                </div>
              )}

              <Input
                label="Approver name"
                value={approver}
                onChange={(e) => setApprover(e.target.value)}
                placeholder="Your name"
                disabled={submitting || loading}
                required
              />

              <Select
                label="Decision"
                value={decision}
                onChange={(e) => setDecision(e.target.value as "approved" | "rejected")}
                disabled={submitting || loading}
              >
                <option value="approved">Approve</option>
                <option value="rejected">Reject</option>
              </Select>

              <Textarea
                label={decision === "rejected" ? "Reason for rejection" : "Comment (optional)"}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add comment..."
                rows={2}
                disabled={submitting || loading}
                required={decision === "rejected"}
              />

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitting || loading}
                  className="flex-1 rounded-md bg-indigo-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? "Submitting..." : "Submit"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setError(null);
                  }}
                  disabled={submitting || loading}
                  className="rounded-md border border-slate-300 px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
