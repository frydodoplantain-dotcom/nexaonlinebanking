import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

if (!process.env.DATABASE_URL) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  process.env.DATABASE_URL = `file:${path.resolve(__dirname, '../../prisma/dev.db')}`;
}

export const prisma = new PrismaClient();

