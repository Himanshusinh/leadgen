const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
let originalSchema = '';

try {
  // 1. Read schema.prisma
  originalSchema = fs.readFileSync(schemaPath, 'utf8');

  // 2. Replace sqlite with postgresql
  const updatedSchema = originalSchema.replace(/provider\s*=\s*"sqlite"/g, 'provider = "postgresql"');
  fs.writeFileSync(schemaPath, updatedSchema);
  console.log('Successfully switched Prisma provider to postgresql for Vercel build.');

  // 3. Run prisma generate
  execSync('npx prisma generate', { stdio: 'inherit' });

  // 4. Run next build
  execSync('npx next build', { stdio: 'inherit' });

} catch (error) {
  console.error('Build step failed:', error);
  process.exit(1);
} finally {
  // 5. Restore original schema.prisma so local dev is unaffected
  if (originalSchema) {
    fs.writeFileSync(schemaPath, originalSchema);
    console.log('Successfully restored original Prisma schema provider.');

    // Regenerate the local SQLite Prisma Client
    try {
      execSync('npx prisma generate', { stdio: 'inherit' });
      console.log('Successfully regenerated local Prisma client.');
    } catch (err) {
      console.error('Failed to regenerate local Prisma client:', err);
    }
  }
}
