import { NextResponse } from "next/server";
import { safeReturnPath } from "@/lib/identity";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const returnTo = safeReturnPath(url.searchParams.get("returnTo"));
  return NextResponse.redirect(new URL(returnTo, request.url));
}
