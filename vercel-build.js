const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

try {
  // 1. Read schema.prisma
  const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
  let schema = fs.readFileSync(schemaPath, 'utf8');

  // 2. Replace sqlite with postgresql
  schema = schema.replace(/provider\s*=\s*"sqlite"/g, 'provider = "postgresql"');
  fs.writeFileSync(schemaPath, schema);
  console.log('Successfully switched Prisma provider to postgresql for Vercel build.');

  // 3. Run prisma generate
  execSync('npx prisma generate', { stdio: 'inherit' });

  // 4. Run next build
  execSync('npx next build', { stdio: 'inherit' });

} catch (error) {
  console.error('Build step failed:', error);
  process.exit(1);
}
