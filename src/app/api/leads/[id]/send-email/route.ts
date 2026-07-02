import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { sendMail } from "@/lib/mail";
import fs from "fs/promises";
import path from "path";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Ensure the lead belongs to a campaign owned by this user.
  const lead = await prisma.lead.findFirst({
    where: { id: params.id, campaign: { userId } },
    include: { campaign: true },
  });
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const contentType = req.headers.get("content-type") || "";
  let subject = "";
  let body = "";
  const attachments: Array<{ filename: string; content: Buffer }> = [];

  if (contentType.includes("multipart/form-data")) {
    try {
      const formData = await req.formData();
      subject = (formData.get("subject") as string) || "";
      body = (formData.get("body") as string) || "";
      const file = formData.get("file") as File | null;

      if (file && file.size > 0) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        attachments.push({
          filename: file.name,
          content: buffer,
        });
      }
    } catch (e: any) {
      return NextResponse.json({ error: "Failed to parse form data: " + e.message }, { status: 400 });
    }
  } else {
    try {
      const bodyData = await req.json();
      subject = bodyData.subject || "";
      body = bodyData.body || "";
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
  }

  if (!subject || !body) {
    return NextResponse.json({ error: "Subject and body are required" }, { status: 400 });
  }

  if (!lead.email) {
    return NextResponse.json({ error: "Lead does not have an email address" }, { status: 400 });
  }

  // If no email-specific attachment was uploaded, try to attach the campaign template document
  if (attachments.length === 0 && lead.campaign.templateAttachmentName) {
    try {
      const filePath = path.join(
        process.cwd(),
        "public",
        "uploads",
        "templates",
        lead.campaignId,
        lead.campaign.templateAttachmentName
      );
      const buffer = await fs.readFile(filePath);
      attachments.push({
        filename: lead.campaign.templateAttachmentName,
        content: buffer,
      });
    } catch (e) {
      console.error("Failed to read campaign template attachment:", e);
    }
  }

  const result = await sendMail(lead.email, subject, body, attachments.length > 0 ? attachments : undefined);

  if (!result.success) {
    return NextResponse.json({ error: result.error || "Failed to send email" }, { status: 500 });
  }

  const updated = await prisma.lead.update({
    where: { id: lead.id },
    data: {
      status: "contacted",
      emailSentAt: new Date(),
    },
  });

  return NextResponse.json(updated);
}
