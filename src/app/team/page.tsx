import { getTeamMembers } from "@/lib/team-repo";
import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { ActionButton } from "@/components/button-group";
import { Input, Select } from "@/components/form-input";
import { addTeamMemberAction, updateTeamMemberAction, removeTeamMemberAction } from "./actions";

const ROLE_COLORS: Record<string, string> = {
  admin: "rose",
  editor: "indigo",
  reviewer: "sky",
  finance: "emerald",
  delivery: "amber",
  viewer: "slate",
};

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const members = await getTeamMembers();

  return (
    <div>
      <PageHeader
        title="Team Management"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {members.length === 0 ? (
            <EmptyState
              icon="👥"
              title="No team members yet"
            />
          ) : (
            members.map((member) => (
              <Card key={member.id}>
                <CardBody className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{member.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{member.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge color={ROLE_COLORS[member.role] ?? "slate"}>{member.role}</Badge>
                    <Badge color={member.status === "active" ? "emerald" : "slate"}>
                      {member.status}
                    </Badge>
                  </div>
                </CardBody>
              </Card>
            ))
          )}
        </div>

        <div>
          <Card>
            <CardHeader title="Add team member" />
            <CardBody>
              <form action={addTeamMemberAction} className="space-y-3">
                <Input
                  name="email"
                  label="Email"
                  type="email"
                  required
                  placeholder="user@company.com"
                />
                <Input
                  name="name"
                  label="Name"
                  required
                  placeholder="Full name"
                />
                <Select
                  name="role"
                  label="Role"
                  required
                  defaultValue="viewer"
                >
                  <option value="admin">Admin - Full access</option>
                  <option value="editor">Editor - Can edit deals</option>
                  <option value="reviewer">Reviewer - Can review only</option>
                  <option value="finance">Finance - Finance approval</option>
                  <option value="delivery">Delivery - Delivery lead</option>
                  <option value="viewer">Viewer - Read-only access</option>
                </Select>
                <ActionButton type="submit" variant="primary" className="w-full">
                  Add member
                </ActionButton>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
