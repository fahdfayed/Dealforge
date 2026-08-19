// Team collaboration types

export type UserRole = "admin" | "editor" | "reviewer" | "viewer" | "finance" | "delivery";
export type UserStatus = "active" | "inactive" | "pending";

export type TeamMember = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
};

export type DealAccessLevel = "owner" | "edit" | "review" | "view";

export type DealAccess = {
  id: string;
  dealId: string;
  userId: string;
  accessLevel: DealAccessLevel;
  sharedAt: string;
  sharedBy: string;
  user?: TeamMember;
};

export type DealResponsibility = "opportunity_owner" | "delivery_owner" | "finance_approver" | "compliance_reviewer";

export type Responsibility = {
  id: string;
  dealId: string;
  userId: string;
  role: DealResponsibility;
  assignedAt: string;
  assignedBy: string;
  status: "active" | "completed" | "transferred";
  user?: TeamMember;
};

export type SODSeverity = "error" | "warning";

export type SODViolation = {
  id: string;
  dealId: string;
  ruleId: string;
  severity: SODSeverity;
  details: string;
  detectedAt: string;
  resolvedAt?: string;
};

// User permissions
export type UserPermissions = {
  canEditDeals: boolean;
  canReviewDeals: boolean;
  canApproveFinance: boolean;
  canManageTeam: boolean;
  canViewAllDeals: boolean;
};

export function getRolePermissions(role: UserRole): UserPermissions {
  switch (role) {
    case "admin":
      return {
        canEditDeals: true,
        canReviewDeals: true,
        canApproveFinance: true,
        canManageTeam: true,
        canViewAllDeals: true,
      };
    case "editor":
      return {
        canEditDeals: true,
        canReviewDeals: true,
        canApproveFinance: false,
        canManageTeam: false,
        canViewAllDeals: false,
      };
    case "reviewer":
      return {
        canEditDeals: false,
        canReviewDeals: true,
        canApproveFinance: false,
        canManageTeam: false,
        canViewAllDeals: false,
      };
    case "finance":
      return {
        canEditDeals: false,
        canReviewDeals: false,
        canApproveFinance: true,
        canManageTeam: false,
        canViewAllDeals: false,
      };
    case "delivery":
      return {
        canEditDeals: true,
        canReviewDeals: true,
        canApproveFinance: false,
        canManageTeam: false,
        canViewAllDeals: false,
      };
    case "viewer":
    default:
      return {
        canEditDeals: false,
        canReviewDeals: false,
        canApproveFinance: false,
        canManageTeam: false,
        canViewAllDeals: false,
      };
  }
}
