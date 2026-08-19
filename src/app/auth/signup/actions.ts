"use server";

import { cookies } from "next/headers";
import { signup as signupUser } from "@/lib/auth";

export async function signupAction(email: string, name: string, password: string): Promise<{ error?: string; success?: boolean }> {
  console.log("[signupAction] Starting with email:", email);

  try {
    console.log("[signupAction] Calling signupUser function");
    const result = await signupUser(email, name, password);
    console.log("[signupAction] signupUser returned, checking result");

    if ("error" in result) {
      console.log("[signupAction] Error from signupUser:", result.error);
      return { error: result.error };
    }

    console.log("[signupAction] signupUser succeeded, setting cookie");
    const cookieStore = await cookies();
    cookieStore.set("auth_token", result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
    });
    console.log("[signupAction] Cookie set successfully");

    console.log("[signupAction] Signup completed successfully");
    return { success: true };
  } catch (err) {
    console.error("[signupAction] Exception caught:", err);
    console.error("[signupAction] Error type:", err instanceof Error ? err.constructor.name : typeof err);
    console.error("[signupAction] Error message:", err instanceof Error ? err.message : String(err));
    if (err instanceof Error && err.stack) {
      console.error("[signupAction] Stack:", err.stack);
    }
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}
