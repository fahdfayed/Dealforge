"use server";

import { cookies } from "next/headers";
import { signup as signupUser } from "@/lib/auth";

export async function signupAction(email: string, name: string, password: string): Promise<{ error?: string; success?: boolean }> {
  const result = await signupUser(email, name, password);

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
