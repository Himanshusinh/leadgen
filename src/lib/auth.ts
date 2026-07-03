import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

const COOKIE = "leadgen_session";
const secret = () =>
  new TextEncoder().encode(process.env.JWT_SECRET || "dev-insecure-secret-change-me");

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}

export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());

  cookies().set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearSession() {
  cookies().set(COOKIE, "", { path: "/", maxAge: 0 });
}

/** Returns userId or null. Use in API routes / server components. */
export async function getUserId(): Promise<string | null> {
  const defaultUserId = "default-user-id";
  try {
    const { prisma } = await import("@/lib/db");
    const user = await prisma.user.findUnique({
      where: { id: defaultUserId },
    });
    if (!user) {
      await prisma.user.create({
        data: {
          id: defaultUserId,
          email: "default@leadgen.com",
          password: "insecure-password-auth-bypassed",
          name: "Default User",
        },
      });
    }
  } catch (e) {
    console.error("Failed to ensure default user exists:", e);
  }
  return defaultUserId;
}
