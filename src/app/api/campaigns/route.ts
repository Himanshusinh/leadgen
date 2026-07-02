import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const campaigns = await prisma.campaign.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { leads: true } } },
  });
  return NextResponse.json(campaigns);
}

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, industry, country, state, city } = await req.json().catch(() => ({}));
  if (!industry) {
    return NextResponse.json({ error: "Industry / niche is required." }, { status: 400 });
  }

  const campaign = await prisma.campaign.create({
    data: {
      userId,
      industry,
      name: name || `${industry} — ${[city, state, country].filter(Boolean).join(", ") || "All"}`,
      country: country || null,
      state: state || null,
      city: city || null,
    },
  });
  return NextResponse.json(campaign);
}
