import { getDealResponsibilities, getSODRules, recordSODViolation, getDealSODViolations } from "@/lib/team-repo";
import { getDeal } from "@/lib/deal-repo";
import type { Deal } from "@/types/deal-twin";
import type { Responsibility } from "@/types/team";

export type SODCheckResult = {
  violations: Array<{
    rule: string;
    severity: "error" | "warning";
    details: string;
  }>;
  canProceed: boolean;
};

// Segregation of Duties Rules
const SOD_RULES = {
  opportunity_owner_cannot_approve: {
    name: "opportunity_owner_cannot_approve",
    description: "Opportunity owner cannot be the finance approver",
    severity: "error",
    check: (responsibilities: Responsibility[], dealId: string) => {
      const opOwners = responsibilities.filter(r => r.role === "opportunity_owner");
      const financeApprovers = responsibilities.filter(r => r.role === "finance_approver");

      const violations = [];
      for (const owner of opOwners) {
        if (financeApprovers.some(a => a.userId === owner.userId)) {
          violations.push({
            rule: "opportunity_owner_cannot_approve",
            severity: "error" as const,
            details: `User ${owner.userId} cannot be both opportunity owner and finance approver on deal ${dealId}`,
          });
        }
      }
      return violations;
    },
  },

  single_reviewer_limit: {
    name: "single_reviewer_limit",
    description: "No single user should have multiple approval roles on same deal",
    severity: "warning",
    check: (responsibilities: Responsibility[], dealId: string) => {
      const userRoles = new Map<string, string[]>();
      for (const resp of responsibilities) {
        if (!userRoles.has(resp.userId)) {
          userRoles.set(resp.userId, []);
        }
        userRoles.get(resp.userId)!.push(resp.role);
      }

      const violations = [];
      for (const [userId, roles] of userRoles.entries()) {
        const approvalRoles = roles.filter(r => r.includes("approver") || r.includes("reviewer"));
        if (approvalRoles.length > 1) {
          violations.push({
            rule: "single_reviewer_limit",
            severity: "warning" as const,
            details: `User ${userId} has multiple approval roles on deal ${dealId}: ${approvalRoles.join(", ")}`,
          });
        }
      }
      return violations;
    },
  },

  compliance_reviewer_required: {
    name: "compliance_reviewer_required",
    description: "Deal requires at least one compliance reviewer",
    severity: "error",
    check: (responsibilities: Responsibility[], dealId: string) => {
      const hasReviewer = responsibilities.some(r => r.role === "compliance_reviewer");
      if (!hasReviewer) {
        return [{
          rule: "compliance_reviewer_required",
          severity: "error" as const,
          details: `Deal ${dealId} requires a compliance reviewer assignment`,
        }];
      }
      return [];
    },
  },

  delivery_owner_not_finance: {
    name: "delivery_owner_not_finance",
    description: "Delivery owner should not be finance approver",
    severity: "warning",
    check: (responsibilities: Responsibility[], dealId: string) => {
      const deliveryOwners = responsibilities.filter(r => r.role === "delivery_owner");
      const financeApprovers = responsibilities.filter(r => r.role === "finance_approver");

      const violations = [];
      for (const owner of deliveryOwners) {
        if (financeApprovers.some(a => a.userId === owner.userId)) {
          violations.push({
            rule: "delivery_owner_not_finance",
            severity: "warning" as const,
            details: `User ${owner.userId} is both delivery owner and finance approver (consider segregation)`,
          });
        }
      }
      return violations;
    },
  },
};

export async function validateDealSOD(dealId: string): Promise<SODCheckResult> {
  const responsibilities = await getDealResponsibilities(dealId);
  const violations: SODCheckResult["violations"] = [];

  // Run all SOD checks
  for (const [, rule] of Object.entries(SOD_RULES)) {
    const ruleViolations = rule.check(responsibilities, dealId);
    violations.push(...ruleViolations);
  }

  // Separate errors and warnings
  const errors = violations.filter(v => v.severity === "error");
  const canProceed = errors.length === 0;

  return {
    violations,
    canProceed,
  };
}

export async function checkSODOnAssignment(
  dealId: string,
  userId: string,
  role: string
): Promise<SODCheckResult> {
  const responsibilities = await getDealResponsibilities(dealId);

  // Add the new assignment temporarily to check for violations
  const tempResponsibilities: Responsibility[] = [
    ...responsibilities,
    {
      id: "temp",
      dealId,
      userId,
      role: role as any,
      assignedAt: new Date().toISOString(),
      assignedBy: "system",
      status: "active",
    },
  ];

  const violations: SODCheckResult["violations"] = [];

  // Run all SOD checks with the new assignment
  for (const [, rule] of Object.entries(SOD_RULES)) {
    const ruleViolations = rule.check(tempResponsibilities, dealId);
    violations.push(...ruleViolations);
  }

  const errors = violations.filter(v => v.severity === "error");
  return {
    violations,
    canProceed: errors.length === 0,
  };
}

export async function recordSODViolations(dealId: string): Promise<void> {
  const check = await validateDealSOD(dealId);

  // Record new violations
  for (const violation of check.violations) {
    await recordSODViolation(dealId, violation.rule, violation.severity, violation.details);
  }
}
