import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import NewCampaignForm from "@/components/NewCampaignForm";
import LogoutButton from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const userId = await getUserId();
  if (!userId) redirect("/login");

  const campaigns = await prisma.campaign.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { leads: true } } },
  });

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Campaigns</h1>
          <p className="text-sm text-slate-500">Create a campaign, then fetch & enrich leads.</p>
        </div>
        <LogoutButton />
      </header>

      <div className="mt-8 grid gap-8 md:grid-cols-[360px_1fr]">
        <NewCampaignForm />

        <section>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Your campaigns</h2>
          {campaigns.length === 0 ? (
            <p className="mt-4 text-slate-500">No campaigns yet. Create one to get started.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {campaigns.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/dashboard/campaigns/${c.id}`}
                    className="block rounded-xl border border-slate-200 bg-white p-4 hover:border-brand-500 hover:shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{c.name}</span>
                      <span className="text-sm text-slate-500">{c._count.leads} leads</span>
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      {c.industry}
                      {[c.city, c.state, c.country].filter(Boolean).length > 0 &&
                        ` · ${[c.city, c.state, c.country].filter(Boolean).join(", ")}`}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
