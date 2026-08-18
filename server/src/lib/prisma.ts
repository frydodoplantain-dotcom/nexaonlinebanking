import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

// __dirname = server/dist/lib in production
// db is at server/prisma/prisma/dev.db (Prisma resolves relative to schema)
// We need absolute path to ensure it works regardless of CWD
if (!process.env.DATABASE_URL) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  // from dist/lib -> go up to dist -> up to server -> into prisma -> prisma/dev.db
  const dbPath = path.resolve(__dirname, '../../prisma/prisma/dev.db');
  process.env.DATABASE_URL = `file:${dbPath}`;
  console.log('DATABASE_URL set to:', process.env.DATABASE_URL);
}

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});


