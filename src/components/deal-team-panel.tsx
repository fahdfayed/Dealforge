"use client";

import { useState } from "react";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ActionButton } from "@/components/button-group";
import { Input, Select } from "@/components/form-input";
import type { DealAccess, Responsibility, TeamMember } from "@/types/team";

interface DealTeamPanelProps {
  dealId: string;
  accesses: DealAccess[];
  responsibilities: Responsibility[];
  teamMembers: TeamMember[];
  onShareDeal?: (userId: string, accessLevel: string) => Promise<void>;
  onAssignRole?: (userId: string, role: string) => Promise<void>;
  canManage: boolean;
}

const ACCESS_LEVEL_COLORS: Record<string, string> = {
  owner: "rose",
  edit: "indigo",
  review: "sky",
  view: "slate",
};

const ROLE_COLORS: Record<string, string> = {
  opportunity_owner: "rose",
  delivery_owner: "amber",
  finance_approver: "emerald",
  compliance_reviewer: "violet",
};

export function DealTeamPanel({
  dealId,
  accesses,
  responsibilities,
  teamMembers,
  onShareDeal,
  onAssignRole,
  canManage,
}: DealTeamPanelProps) {
  const [shareUserId, setShareUserId] = useState("");
  const [shareAccessLevel, setShareAccessLevel] = useState("view");
  const [assignUserId, setAssignUserId] = useState("");
  const [assignRole, setAssignRole] = useState("opportunity_owner");

  const handleShare = async () => {
    if (!shareUserId) return;
    await onShareDeal?.(shareUserId, shareAccessLevel);
    setShareUserId("");
    setShareAccessLevel("view");
  };

  const handleAssign = async () => {
    if (!assignUserId) return;
    await onAssignRole?.(assignUserId, assignRole);
    setAssignUserId("");
    setAssignRole("opportunity_owner");
  };

  return (
    <div className="space-y-6">
      {/* Deal Access */}
      <Card>
        <CardHeader title="Access & Sharing" subtitle="Who has access to this deal" />
        <CardBody className="space-y-3">
          {accesses.length === 0 ? (
            <p className="text-sm text-slate-500">Only the owner has access.</p>
          ) : (
            accesses.map((access) => (
              <div
                key={access.id}
                className="flex items-center justify-between gap-3 rounded-md border border-slate-100 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{access.user?.name || access.userId}</p>
                  <p className="text-xs text-slate-500">{access.user?.email}</p>
                </div>
                <Badge color={ACCESS_LEVEL_COLORS[access.accessLevel] ?? "slate"}>
                  {access.accessLevel}
                </Badge>
              </div>
            ))
          )}

          {canManage && (
            <div className="border-t border-slate-100 pt-3 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Share with</label>
                <select
                  value={shareUserId}
                  onChange={(e) => setShareUserId(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm"
                >
                  <option value="">Select team member...</option>
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Access level</label>
                <select
                  value={shareAccessLevel}
                  onChange={(e) => setShareAccessLevel(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm"
                >
                  <option value="view">View only</option>
                  <option value="review">Review</option>
                  <option value="edit">Edit</option>
                </select>
              </div>
              <ActionButton
                type="button"
                variant="primary"
                size="sm"
                className="w-full"
                onClick={handleShare}
              >
                Share deal
              </ActionButton>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Responsibilities */}
      <Card>
        <CardHeader
          title="Team Assignments"
          subtitle="Roles and responsibilities on this deal"
        />
        <CardBody className="space-y-3">
          {responsibilities.length === 0 ? (
            <p className="text-sm text-slate-500">No roles assigned yet.</p>
          ) : (
            responsibilities.map((resp) => (
              <div
                key={resp.id}
                className="flex items-center justify-between gap-3 rounded-md border border-slate-100 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{resp.user?.name || resp.userId}</p>
                  <p className="text-xs text-slate-500">Assigned by {resp.assignedBy}</p>
                </div>
                <Badge color={ROLE_COLORS[resp.role] ?? "slate"}>
                  {resp.role.replace(/_/g, " ")}
                </Badge>
              </div>
            ))
          )}

          {canManage && (
            <div className="border-t border-slate-100 pt-3 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Assign to</label>
                <select
                  value={assignUserId}
                  onChange={(e) => setAssignUserId(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm"
                >
                  <option value="">Select team member...</option>
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.role})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Role</label>
                <select
                  value={assignRole}
                  onChange={(e) => setAssignRole(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm"
                >
                  <option value="opportunity_owner">Opportunity Owner</option>
                  <option value="delivery_owner">Delivery Owner</option>
                  <option value="finance_approver">Finance Approver</option>
                  <option value="compliance_reviewer">Compliance Reviewer</option>
                </select>
              </div>
              <ActionButton
                type="button"
                variant="primary"
                size="sm"
                className="w-full"
                onClick={handleAssign}
              >
                Assign role
              </ActionButton>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
