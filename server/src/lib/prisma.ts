import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

// __dirname = server/dist/lib at runtime
// SQLite db is at server/prisma/dev.db → two levels up from lib, then into prisma
if (!process.env.DATABASE_URL) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const dbPath = path.resolve(__dirname, '../../prisma/dev.db');
  process.env.DATABASE_URL = `file:${dbPath}`;
  console.log('[NEXA prisma] DATABASE_URL auto-set to:', process.env.DATABASE_URL);
}

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});


