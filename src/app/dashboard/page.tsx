import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import NewCampaignForm from "@/components/NewCampaignForm";
import CampaignsList from "@/components/CampaignsList";

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
      <header className="flex items-center justify-between border-b border-slate-100 pb-5 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Campaigns & Leads</h1>
          <p className="text-sm text-slate-500 mt-1">Create marketing outreach campaigns, then discover and enrich target business leads.</p>
        </div>
      </header>

      <div className="mt-8 grid gap-8 md:grid-cols-[360px_1fr]">
        <NewCampaignForm />

        <section>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Your campaigns</h2>
          {campaigns.length === 0 ? (
            <p className="mt-4 text-slate-500">No campaigns yet. Create one to get started.</p>
          ) : (
            <CampaignsList initialCampaigns={campaigns} />
          )}
        </section>
      </div>
    </main>
  );
}
