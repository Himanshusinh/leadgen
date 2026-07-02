import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { NextResponse } from "next/server";

function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  // Escape quotes and wrap if it contains a comma/quote/newline.
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const campaign = await prisma.campaign.findFirst({
    where: { id: params.id, userId },
    include: { leads: { orderBy: { score: "desc" } } },
  });
  if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const headers = [
    "name", "email", "emailStatus", "phone", "website",
    "address", "city", "state", "country", "rating", "reviews", "score", "status",
  ];
  const rows = campaign.leads.map((l) =>
    [
      l.name, l.email, l.emailStatus, l.phone, l.website,
      l.address, l.city, l.state, l.country, l.rating, l.reviews, l.score, l.status,
    ]
      .map(csvCell)
      .join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");

  const safeName = campaign.name.replace(/[^a-z0-9]+/gi, "_").toLowerCase();
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeName}_leads.csv"`,
    },
  });
}
