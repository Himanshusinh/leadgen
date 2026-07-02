import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";

export async function POST(req: Request) {
  const { email, password, name } = await req.json().catch(() => ({}));
  if (!email || !password || password.length < 6) {
    return NextResponse.json(
      { error: "Email and a password of at least 6 characters are required." },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: { email, name: name || null, password: await hashPassword(password) },
  });
  await createSession(user.id);
  return NextResponse.json({ id: user.id, email: user.email });
}
