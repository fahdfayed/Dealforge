import { NextResponse } from "next/server";
import { safeReturnPath } from "@/lib/identity";

// Stub sign-in: in production this is where the ChatGPT App host's auth
// handshake would land. Locally there is nothing to authenticate against,
// so this just returns to a safe path — see src/lib/identity.ts.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const returnTo = safeReturnPath(url.searchParams.get("returnTo"));
  return NextResponse.redirect(new URL(returnTo, request.url));
}
