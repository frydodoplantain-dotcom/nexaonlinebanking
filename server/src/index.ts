import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// ── DATABASE_URL ─────────────────────────────────────────────────────────────
// __dirname at runtime = <root>/server/dist
// SQLite db lives at   <root>/server/prisma/dev.db
if (!process.env.DATABASE_URL) {
  const dbPath = path.resolve(__dirname, '../prisma/dev.db');
  process.env.DATABASE_URL = `file:${dbPath}`;
  console.log('[NEXA] DATABASE_URL set to:', process.env.DATABASE_URL);
}

// ── MIDDLEWARE ───────────────────────────────────────────────────────────────
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── API ROUTES ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/crypto', cryptoRoutes);

// ── HEALTH CHECK — responds immediately, no DB dependency ────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

// ── SERVE REACT SPA ──────────────────────────────────────────────────────────
const clientDistPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// ── START SERVER ─────────────────────────────────────────────────────────────
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`[NEXA] Server listening on 0.0.0.0:${PORT}`);

  // Use DIRECT path to prisma binary — avoids npx PATH lookup failures on Railway.
  // __dirname = server/dist  →  ../../node_modules/.bin/prisma = root/node_modules/.bin/prisma
  const prismaBin = path.resolve(__dirname, '../../node_modules/.bin/prisma');
  const schemaPath = path.resolve(__dirname, '../prisma/schema.prisma');

  exec(
    `"${prismaBin}" db push --schema="${schemaPath}" --accept-data-loss --skip-generate`,
    { env: { ...process.env } },
    (err, _stdout, stderr) => {
      if (err) {
        console.error('[NEXA] Schema push error:', stderr || err.message);
      } else {
        console.log('[NEXA] Database schema applied.');
      }
      // Init settings & admin AFTER schema exists — errors are non-fatal
      Promise.all([initDefaultSettings(), initAdminUser()])
        .then(() => console.log('[NEXA] Database initialized successfully.'))
        .catch(e => console.error('[NEXA] DB init error (non-fatal):', e?.message ?? e));
    }
  );
});
