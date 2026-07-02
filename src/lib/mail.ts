import nodemailer from "nodemailer";

const host = process.env.SMTP_HOST || "smtp.gmail.com";
const port = parseInt(process.env.SMTP_PORT || "587", 10);
const user = process.env.SMTP_USER || "";
const pass = process.env.SMTP_PASS || "";
const fromName = process.env.SMTP_FROM_NAME || "LeadGen Outreach";
const fromEmail = process.env.SMTP_FROM_EMAIL || user;

const isConfigured = !!(user && pass);

let transporter: nodemailer.Transporter | null = null;

if (isConfigured) {
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
}

export type MailAttachment = {
  filename: string;
  content?: Buffer;
  path?: string;
  cid?: string;
};

export async function sendMail(
  to: string,
  subject: string,
  text: string,
  attachments?: MailAttachment[]
) {
  if (!isConfigured) {
    console.log("=========================================");
    console.log(`[SMTP SIMULATION] Sending email to: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${text}`);
    if (attachments && attachments.length > 0) {
      console.log(`Attachments: ${attachments.map((a) => a.filename).join(", ")}`);
    }
    console.log("=========================================");
    // Simulate delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { success: true, messageId: "simulated-msg-id" };
  }

  try {
    const isHtml = /<[a-z][\s\S]*>/i.test(text);
    const info = await transporter!.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      text: isHtml ? text.replace(/<[^>]*>/g, "") : text,
      html: isHtml ? text : text.replace(/\n/g, "<br>"),
      attachments,
    });
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("Nodemailer send error:", error);
    return { success: false, error: error.message || String(error) };
  }
}
