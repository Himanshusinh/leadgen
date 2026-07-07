import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { sendMail } from "@/lib/mail";
import fs from "fs/promises";
import path from "path";

// Helper function to capitalize and extract email prefix as name placeholder
function replaceCustomPlaceholders(template: string, email: string): string {
  if (!template) return "";
  const prefix = email.split("@")[0];
  const capitalizedPrefix = prefix.charAt(0).toUpperCase() + prefix.slice(1);

  return template
    .replace(/{businessName}/g, capitalizedPrefix)
    .replace(/{name}/g, capitalizedPrefix)
    .replace(/{rating}/g, "N/A")
    .replace(/{reviews}/g, "0")
    .replace(/{website}/g, "")
    .replace(/{phone}/g, "")
    .replace(/{address}/g, "");
}

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let emailsString = "";
  try {
    const bodyData = await req.json();
    emailsString = bodyData.emails || "";
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON body payload" }, { status: 400 });
  }

  // Parse emails
  const emails = emailsString
    .split(/[\s,;\n]+/)
    .map((e) => e.trim())
    .filter((e) => e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

  if (emails.length === 0) {
    return NextResponse.json({ error: "No valid email addresses provided" }, { status: 400 });
  }

  // Load master template from User settings
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      masterSubject: true,
      masterBody: true,
      masterAttachmentName: true,
    },
  });

  let subject = "Drone Light Show · India";
  let templateBody = "";
  const attachments: Array<{ filename: string; content: Buffer }> = [];

  if (user && user.masterSubject && user.masterBody) {
    subject = user.masterSubject;
    templateBody = user.masterBody;

    // Load attachment if it exists
    if (user.masterAttachmentName) {
      try {
        const filePath = path.join(
          process.cwd(),
          "public",
          "uploads",
          "templates",
          "master",
          user.masterAttachmentName
        );
        const buffer = await fs.readFile(filePath);
        attachments.push({
          filename: user.masterAttachmentName,
          content: buffer,
        });
      } catch (e) {
        console.error("Failed to read master template attachment for direct send:", e);
      }
    }
  } else {
    // Fallback: Read template from email_template.html on disk
    try {
      const templatePath = path.join(process.cwd(), "email_template.html");
      templateBody = await fs.readFile(templatePath, "utf8");
    } catch (e) {
      return NextResponse.json({ error: "Failed to load master email template from disk" }, { status: 500 });
    }
  }

  let sentCount = 0;
  let failCount = 0;

  for (const email of emails) {
    const personalizedSubject = replaceCustomPlaceholders(subject, email);
    const personalizedBody = replaceCustomPlaceholders(templateBody, email);

    try {
      const result = await sendMail(
        email,
        personalizedSubject,
        personalizedBody,
        attachments.length > 0 ? attachments : undefined
      );

      if (result.success) {
        sentCount++;
      } else {
        console.error(`Failed to send email to custom address ${email}:`, result.error);
        failCount++;
      }
    } catch (err) {
      console.error(`Error sending email to custom address ${email}:`, err);
      failCount++;
    }
  }

  return NextResponse.json({
    success: true,
    sentCount,
    failCount,
  });
}
