"use server";

import { cookies } from "next/headers";
import { login as loginUser } from "@/lib/auth";

export async function loginAction(email: string, password: string): Promise<{ error?: string; success?: boolean }> {
  const result = await loginUser(email, password);

  if ("error" in result) {
    return { error: result.error };
  }

  const cookieStore = await cookies();
  cookieStore.set("auth_token", result.sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
  });

  return { success: true };
}
