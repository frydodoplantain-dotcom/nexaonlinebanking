import 'dotenv/config';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./prisma/dev.db';
}

console.log('Ensuring database schema with DATABASE_URL:', process.env.DATABASE_URL);

try {
  const schemaPath = path.join(__dirname, 'prisma/schema.prisma');
  execSync(`npx prisma db push --schema="${schemaPath}"`, {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL,
    },
  });
} catch (err) {
  console.error('Schema push warning:', err.message);
}

console.log('Starting NEXA Bank Server...');
import('./dist/index.js');
