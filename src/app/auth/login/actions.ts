"use server";

import { cookies } from "next/headers";
import { login as loginUser } from "@/lib/auth";

export async function loginAction(email: string, password: string): Promise<{ error?: string; success?: boolean }> {
  console.log("[loginAction] Starting with email:", email);

  try {
    console.log("[loginAction] Calling loginUser function");
    const result = await loginUser(email, password);
    console.log("[loginAction] loginUser returned, checking result");

    if ("error" in result) {
      console.log("[loginAction] Error from loginUser:", result.error);
      return { error: result.error };
    }

    console.log("[loginAction] loginUser succeeded, setting cookie");
    const cookieStore = await cookies();
    cookieStore.set("auth_token", result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
    });
    console.log("[loginAction] Cookie set successfully");

    console.log("[loginAction] Login completed successfully");
    return { success: true };
  } catch (err) {
    console.error("[loginAction] Exception caught:", err);
    console.error("[loginAction] Error type:", err instanceof Error ? err.constructor.name : typeof err);
    console.error("[loginAction] Error message:", err instanceof Error ? err.message : String(err));
    if (err instanceof Error && err.stack) {
      console.error("[loginAction] Stack:", err.stack);
    }
    return { error: err instanceof Error ? err.message : "An unexpected error occurred" };
  }
}
