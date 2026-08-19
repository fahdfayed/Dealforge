import crypto from "crypto";
import { db } from "@/db/client";
import { teamMembers, sessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { TeamMember } from "@/types/team";

const SALT_ROUNDS = 10;

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, "sha256")
    .toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, hash: string): boolean {
  const [salt, storedHash] = hash.split(":");
  const computedHash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, "sha256")
    .toString("hex");
  return computedHash === storedHash;
}

function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function signup(
  email: string,
  name: string,
  password: string
): Promise<{ user: TeamMember; sessionToken: string } | { error: string }> {
  try {
    const existingUser = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return { error: "Email already registered" };
    }

    const userId = crypto.randomUUID();
    const passwordHash = hashPassword(password);
    const now = Date.now();

    await db.insert(teamMembers).values({
      id: userId,
      email,
      name,
      role: "viewer",
      status: "active",
      passwordHash,
      createdAt: now,
      updatedAt: now,
    });

    const sessionToken = generateSessionToken();
    const expiresAt = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 days

    await db.insert(sessions).values({
      id: crypto.randomUUID(),
      userId,
      token: sessionToken,
      expiresAt,
      createdAt: Math.floor(Date.now() / 1000),
    });

    return {
      user: {
        id: userId,
        email,
        name,
        role: "viewer" as const,
        status: "active" as const,
        createdAt: new Date(now).toISOString(),
        updatedAt: new Date(now).toISOString(),
      },
      sessionToken,
    };
  } catch (error) {
    return { error: "Failed to create account" };
  }
}

export async function login(
  email: string,
  password: string
): Promise<{ user: TeamMember; sessionToken: string } | { error: string }> {
  try {
    const users = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.email, email))
      .limit(1);

    if (users.length === 0) {
      return { error: "Invalid email or password" };
    }

    const user = users[0];

    if (!user.passwordHash) {
      return { error: "Invalid email or password" };
    }

    if (!verifyPassword(password, user.passwordHash)) {
      return { error: "Invalid email or password" };
    }

    const sessionToken = generateSessionToken();
    const expiresAt = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

    await db.insert(sessions).values({
      id: crypto.randomUUID(),
      userId: user.id,
      token: sessionToken,
      expiresAt,
      createdAt: Math.floor(Date.now() / 1000),
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as any,
        status: user.status as any,
        createdAt: new Date(user.createdAt).toISOString(),
        updatedAt: new Date(user.updatedAt).toISOString(),
      },
      sessionToken,
    };
  } catch (error) {
    return { error: "Login failed" };
  }
}

export async function verifySession(token: string): Promise<TeamMember | null> {
  try {
    const sessionRecords = await db
      .select()
      .from(sessions)
      .where(eq(sessions.token, token))
      .limit(1);

    if (sessionRecords.length === 0) {
      return null;
    }

    const session = sessionRecords[0];
    const now = Math.floor(Date.now() / 1000);

    if (session.expiresAt < now) {
      return null;
    }

    const users = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.id, session.userId))
      .limit(1);

    if (users.length === 0) {
      return null;
    }

    const user = users[0];

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as any,
      status: user.status as any,
      createdAt: new Date(user.createdAt).toISOString(),
      updatedAt: new Date(user.updatedAt).toISOString(),
    };
  } catch (error) {
    return null;
  }
}

export async function logout(token: string): Promise<void> {
  try {
    await db.delete(sessions).where(eq(sessions.token, token));
  } catch (error) {
    // Ignore errors on logout
  }
}
