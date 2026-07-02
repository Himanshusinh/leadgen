const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  const campaignId = "cmr322xv90001tvj70b52n040";

  // Simulate removing attachment
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId }
  });
  console.log("Current templateAttachmentName in DB:", campaign.templateAttachmentName);

  const updated = await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      templateAttachmentName: null
    }
  });

  console.log("Updated templateAttachmentName in DB:", updated.templateAttachmentName);
  await prisma.$disconnect();
}

main().catch(console.error);
