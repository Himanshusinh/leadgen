import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { fetchPlaces } from "@/lib/places";
import { scoreLead } from "@/lib/scoring";

/**
 * Phase 1 core: fetch businesses for this campaign's industry + location,
 * dedupe against existing leads, score them, and persist.
 */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const campaign = await prisma.campaign.findFirst({ where: { id: params.id, userId } });
  if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let raw;
  try {
    raw = await fetchPlaces({
      industry: campaign.industry,
      city: campaign.city,
      state: campaign.state,
      country: campaign.country,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Fetch failed" }, { status: 502 });
  }

  let inserted = 0;
  let skipped = 0;

  for (const r of raw) {
    // Dedupe key: prefer Google placeId, else normalised name.
    const dedupeKey = (r.placeId || r.name).toLowerCase().trim();

    const score = scoreLead({
      email: null,
      phone: r.phone,
      website: r.website,
      rating: r.rating,
      reviews: r.reviews,
    });

    try {
      await prisma.lead.create({
        data: {
          campaignId: campaign.id,
          name: r.name,
          website: r.website ?? null,
          phone: r.phone ?? null,
          address: r.address ?? null,
          city: campaign.city,
          state: campaign.state,
          country: campaign.country,
          rating: r.rating ?? null,
          reviews: r.reviews ?? null,
          placeId: r.placeId ?? null,
          dedupeKey,
          emailSource: "places",
          score,
        },
      });
      inserted++;
    } catch (e: any) {
      // Unique constraint (campaignId, dedupeKey) -> duplicate, skip it.
      if (e?.code === "P2002") skipped++;
      else throw e;
    }
  }

  return NextResponse.json({ inserted, skipped, total: raw.length });
}
