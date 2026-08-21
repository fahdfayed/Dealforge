// Who is making this request.
//
// This used to fall back to a hardcoded development user whenever no valid
// session was found, and the middleware only checked that an auth_token cookie
// was present, not that it meant anything. Together that was a complete
// authentication bypass: sending `Cookie: auth_token=anything` returned a fully
// rendered application as "Dev Workspace Owner". It also trusted an
// x-chatgpt-user-id request header, which any client can set to any value.
//
// Both fallbacks are gone. There is one way to be authenticated — a session
// token that resolves to an active member — and the absence of one is null,
// never a default identity.
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession } from "./auth";
import type { UserRole } from "@/types/team";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const authToken = cookieStore.get("auth_token")?.value;
  if (!authToken) return null;

  const user = await verifySession(authToken);
  if (!user) return null;

  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

// The gate every authenticated screen and action goes through.
//
// Redirects rather than returning null, so a caller cannot accidentally proceed
// with an anonymous user: there is no value to ignore. The middleware still
// redirects unauthenticated requests early, but it cannot verify a token —
// it runs before the database is reachable — so this is the check that counts.
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  return user;
}

// Only allow same-site relative paths as a sign-in/out return target, to
// avoid an open-redirect if this is ever wired to a real auth handshake.
export function safeReturnPath(candidate: string | null | undefined): string {
  if (!candidate) return "/";
  if (!candidate.startsWith("/") || candidate.startsWith("//")) return "/";
  return candidate;
}
