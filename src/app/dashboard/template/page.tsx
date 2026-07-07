import { redirect } from "next/navigation";
import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import MasterTemplateForm from "@/components/MasterTemplateForm";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export default async function MasterTemplatePage() {
  const userId = await getUserId();
  if (!userId) redirect("/login");

  // Read default file template from workspace root if it exists
  const templateFilePath = path.join(process.cwd(), "email_template.html");
  let defaultFileContent = "";
  if (fs.existsSync(templateFilePath)) {
    try {
      defaultFileContent = fs.readFileSync(templateFilePath, "utf8");
    } catch (e) {
      console.error("Failed to read default template file:", e);
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      masterSubject: true,
      masterBody: true,
      masterAttachmentName: true,
    },
  });

  const subject = user?.masterSubject || "Drone Light Show · India";
  const body = user?.masterBody || defaultFileContent;
  const attachmentName = user?.masterAttachmentName || null;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <MasterTemplateForm
        initialSubject={subject}
        initialBody={body}
        initialAttachmentName={attachmentName}
      />
    </main>
  );
}
