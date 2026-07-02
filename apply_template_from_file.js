const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();

  const templatePath = '/Users/himanshu/code/leadgen/email_template.html';
  if (!fs.existsSync(templatePath)) {
    console.error("Template file not found at " + templatePath);
    process.exit(1);
  }

  const htmlContent = fs.readFileSync(templatePath, 'utf8');
  console.log("Read HTML template from file. Length:", htmlContent.length);

  const result = await prisma.campaign.updateMany({
    data: {
      emailBody: htmlContent
    }
  });

  console.log(`Database successfully updated ${result.count} campaign templates!`);

  await prisma.$disconnect();
}

main().catch(console.error);
