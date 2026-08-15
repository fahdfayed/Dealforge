// Identity: the documented production model authenticates via headers set
// by the ChatGPT App host ("ChatGPT-authenticated user headers and safe
// sign-in/sign-out return paths", doc section 15.1). This container has no
// ChatGPT App platform session to read, so this module trusts the header
// when present and falls back to a fixed local-dev user otherwise. Wiring
// this to a real ChatGPT App deployment is a platform-configuration task,
// not something that can be faked here.
import { headers } from "next/headers";

export type CurrentUser = { id: string; name: string; source: "chatgpt-header" | "dev-fallback" };

const DEV_USER: CurrentUser = { id: "dev-user", name: "Dev Workspace Owner", source: "dev-fallback" };

export async function getCurrentUser(): Promise<CurrentUser> {
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
