import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import customerRoutes from './routes/customer.js';
import transferRoutes from './routes/transfers.js';
import loanRoutes from './routes/loans.js';
import cardRoutes from './routes/cards.js';
import supportRoutes from './routes/support.js';
import adminRoutes from './routes/admin.js';
import cryptoRoutes from './routes/crypto.js';
import { errorHandler } from './middleware/errorHandler.js';
import { initDefaultSettings, initAdminUser } from './services/settingsService.js';
import { execSync } from 'child_process';


const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// __dirname = server/dist at runtime
// SQLite file lives at server/prisma/dev.db  → one level up from dist, then into prisma
if (!process.env.DATABASE_URL) {
  const dbPath = path.resolve(__dirname, '../prisma/dev.db');
  process.env.DATABASE_URL = `file:${dbPath}`;
  console.log('[NEXA] DATABASE_URL auto-set to:', process.env.DATABASE_URL);
}

// Push schema at startup so DB file + tables always exist (safe on SQLite)
try {
  const schemaPath = path.resolve(__dirname, '../prisma/schema.prisma');
  execSync(
    `npx prisma db push --schema="${schemaPath}" --accept-data-loss --skip-generate`,
    { stdio: 'pipe', env: { ...process.env } }
  );
  console.log('[NEXA] Database schema applied.');
} catch (e: any) {
  console.error('[NEXA] Schema push failed (non-fatal):', e?.message ?? e);
}



app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/crypto', cryptoRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

// Serve client static files in production
const clientDistPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

const server = app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`NEXA Bank production server listening on 0.0.0.0:${PORT}`);
});

Promise.all([initDefaultSettings(), initAdminUser()]).catch(err => {
  console.error('Async initialization error:', err);
});


