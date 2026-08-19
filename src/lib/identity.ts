// Identity: authentication via session tokens stored in cookies
import { headers, cookies } from "next/headers";
import { verifySession } from "./auth";

export type CurrentUser = { id: string; name: string; source: "session" | "chatgpt-header" | "dev-fallback" };

const DEV_USER: CurrentUser = { id: "dev-user", name: "Dev Workspace Owner", source: "dev-fallback" };

export async function getCurrentUser(): Promise<CurrentUser> {
  // First check for session token in cookies
  const cookieStore = await cookies();
  const authToken = cookieStore.get("auth_token")?.value;

  if (authToken) {
    const user = await verifySession(authToken);
    if (user) {
      return { id: user.id, name: user.name, source: "session" };
    }
  }

  // Fall back to ChatGPT headers
  const h = await headers();
  const id = h.get("x-chatgpt-user-id");
  const name = h.get("x-chatgpt-user-name");
  if (id) {
    return { id, name: name ?? id, source: "chatgpt-header" };
  }

  return DEV_USER;
}

// Only allow same-site relative paths as a sign-in/out return target, to
// avoid an open-redirect if this is ever wired to a real auth handshake.
export function safeReturnPath(candidate: string | null | undefined): string {
  if (!candidate) return "/";
  if (!candidate.startsWith("/") || candidate.startsWith("//")) return "/";
  return candidate;
}
