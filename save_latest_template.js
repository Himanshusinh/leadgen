const fs = require('fs');
const readline = require('readline');
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  const transcriptPath = '/Users/himanshu/.gemini/antigravity-ide/brain/cee87a99-029c-4804-b691-198e29ea59de/.system_generated/logs/transcript_full.jsonl';

  const fileStream = fs.createReadStream(transcriptPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let htmlContent = '';
  let foundStep = -1;

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);
      if (obj.type === 'USER_INPUT' && obj.content && obj.content.includes('<!DOCTYPE html>') && obj.content.includes('FLYBIT Dynamics')) {
        const match = obj.content.match(/(<!DOCTYPE html>[\s\S]*<\/html>)/i);
        if (match) {
          htmlContent = match[1];
          foundStep = obj.step_index;
        } else {
          // If no </html> tag (e.g. cut off/truncated), match up to the end of the content
          const partialMatch = obj.content.match(/(<!DOCTYPE html>[\s\S]*)/i);
          if (partialMatch) {
            htmlContent = partialMatch[1] + "\n</div>\n</div>\n</body>\n</html>"; // Close tags manually
            foundStep = obj.step_index;
          }
        }
      }
    } catch (e) {
      // Ignore
    }
  }

  if (!htmlContent) {
    console.error("Could not extract any HTML template from transcript logs!");
    process.exit(1);
  }

  console.log(`Found template in step ${foundStep}, length: ${htmlContent.length}`);

  const campaignId = "cmr322xv90001tvj70b52n040";
  const subject = "Light Up Your Event With India's Premier Drone Show Experience";

  const updated = await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      emailSubject: subject,
      emailBody: htmlContent
    }
  });

  console.log("Database updated successfully!");
  console.log("Campaign ID:", updated.id);
  console.log("Body length:", updated.emailBody.length);

  await prisma.$disconnect();
}

main().catch(console.error);
