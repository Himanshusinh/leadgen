import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { enrichLead } from "@/lib/enrich";
import { scoreLead } from "@/lib/scoring";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Ensure the lead belongs to a campaign owned by this user.
  const lead = await prisma.lead.findFirst({
    where: { id: params.id, campaign: { userId } },
  });
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const result = await enrichLead({ email: lead.email, website: lead.website });
  const score = scoreLead({
    email: result.email,
    phone: lead.phone,
    website: lead.website,
    rating: lead.rating,
    reviews: lead.reviews,
  });

  const updated = await prisma.lead.update({
    where: { id: lead.id },
    data: {
      email: result.email ?? lead.email,
      emailSource: result.emailSource ?? lead.emailSource,
      emailStatus: result.emailStatus,
      enriched: true,
      score,
    },
  });

  return NextResponse.json(updated);
}
