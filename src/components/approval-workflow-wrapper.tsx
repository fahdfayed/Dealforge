"use client";

import { ApprovalWorkflow } from "@/components/approval-workflow";
import type { ScenarioStatus, ProposalStatus } from "@/types/deal-twin";

interface ApprovalWorkflowWrapperProps {
  approvals?: any[] | null;
  status: ScenarioStatus | ProposalStatus;
  dealId: string;
  entityId: string;
  revision: number;
  onSubmitAction: (dealId: string, revision: number, entityId: string, decision: "approved" | "rejected", comment: string, approvedBy: string) => Promise<void>;
}

export function ApprovalWorkflowWrapper({
  approvals,
  status,
  dealId,
  entityId,
  revision,
  onSubmitAction,
}: ApprovalWorkflowWrapperProps) {
  return (
    <ApprovalWorkflow
      approvals={approvals}
      status={status}
      onSubmit={async (decision, comment, approver) => {
        await onSubmitAction(dealId, revision, entityId, decision as "approved" | "rejected", comment, approver);
      }}
    />
  );
}
