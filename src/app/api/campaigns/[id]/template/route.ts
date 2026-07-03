import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Ensure the campaign belongs to this user.
  const campaign = await prisma.campaign.findFirst({
    where: { id: params.id, userId },
  });
  if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const contentType = req.headers.get("content-type") || "";
  let subject = "";
  let body = "";
  let templateAttachmentName = campaign.templateAttachmentName;

  if (contentType.includes("multipart/form-data")) {
    try {
      const formData = await req.formData();
      subject = (formData.get("subject") as string) || "";
      body = (formData.get("body") as string) || "";
      const removeAttachment = formData.get("removeAttachment") as string;
      const file = formData.get("file") as File | null;

      console.log("API Template POST payload:", {
        subject,
        bodyLength: body.length,
        removeAttachment,
        file: file ? { name: file.name, size: file.size } : null,
      });

      if (removeAttachment === "true") {
        if (campaign.templateAttachmentName) {
          try {
            const oldFilePath = path.join(
              process.cwd(),
              "public",
              "uploads",
              "templates",
              params.id,
              campaign.templateAttachmentName
            );
            await fs.unlink(oldFilePath);
          } catch (e) {
            // Ignore if file doesn't exist
          }
        }
        templateAttachmentName = null;
      }

      if (file && file.size > 0) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const uploadDir = path.join(process.cwd(), "public", "uploads", "templates", params.id);
        await fs.mkdir(uploadDir, { recursive: true });
        const filePath = path.join(uploadDir, file.name);
        await fs.writeFile(filePath, buffer);
        templateAttachmentName = file.name;
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

  const updated = await prisma.campaign.update({
    where: { id: params.id },
    data: {
      emailSubject: subject || null,
      emailBody: body || null,
      templateAttachmentName,
      isCustomTemplate: true,
    },
  });

  return NextResponse.json({ ok: true, campaign: updated });
}
