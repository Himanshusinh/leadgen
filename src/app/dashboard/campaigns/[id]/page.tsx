import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import CampaignActions from "@/components/CampaignActions";
import LeadsTable from "@/components/LeadsTable";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export default async function CampaignPage({ params }: { params: { id: string } }) {
  const userId = await getUserId();
  if (!userId) redirect("/login");

  // Read email template file from workspace root if it exists
  const templateFilePath = path.join(process.cwd(), "email_template.html");
  let templateFileContent: string | null = null;
  if (fs.existsSync(templateFilePath)) {
    try {
      templateFileContent = fs.readFileSync(templateFilePath, "utf8");
    } catch (e) {
      console.error("Failed to read template file:", e);
    }
  }

  let campaign = await prisma.campaign.findFirst({
    where: { id: params.id, userId },
    include: { leads: { orderBy: [{ score: "desc" }, { createdAt: "desc" }] } },
  });
  if (!campaign) notFound();

  // Load current user profile details to get master template configurations
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      masterSubject: true,
      masterBody: true,
      masterAttachmentName: true,
    },
  });

  const activeMasterSubject = user?.masterSubject || "Drone Light Show · India";
  const activeMasterBody = user?.masterBody || templateFileContent || "";
  const activeMasterAttachment = user?.masterAttachmentName || null;

  // If the campaign template has not been customized via the UI, or is empty,
  // automatically sync it from the User's master template settings.
  if (!campaign.isCustomTemplate || !campaign.emailBody) {
    const hasSubjectChanged = campaign.emailSubject !== activeMasterSubject;
    const hasBodyChanged = campaign.emailBody !== activeMasterBody;
    const hasAttachmentChanged = campaign.templateAttachmentName !== activeMasterAttachment;

    if (hasSubjectChanged || hasBodyChanged || hasAttachmentChanged) {
      // If there is a master attachment file, copy it to the campaign's uploads directory
      if (activeMasterAttachment) {
        try {
          const masterFilePath = path.join(
            process.cwd(),
            "public",
            "uploads",
            "templates",
            "master",
            activeMasterAttachment
          );
          const campaignUploadDir = path.join(process.cwd(), "public", "uploads", "templates", campaign.id);
          await fs.promises.mkdir(campaignUploadDir, { recursive: true });
          const campaignFilePath = path.join(campaignUploadDir, activeMasterAttachment);
          await fs.promises.copyFile(masterFilePath, campaignFilePath);
        } catch (err) {
          console.error("Failed to copy master template attachment to campaign upload directory:", err);
        }
      }

      campaign = await prisma.campaign.update({
        where: { id: campaign.id },
        data: {
          emailSubject: activeMasterSubject,
          emailBody: activeMasterBody,
          templateAttachmentName: activeMasterAttachment,
        },
        include: { leads: { orderBy: [{ score: "desc" }, { createdAt: "desc" }] } },
      });
    }
  }

  const uncontactedEmailCount = campaign.leads.filter(l => l.email && !l.emailSentAt).length;
  const hasTemplate = !!(campaign.emailSubject && campaign.emailBody);
  const location = [campaign.city, campaign.state, campaign.country].filter(Boolean).join(", ");

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <Link href="/dashboard" className="text-sm text-brand-600">← Back to campaigns</Link>

      <header className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{campaign.name}</h1>
          <p className="text-sm text-slate-500">
            {campaign.industry}{location && ` · ${location}`} · {campaign.leads.length} leads
          </p>
        </div>
        <CampaignActions
          campaignId={campaign.id}
          leadCount={campaign.leads.length}
          initialSubject={campaign.emailSubject}
          initialBody={campaign.emailBody}
          initialAttachmentName={campaign.templateAttachmentName}
          uncontactedEmailCount={uncontactedEmailCount}
          hasTemplate={hasTemplate}
        />
      </header>

      <div className="mt-8">
        <LeadsTable
          leads={campaign.leads}
          initialSubject={campaign.emailSubject}
          initialBody={campaign.emailBody}
          campaignAttachmentName={campaign.templateAttachmentName}
        />
      </div>
    </main>
  );
}
