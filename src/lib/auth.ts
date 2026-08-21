import crypto from "crypto";
import { db } from "@/db/client";
import { teamMembers, sessions } from "@/db/schema";
import { eq, lt } from "drizzle-orm";
import type { TeamMember, UserRole } from "@/types/team";

// Password hashing.
//
// The stored value carries the parameters it was produced with, so the cost can
// be raised later without invalidating every existing password: an old hash
// still verifies against its own iteration count, and is rewritten at the
// current cost the next time that user logs in successfully.
//
// The previous format was a bare `salt:hash` at 100,000 iterations with no
// record of the cost, which is why parameters are explicit now.
const PBKDF2_ITERATIONS = 600_000; // OWASP guidance for PBKDF2-SHA256
const PBKDF2_KEYLEN = 64;
const PBKDF2_DIGEST = "sha256";
const LEGACY_ITERATIONS = 100_000;

function derive(password: string, salt: string, iterations: number): string {
  return crypto.pbkdf2Sync(password, salt, iterations, PBKDF2_KEYLEN, PBKDF2_DIGEST).toString("hex");
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  return `pbkdf2$${PBKDF2_ITERATIONS}$${salt}$${derive(password, salt, PBKDF2_ITERATIONS)}`;
}

type ParsedHash = { salt: string; hash: string; iterations: number; current: boolean };

function parseHash(stored: string): ParsedHash | null {
  if (stored.startsWith("pbkdf2$")) {
    const [, iterations, salt, hash] = stored.split("$");
    const n = Number(iterations);
    if (!salt || !hash || !Number.isFinite(n)) return null;
    return { salt, hash, iterations: n, current: n >= PBKDF2_ITERATIONS };
  }
  // Legacy `salt:hash`, always at the old cost.
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return null;
  return { salt, hash, iterations: LEGACY_ITERATIONS, current: false };
}

// Compared with timingSafeEqual rather than ===, which returns as soon as two
// bytes differ and leaks how much of a guess was correct.
function verifyPassword(password: string, stored: string): boolean {
  const parsed = parseHash(stored);
  if (!parsed) return false;

  const computed = Buffer.from(derive(password, parsed.salt, parsed.iterations), "hex");
  const expected = Buffer.from(parsed.hash, "hex");
  if (computed.length !== expected.length) return false;
  return crypto.timingSafeEqual(computed, expected);
}

// Session tokens.
//
// The raw token goes to the browser; only its SHA-256 lives in the database, so
// read access to the sessions table no longer hands over every live session.
//
// Sessions created before this change stored the raw token and will not match a
// hash lookup, so everyone is signed out once on deploy. That is deliberate:
// distinguishing an old plaintext token from a new hash is impossible — both
// are 64 hex characters — so a migration could not be safely re-run, and
// invalidating sessions is the normal outcome of a credential-handling change.
// A token is 256 bits of entropy, so a fast hash is right here — there is
// nothing to brute-force and per-request logins should stay cheap.
function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;

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
    const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
    await db.insert(sessions).values({
      id: crypto.randomUUID(),
      userId,
      token: hashSessionToken(sessionToken),
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
    console.error("[signup] ERROR:", error);
    console.error("[signup] Error type:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("[signup] Error message:", error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error("[signup] Stack trace:", error.stack);
    }
    const message = error instanceof Error ? error.message : "Failed to create account";
    return { error: message };
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

    // Successful login is the only moment the plaintext password exists, so it
    // is the only chance to re-hash one stored at an outdated cost. Without
    // this, raising the iteration count only ever protects new accounts.
    const parsed = parseHash(user.passwordHash);
    if (parsed && !parsed.current) {
      await db
        .update(teamMembers)
        .set({ passwordHash: hashPassword(password), updatedAt: Date.now() })
        .where(eq(teamMembers.id, user.id));
    }

    // Sessions do not accumulate per login: an old one left live is an old one
    // that can still be stolen.
    await db.delete(sessions).where(eq(sessions.userId, user.id));
    const sessionToken = generateSessionToken();
    const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;

    await db.insert(sessions).values({
      id: crypto.randomUUID(),
      userId: user.id,
      token: hashSessionToken(sessionToken),
      expiresAt,
      createdAt: Math.floor(Date.now() / 1000),
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as UserRole,
        status: user.status as TeamMember["status"],
        createdAt: new Date(user.createdAt).toISOString(),
        updatedAt: new Date(user.updatedAt).toISOString(),
      },
      sessionToken,
    };
  } catch (error) {
    console.error("[login] ERROR:", error);
    console.error("[login] Error type:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("[login] Error message:", error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error("[login] Stack trace:", error.stack);
    }
    return { error: "Login failed" };
  }
}

export async function verifySession(token: string): Promise<TeamMember | null> {
  try {
    const sessionRecords = await db
      .select()
      .from(sessions)
      .where(eq(sessions.token, hashSessionToken(token)))
      .limit(1);

    if (sessionRecords.length === 0) {
      return null;
    }

    const session = sessionRecords[0];
    const now = Math.floor(Date.now() / 1000);

    if (session.expiresAt < now) {
      // Expired rows were previously left behind forever. Clearing them on the
      // way past keeps the table from growing without a scheduled job.
      await db.delete(sessions).where(lt(sessions.expiresAt, now));
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

    // A deactivated member kept working until their session expired, which
    // meant removing someone from the team did not remove their access.
    if (user.status !== "active") return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
      status: user.status as TeamMember["status"],
      createdAt: new Date(user.createdAt).toISOString(),
      updatedAt: new Date(user.updatedAt).toISOString(),
    };
  } catch (error) {
    return null;
  }
}

export async function logout(token: string): Promise<void> {
  try {
    await db.delete(sessions).where(eq(sessions.token, hashSessionToken(token)));
  } catch (error) {
    // Ignore errors on logout
  }
}
