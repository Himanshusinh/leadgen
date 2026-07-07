import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const subject = formData.get("subject") as string | null;
    const body = formData.get("body") as string | null;
    const removeAttachment = formData.get("removeAttachment") === "true";
    const file = formData.get("file") as File | null;

    // Load current user details to check for existing attachments
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    let finalAttachmentName = user.masterAttachmentName;

    // Handle attachment deletion
    if (removeAttachment && user.masterAttachmentName) {
      const oldPath = path.join(
        process.cwd(),
        "public",
        "uploads",
        "templates",
        "master",
        user.masterAttachmentName
      );
      try {
        await fs.unlink(oldPath);
      } catch (err) {
        console.error("Failed to delete master attachment file from disk:", err);
      }
      finalAttachmentName = null;
    }

    // Handle new attachment upload
    if (file && file.size > 0) {
      // Ensure the master template directory exists
      const uploadDir = path.join(process.cwd(), "public", "uploads", "templates", "master");
      await fs.mkdir(uploadDir, { recursive: true });

      // If there is a pre-existing different file, clean it up
      if (user.masterAttachmentName && user.masterAttachmentName !== file.name) {
        const oldPath = path.join(uploadDir, user.masterAttachmentName);
        try {
          await fs.unlink(oldPath);
        } catch (err) {
          console.error("Failed to delete stale master attachment:", err);
        }
      }

      const filePath = path.join(uploadDir, file.name);
      const arrayBuffer = await file.arrayBuffer();
      await fs.writeFile(filePath, Buffer.from(arrayBuffer));
      finalAttachmentName = file.name;
    }

    // Update user record with master template settings
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        masterSubject: subject || null,
        masterBody: body || null,
        masterAttachmentName: finalAttachmentName,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        masterSubject: updatedUser.masterSubject,
        masterBody: updatedUser.masterBody,
        masterAttachmentName: updatedUser.masterAttachmentName,
      },
    });
  } catch (error: any) {
    console.error("Master template save error:", error);
    return NextResponse.json({ error: error.message || "Failed to save template." }, { status: 500 });
  }
}
