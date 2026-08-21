// Promote a member to a role. Usually: make the first person an admin.
//
// A fresh deployment has no administrator. Everyone who signs up is a viewer,
// and nothing in the app can grant a role, so without this the first person in
// is locked out of their own instance and the only way through is hand-editing
// the database.
//
//   npm run db:promote -- fahd@example.com admin
//
// Run against production by setting DATABASE_URL and DATABASE_AUTH_TOKEN.
import "dotenv/config";
import { db } from "@/db/client";
import { teamMembers } from "@/db/schema";
import { eq } from "drizzle-orm";

const VALID_ROLES = ["admin", "editor", "reviewer", "viewer", "finance", "delivery"] as const;

const [email, role = "admin"] = process.argv.slice(2);

if (!email) {
  console.error("Usage: npm run db:promote -- <email> [role]");
  console.error(`Roles: ${VALID_ROLES.join(", ")}`);
  process.exit(1);
}

if (!(VALID_ROLES as readonly string[]).includes(role)) {
  console.error(`Unknown role "${role}". Roles: ${VALID_ROLES.join(", ")}`);
  process.exit(1);
}

const [member] = await db
  .select()
  .from(teamMembers)
  .where(eq(teamMembers.email, email.toLowerCase().trim()))
  .limit(1);

if (!member) {
  console.error(`No member with the email ${email}.`);
  console.error("They need to sign up first — this changes an existing account's role.");
  process.exit(1);
}

await db
  .update(teamMembers)
  .set({ role, status: "active", updatedAt: Date.now() })
  .where(eq(teamMembers.id, member.id));

console.log(`${member.name} <${member.email}> is now ${role}.`);
if (member.status !== "active") console.log(`Status was "${member.status}" and is now active.`);
process.exit(0);
