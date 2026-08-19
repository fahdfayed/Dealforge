"use server";

import { cookies } from "next/headers";
import { logout } from "@/lib/auth";

export async function logoutAction() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (token) {
    await logout(token);
  }

  cookieStore.delete("auth_token");
}
