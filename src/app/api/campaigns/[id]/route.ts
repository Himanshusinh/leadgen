import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const campaign = await prisma.campaign.findFirst({
    where: { id: params.id, userId },
    include: { leads: { orderBy: [{ score: "desc" }, { createdAt: "desc" }] } },
  });
  if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(campaign);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const owned = await prisma.campaign.findFirst({ where: { id: params.id, userId } });
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.campaign.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
