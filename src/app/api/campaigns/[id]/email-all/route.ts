import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { sendMail } from "@/lib/mail";
import fs from "fs/promises";
import path from "path";

// Helper function to replace placeholders
function replacePlaceholders(template: string, lead: any): string {
  if (!template) return "";
  return template
    .replace(/{businessName}/g, lead.name || "")
    .replace(/{name}/g, lead.name || "")
    .replace(/{rating}/g, lead.rating ? String(lead.rating) : "N/A")
    .replace(/{reviews}/g, lead.reviews ? String(lead.reviews) : "0")
    .replace(/{website}/g, lead.website || "")
    .replace(/{phone}/g, lead.phone || "")
    .replace(/{address}/g, lead.address || "");
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Ensure the campaign belongs to this user.
  const campaign = await prisma.campaign.findFirst({
    where: { id: params.id, userId },
    include: {
      leads: {
        where: {
          email: { not: null },
          emailSentAt: null,
        },
      },
    },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const subjectTemplate = campaign.emailSubject;
  const bodyTemplate = campaign.emailBody;

  if (!subjectTemplate || !bodyTemplate) {
    return NextResponse.json(
      { error: "Please configure and save an email template subject and body first." },
      { status: 400 }
    );
  }

  const leadsToSend = campaign.leads;
  if (leadsToSend.length === 0) {
    return NextResponse.json(
      { error: "No uncontacted leads with email addresses found in this campaign." },
      { status: 400 }
    );
  }

  // Load campaign default template attachment if it exists
  const attachments: Array<{ filename: string; content: Buffer }> = [];
  if (campaign.templateAttachmentName) {
    try {
      const filePath = path.join(
        process.cwd(),
        "public",
        "uploads",
        "templates",
        campaign.id,
        campaign.templateAttachmentName
      );
      const buffer = await fs.readFile(filePath);
      attachments.push({
        filename: campaign.templateAttachmentName,
        content: buffer,
      });
    } catch (e) {
      console.error("Failed to read campaign template attachment for bulk send:", e);
    }
  }

  let sentCount = 0;
  let failCount = 0;

  for (const lead of leadsToSend) {
    if (!lead.email) continue;
    const personalizedSubject = replacePlaceholders(subjectTemplate, lead);
    const personalizedBody = replacePlaceholders(bodyTemplate, lead);

    try {
      const result = await sendMail(
        lead.email,
        personalizedSubject,
        personalizedBody,
        attachments.length > 0 ? attachments : undefined
      );

      if (result.success) {
        await prisma.lead.update({
          where: { id: lead.id },
          data: {
            status: "contacted",
            emailSentAt: new Date(),
          },
        });
        sentCount++;
      } else {
        console.error(`Failed to send email to ${lead.email}:`, result.error);
        failCount++;
      }
    } catch (err) {
      console.error(`Error sending email to ${lead.email}:`, err);
      failCount++;
    }
  }

  return NextResponse.json({
    success: true,
    sentCount,
    failCount,
  });
}
