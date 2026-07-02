import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { enrichLead } from "@/lib/enrich";
import { scoreLead } from "@/lib/scoring";

/**
 * Phase 2: enrich every not-yet-enriched lead in the campaign —
 * find an email (Hunter), verify it (NeverBounce), then re-score.
 *
 * Runs sequentially with a small cap so a single request stays well within
 * provider rate limits. For large campaigns this is the job you'd move to a
 * BullMQ/Celery worker (see roadmap Phase 3).
 */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const campaign = await prisma.campaign.findFirst({ where: { id: params.id, userId } });
  if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const leads = await prisma.lead.findMany({
    where: { campaignId: campaign.id, enriched: false },
    take: 25, // cap per request; call again to continue
  });

  let processed = 0;
  let withEmail = 0;

  for (const lead of leads) {
    const result = await enrichLead({ email: lead.email, website: lead.website });
    const score = scoreLead({
      email: result.email,
      phone: lead.phone,
      website: lead.website,
      rating: lead.rating,
      reviews: lead.reviews,
    });

    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        email: result.email ?? lead.email,
        emailSource: result.emailSource ?? lead.emailSource,
        emailStatus: result.emailStatus,
        enriched: true,
        score,
      },
    });

    processed++;
    if (result.email) withEmail++;
  }

  const remaining = await prisma.lead.count({
    where: { campaignId: campaign.id, enriched: false },
  });

  return NextResponse.json({ processed, withEmail, remaining });
}
